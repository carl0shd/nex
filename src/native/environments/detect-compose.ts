import { parse as parseYaml } from "yaml";
import type { EnvBuild, EnvHostPort, EnvMount, EnvServiceDef } from "@native/db/types";
import {
  APP_MEMORY_MB,
  clampMemory,
  IMAGE_MEMORY_MB,
  imageRepository,
  joinCommand,
  knownImage,
  slugName,
} from "./definition";
import { attachSeed, seedFile, type Detected } from "./detect-stack";
import { hasStage, parseDockerfile } from "./dockerfile";
import { interpolate, parseEnvFile } from "./env-file";
import { repoPath, type ProjectFiles } from "./project-files";

export const COMPOSE_FILES = [
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
  "compose.local.yaml",
  "compose.local.yml",
  "docker-compose.local.yaml",
  "docker-compose.local.yml",
  "compose.dev.yaml",
  "compose.dev.yml",
  "docker-compose.dev.yaml",
  "docker-compose.dev.yml",
];

const UNSUPPORTED_KEYS = [
  "network_mode",
  "privileged",
  "extends",
  "devices",
  "pid",
  "ipc",
  "userns_mode",
];

const SEED_DIR = "/docker-entrypoint-initdb.d";
const PROXIES = new Set(["traefik", "nginx-proxy", "caddy-docker-proxy"]);

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];

const scalar = (value: unknown): string | undefined =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : undefined;

function listPhrase(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function deepInterpolate(
  value: unknown,
  vars: Readonly<Record<string, string>>,
  missing: Set<string>,
): unknown {
  if (typeof value === "string") {
    const result = interpolate(value, vars);
    for (const name of result.missing) missing.add(name);
    return result.value;
  }
  if (Array.isArray(value)) return value.map((item) => deepInterpolate(item, vars, missing));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepInterpolate(item, vars, missing)]),
    );
  }
  return value;
}

const MAX_RANGE = 100;

function portRange(text: string): number[] | null {
  if (text === "") return [];
  const [from, to = from] = text.split("-").map((part) => Number(part));
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) return null;
  if (to - from >= MAX_RANGE) return null;
  return Array.from({ length: to - from + 1 }, (_, index) => (from as number) + index);
}

export interface PublishedPorts {
  ports: EnvHostPort[];
  unreadable?: string;
}

export function publishedPorts(spec: unknown): PublishedPorts {
  if (isRecord(spec)) {
    const target = portRange(scalar(spec.target) ?? "");
    const published = portRange(scalar(spec.published) ?? "");
    const container = target?.[0];
    if (!container) return { ports: [], unreadable: JSON.stringify(spec) };
    return { ports: [{ host: published?.[0] ?? container, container }] };
  }
  const text = scalar(spec)?.trim();
  if (!text) return { ports: [] };
  const withoutProtocol = text.split("/")[0] ?? "";
  const withoutIp = withoutProtocol.startsWith("[")
    ? withoutProtocol.slice(withoutProtocol.indexOf("]:") + 2)
    : withoutProtocol;
  const parts = withoutIp.split(":");
  const containers = portRange(parts.at(-1) ?? "");
  const hosts = parts.length >= 2 ? portRange(parts.at(-2) ?? "") : [];
  if (!containers?.length || hosts === null) return { ports: [], unreadable: text };
  if (hosts.length === 0)
    return { ports: containers.map((port) => ({ host: port, container: port })) };
  if (hosts.length === containers.length) {
    return {
      ports: containers.map((port, index) => ({ host: hosts[index] as number, container: port })),
    };
  }
  return { ports: [{ host: hosts[0] as number, container: containers[0] as number }] };
}

export function memoryMb(value: unknown): number | undefined {
  const text = scalar(value)?.trim().toLowerCase();
  if (!text) return undefined;
  const match = /^(\d+(?:\.\d+)?)\s*([kmgt]?)i?b?$/.exec(text);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = match[2] ?? "";
  const factor = { "": 1 / 1024 / 1024, k: 1 / 1024, m: 1, g: 1024, t: 1024 * 1024 }[unit] ?? 1;
  return Math.round(amount * factor);
}

export function environmentEntries(value: unknown, vars: Readonly<Record<string, string>>) {
  const env: Record<string, string> = {};
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = scalar(item);
      if (!text) continue;
      const equals = text.indexOf("=");
      if (equals === -1) {
        if (text in vars) env[text] = vars[text] as string;
      } else {
        env[text.slice(0, equals)] = text.slice(equals + 1);
      }
    }
  } else if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const text = scalar(item);
      if (text !== undefined) env[key] = text;
      else if (key in vars) env[key] = vars[key] as string;
    }
  }
  return env;
}

export function dependencies(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(scalar).filter((item): item is string => Boolean(item));
  return isRecord(value) ? Object.keys(value) : [];
}

export function healthcheck(value: unknown): string[] | undefined {
  if (!isRecord(value) || value.disable === true) return undefined;
  const test = value.test;
  if (typeof test === "string") return test === "NONE" ? undefined : ["sh", "-c", test];
  if (!Array.isArray(test)) return undefined;
  const [kind, ...rest] = test.map(String);
  if (kind === "CMD") return rest.length ? rest : undefined;
  if (kind === "CMD-SHELL") return rest.length ? ["sh", "-c", rest.join(" ")] : undefined;
  return undefined;
}

interface Mount {
  type: "bind" | "volume" | "anonymous";
  source: string;
  target: string;
  readOnly: boolean;
}

export function mounts(value: unknown): Mount[] {
  return asList(value).flatMap((item): Mount[] => {
    if (isRecord(item)) {
      const target = scalar(item.target);
      if (!target || item.type === "tmpfs") return [];
      const source = scalar(item.source) ?? "";
      const type = item.type === "bind" ? "bind" : source ? "volume" : "anonymous";
      return [{ type, source, target, readOnly: item.read_only === true }];
    }
    const text = scalar(item);
    if (!text) return [];
    const parts = text.split(":");
    if (parts.length === 1)
      return [{ type: "anonymous", source: "", target: text, readOnly: false }];
    const [source = "", target = "", mode = ""] = parts;
    const bind = /^[./~]/.test(source);
    return [
      {
        type: bind ? "bind" : "volume",
        source,
        target,
        readOnly: mode.split(",").includes("ro"),
      },
    ];
  });
}

const insideProject = (source: string) =>
  /^\.\.?(\/|$)/.test(source) && !repoPath(source).startsWith("..");

function commandText(value: unknown): string | undefined {
  if (Array.isArray(value)) return joinCommand(value.map(String));
  return scalar(value);
}

const REMOTE_CONTEXT = /^[a-z][a-z0-9+.-]*:\/\/|^git@|\.git(#|$)/i;

interface ServiceResult {
  service?: EnvServiceDef;
  files: string[];
  warnings: string[];
  namedVolumes: string[];
}

async function buildSection(
  files: ProjectFiles,
  name: string,
  raw: Raw,
  vars: Readonly<Record<string, string>>,
): Promise<{ build?: EnvBuild; files: string[]; warnings: string[] }> {
  const section = isRecord(raw.build) ? raw.build : { context: scalar(raw.build) };
  const rawContext = scalar(section.context) ?? ".";
  if (section.dockerfile_inline !== undefined) {
    return { files: [], warnings: [`${name} uses an inline Dockerfile, so Nex skips it.`] };
  }
  if (REMOTE_CONTEXT.test(rawContext) || repoPath(rawContext).startsWith("..")) {
    return { files: [], warnings: [`${name} builds from outside the project, so Nex skips it.`] };
  }
  const context = repoPath(rawContext);
  const dockerfile = repoPath(context, scalar(section.dockerfile) ?? "Dockerfile");
  const target = scalar(section.target);
  const args = environmentEntries(section.args, vars);
  const build: EnvBuild = {
    context,
    dockerfile,
    ...(target ? { target } : {}),
    ...(Object.keys(args).length ? { args } : {}),
  };
  const text = await files.read(dockerfile);
  if (text === null) return { build, files: [], warnings: [`${name}: ${dockerfile} is missing.`] };
  const missingStage = target && !hasStage(parseDockerfile(text), target);
  return {
    build,
    files: [dockerfile],
    warnings: missingStage ? [`${name}: ${dockerfile} has no ${target} stage.`] : [],
  };
}

async function composeService(
  files: ProjectFiles,
  rawName: string,
  raw: Raw,
  vars: Readonly<Record<string, string>>,
): Promise<ServiceResult> {
  const name = slugName(rawName);
  const used: string[] = [];
  const warnings: string[] = [];
  const skip = (warning: string): ServiceResult => ({
    files: used,
    warnings: [...warnings, warning],
    namedVolumes: [],
  });
  if (name !== rawName) warnings.push(`${rawName} is called ${name} in Nex.`);
  const unsupported = UNSUPPORTED_KEYS.filter((key) => key in raw);
  if (unsupported.length) {
    warnings.push(`${name}: Nex ignores ${listPhrase(unsupported)}.`);
  }

  const envFiles: string[] = [];
  for (const entry of asList(raw.env_file)) {
    const path = scalar(isRecord(entry) ? entry.path : entry);
    if (!path) continue;
    if ((await files.read(path)) === null) {
      if (!(isRecord(entry) && entry.required === false))
        warnings.push(`${name}: ${repoPath(path)} is missing.`);
      continue;
    }
    used.push(repoPath(path));
    envFiles.push(repoPath(path));
  }
  const env = environmentEntries(raw.environment, vars);

  const allMounts = mounts(raw.volumes);
  const published: EnvHostPort[] = [];
  for (const spec of asList(raw.ports)) {
    const result = publishedPorts(spec);
    if (result.unreadable) warnings.push(`${name}: Nex can’t read the port ${result.unreadable}.`);
    for (const port of result.ports) {
      if (!published.some((item) => item.container === port.container)) published.push(port);
    }
  }
  const ports = published.map((port) => port.container);
  const moved = published.filter((port) => port.host !== port.container);
  const deploy = isRecord(raw.deploy) && isRecord(raw.deploy.resources) ? raw.deploy.resources : {};
  const limit =
    memoryMb(raw.mem_limit) ?? memoryMb(isRecord(deploy.limits) ? deploy.limits.memory : undefined);
  const ready = healthcheck(raw.healthcheck);
  const dependsOn = dependencies(raw.depends_on).map(slugName);
  const command = commandText(raw.command);
  const entrypoint = commandText(raw.entrypoint);
  const workdir = scalar(raw.working_dir);

  let build: EnvBuild | undefined;
  const image = scalar(raw.image);
  if (raw.build !== undefined) {
    const section = await buildSection(files, name, raw, vars);
    used.push(...section.files);
    warnings.push(...section.warnings);
    if (!section.build) return { files: used, warnings, namedVolumes: [] };
    build = section.build;
  } else if (!image) {
    return skip(`${name} has no image or build, so Nex skips it.`);
  } else if (PROXIES.has(imageRepository(image).split("/").at(-1) ?? "")) {
    return skip(`Nex gives every service its own address, so ${name} isn’t needed.`);
  }

  const known = build ? null : knownImage(image ?? "");
  const dataMount = known ? allMounts.find((mount) => mount.type === "volume") : undefined;
  const binds: EnvMount[] = [];
  const kept: string[] = [];
  const namedVolumes: string[] = [];
  for (const mount of allMounts) {
    if (mount === dataMount) continue;
    if (mount.type === "bind") {
      if (insideProject(mount.source)) {
        binds.push({
          source: repoPath(mount.source),
          target: mount.target,
          ...(mount.readOnly ? { readOnly: true } : {}),
        });
      } else {
        warnings.push(`${name} can’t mount ${mount.source}; only project files can be mounted.`);
      }
      continue;
    }
    if (mount.type === "volume") namedVolumes.push(mount.source);
    kept.push(mount.target);
  }
  const seedMount = allMounts.find(
    (mount) =>
      mount.type === "bind" && mount.target.startsWith(SEED_DIR) && insideProject(mount.source),
  );
  const shown = known ? [] : ports;
  return {
    files: used,
    warnings,
    namedVolumes,
    service: {
      name,
      kind: build ? "build" : "image",
      image: build ? "" : (image ?? ""),
      ...(build ? { build } : {}),
      ...(entrypoint ? { entrypoint } : {}),
      ...(command ? { command } : {}),
      ...(workdir ? { workdir } : {}),
      ...(binds.length ? { mounts: binds } : {}),
      ...(kept.length ? { volumes: kept } : {}),
      ports: shown,
      ...(!known && moved.length ? { hostPorts: moved } : {}),
      env,
      ...(envFiles.length ? { envFiles } : {}),
      ...(dataMount ? { data: { path: dataMount.target } } : {}),
      dependsOn,
      ...(ready
        ? { ready: { command: ready } }
        : known
          ? { ready: { command: known.ready } }
          : shown[0]
            ? { ready: { port: shown[0] } }
            : {}),
      ...(seedMount ? { seed: { file: repoPath(seedMount.source) } } : {}),
      memoryMb: clampMemory(
        limit ?? (build ? APP_MEMORY_MB : (known?.memoryMb ?? IMAGE_MEMORY_MB)),
      ),
    },
  };
}

export async function composeServices(
  files: ProjectFiles,
  composePath: string,
  text: string,
): Promise<Detected & { services: EnvServiceDef[] }> {
  const used = [composePath];
  const warnings: string[] = [];
  let document: unknown;
  try {
    document = parseYaml(text, { merge: true });
  } catch {
    return { services: [], files: used, warnings: [`${composePath} couldn’t be read as YAML.`] };
  }
  const dotenv = await files.read(".env");
  const vars = dotenv === null ? {} : parseEnvFile(dotenv);
  if (dotenv !== null) used.push(".env");
  const missing = new Set<string>();
  const root = isRecord(document) ? deepInterpolate(document, vars, missing) : {};
  const rawServices = isRecord(root) && isRecord(root.services) ? root.services : {};

  const services: EnvServiceDef[] = [];
  const profiled: string[] = [];
  const volumeUsers = new Map<string, string[]>();
  for (const [name, raw] of Object.entries(rawServices)) {
    if (!isRecord(raw)) continue;
    if (asList(raw.profiles).length > 0) profiled.push(slugName(name));
    const result = await composeService(files, name, raw, vars);
    used.push(...result.files);
    warnings.push(...result.warnings);
    if (!result.service) continue;
    services.push(result.service);
    for (const volume of new Set(result.namedVolumes)) {
      volumeUsers.set(volume, [...(volumeUsers.get(volume) ?? []), result.service.name]);
    }
  }
  for (const [volume, users] of volumeUsers) {
    if (users.length > 1)
      warnings.push(`${listPhrase(users)} each get their own ${volume} volume.`);
  }

  const names = new Set(services.map((service) => service.name));
  for (const service of services) {
    const unknown = service.dependsOn.filter((name) => !names.has(name));
    if (unknown.length)
      warnings.push(`${service.name} depends on ${listPhrase(unknown)}, which isn’t defined.`);
    service.dependsOn = service.dependsOn.filter(
      (name) => names.has(name) && name !== service.name,
    );
  }
  if (profiled.length) {
    warnings.push(
      `Compose only starts ${listPhrase(profiled)} with a profile; Nex starts them every time.`,
    );
  }
  if (missing.size) {
    warnings.push(
      `${listPhrase([...missing])} ${missing.size === 1 ? "isn’t" : "aren’t"} set in .env, so ${missing.size === 1 ? "it’s" : "they’re"} empty.`,
    );
  }
  const override = composePath.replace(/\.(ya?ml)$/, ".override.$1");
  if (override !== composePath && (await files.read(override)) !== null) {
    warnings.push(`${override} isn’t read; edit the services here instead.`);
  }
  const seed = services.some((service) => service.seed) ? undefined : await seedFile(files);
  attachSeed(services, seed);
  if (seed && services.some((service) => service.seed?.file === seed)) used.push(seed);
  return { services, files: [...new Set(used)], warnings };
}
