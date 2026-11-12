import type { EnvServiceDef } from "@native/db/types";
import { APP_MEMORY_MB, knownImage, slugName, type DataStore } from "./definition";
import { parseEnvFile } from "./env-file";
import { repoPath, type ProjectFiles } from "./project-files";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export const DEFAULT_NODE_MAJOR = 22;
const BUN_IMAGE = "oven/bun:1-alpine";
const ANY_HOST = "0.0.0.0";

const LOCKFILES: [string, PackageManager][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
];

const ENV_EXAMPLES = [".env.example", ".env.sample", ".env.template", ".env"];

const runs = (command: string) => new RegExp(`(^|[\\s;&|(])${command}(\\s|$)`);

const FRAMEWORK_PORTS: [RegExp, number][] = [
  [runs("next"), 3000],
  [runs("(nuxt|nuxi)"), 3000],
  [runs("astro"), 4321],
  [runs("ng\\s+serve"), 4200],
  [runs("react-scripts"), 3000],
  [runs("gatsby"), 8000],
  [runs("remix\\s+dev"), 3000],
  [runs("vite"), 5173],
];

const BINDS_LOCALHOST = runs("(vite|astro|nuxt|nuxi|ng\\s+serve)");
const DESKTOP = runs("(electron|electron-vite|electron-forge|tauri)");

interface PackageJson {
  scripts?: Record<string, string>;
  engines?: { node?: string };
  packageManager?: string;
}

export interface Detected {
  files: string[];
  warnings: string[];
}

export function nodeMajor(spec: string | undefined): number {
  const text = spec?.trim() ?? "";
  const major = Number.parseInt(/(\d+)/.exec(text)?.[1] ?? "", 10);
  if (!Number.isInteger(major) || major < 10) return DEFAULT_NODE_MAJOR;
  return text.startsWith(">") ? Math.max(major, DEFAULT_NODE_MAJOR) : major;
}

export const nodeImage = (major: number) => `node:${major}-alpine`;

const INSTALL: Record<PackageManager, { locked: string; unlocked: string }> = {
  npm: { locked: "npm ci", unlocked: "npm install --no-package-lock" },
  pnpm: { locked: "pnpm install --frozen-lockfile", unlocked: "pnpm install --no-lockfile" },
  yarn: { locked: "yarn install --frozen-lockfile", unlocked: "yarn install --no-lockfile" },
  bun: { locked: "bun install --frozen-lockfile", unlocked: "bun install --no-save" },
};

export function installCommand(manager: PackageManager, locked: boolean): string {
  const install = INSTALL[manager][locked ? "locked" : "unlocked"];
  return manager === "pnpm" || manager === "yarn" ? `corepack enable && ${install}` : install;
}

export function runScript(manager: PackageManager, script: string, extra = ""): string {
  const base = manager === "npm" ? `npm run ${script}` : `${manager} run ${script}`;
  if (!extra) return base;
  return manager === "npm" ? `${base} -- ${extra}` : `${base} ${extra}`;
}

export const withInstall = (manager: PackageManager, locked: boolean, command: string) =>
  /\binstall\b|\bci\b/.test(command) ? command : `${installCommand(manager, locked)} && ${command}`;

export function scriptPort(script: string): number | undefined {
  const flag = /(?:--port[=\s]+|-p\s+|\bPORT=)(\d{2,5})\b/.exec(script);
  if (flag?.[1]) return Number(flag[1]);
  return FRAMEWORK_PORTS.find(([pattern]) => pattern.test(script))?.[1];
}

async function firstFile(files: ProjectFiles, paths: readonly string[]) {
  for (const path of paths) {
    const text = await files.read(path);
    if (text !== null) return { path, text };
  }
  return null;
}

export async function envExample(
  files: ProjectFiles,
  dir = "",
): Promise<{ path: string; vars: Record<string, string> } | null> {
  const found = await firstFile(
    files,
    [...new Set([dir, ""])].flatMap((base) => ENV_EXAMPLES.map((name) => repoPath(base, name))),
  );
  return found && { path: found.path, vars: parseEnvFile(found.text) };
}

export interface NodeApp {
  image: string;
  manager: PackageManager;
  locked: boolean;
  script?: string;
  command?: string;
  port?: number;
  env: Record<string, string>;
  files: string[];
}

async function lockfile(files: ProjectFiles, dir: string) {
  for (const base of [...new Set([dir, ""])]) {
    for (const [name, manager] of LOCKFILES) {
      const path = repoPath(base, name);
      if ((await files.read(path)) !== null) return { manager, path };
    }
  }
  return null;
}

async function packageManager(files: ProjectFiles, dir: string, pkg: PackageJson) {
  const declared = /^(pnpm|yarn|npm|bun)@/.exec(pkg.packageManager ?? "")?.[1] as
    | PackageManager
    | undefined;
  const lock = await lockfile(files, dir);
  const manager = declared ?? lock?.manager ?? "npm";
  return { manager, file: lock?.manager === manager ? lock.path : undefined };
}

export async function nodeApp(files: ProjectFiles, dir = ""): Promise<NodeApp | null> {
  const packagePath = repoPath(dir, "package.json");
  const text = await files.read(packagePath);
  if (text === null) return null;
  let pkg: PackageJson;
  try {
    pkg = JSON.parse(text) as PackageJson;
  } catch {
    return null;
  }
  const used = [packagePath];
  const { manager, file: lockfile } = await packageManager(files, dir, pkg);
  if (lockfile) used.push(lockfile);
  const versionFile = await firstFile(
    files,
    [...new Set([dir, ""])].flatMap((base) => [
      repoPath(base, ".nvmrc"),
      repoPath(base, ".node-version"),
    ]),
  );
  if (versionFile) used.push(versionFile.path);
  const major = nodeMajor(versionFile?.text ?? pkg.engines?.node);
  const found = ["dev", "start"].find((name) => pkg.scripts?.[name]);
  const desktop = found !== undefined && DESKTOP.test(pkg.scripts?.[found] ?? "");
  const scriptName = desktop ? undefined : found;
  const script = scriptName ? (pkg.scripts?.[scriptName] ?? "") : "";
  const example = await envExample(files, dir);
  const port = scriptPort(script) ?? (example ? Number(example.vars.PORT) || undefined : undefined);
  if (example && !scriptPort(script) && port) used.push(example.path);
  const hostFlag =
    BINDS_LOCALHOST.test(script) && !/--host\b/.test(script) ? `--host ${ANY_HOST}` : "";
  return {
    image: manager === "bun" ? BUN_IMAGE : nodeImage(major),
    manager,
    locked: Boolean(lockfile),
    script: scriptName,
    command: scriptName
      ? withInstall(manager, Boolean(lockfile), runScript(manager, scriptName, hostFlag))
      : undefined,
    port,
    env: { HOST: ANY_HOST, ...(port ? { PORT: String(port) } : {}) },
    files: used,
  };
}

const STORE_IMAGES: Record<DataStore, string> = {
  postgres: "postgres:16-alpine",
  mysql: "mysql:8.4",
  mariadb: "mariadb:11",
  mongo: "mongo:7",
  redis: "redis:7-alpine",
};

const SCHEMES: Record<string, DataStore> = {
  postgres: "postgres",
  postgresql: "postgres",
  mysql: "mysql",
  mariadb: "mariadb",
  mongodb: "mongo",
  redis: "redis",
};

const URL_KEY = /^(DATABASE|DB|POSTGRES|PG|MYSQL|MONGO|MONGODB|REDIS|CACHE)_(URL|URI)$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "host.docker.internal", "::1"]);

function storeEnv(store: DataStore, url: URL): Record<string, string> {
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\//, "");
  if (store === "postgres") {
    return {
      POSTGRES_USER: user || "postgres",
      POSTGRES_PASSWORD: password || "postgres",
      ...(database ? { POSTGRES_DB: database } : {}),
    };
  }
  if (store === "mysql" || store === "mariadb") {
    const prefix = store === "mysql" ? "MYSQL" : "MARIADB";
    const root = !user || user === "root";
    return {
      [`${prefix}_ROOT_PASSWORD`]: (root && password) || "root",
      ...(database ? { [`${prefix}_DATABASE`]: database } : {}),
      ...(root ? {} : { [`${prefix}_USER`]: user, [`${prefix}_PASSWORD`]: password || user }),
    };
  }
  if (store === "mongo" && user) {
    return { MONGO_INITDB_ROOT_USERNAME: user, MONGO_INITDB_ROOT_PASSWORD: password };
  }
  return {};
}

export interface UrlServices {
  services: EnvServiceDef[];
  appEnv: Record<string, string>;
}

export function urlServices(vars: Readonly<Record<string, string>>): UrlServices {
  const services: EnvServiceDef[] = [];
  const appEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (!URL_KEY.test(key)) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      continue;
    }
    const store = SCHEMES[url.protocol.replace(/:$/, "")];
    if (!store) continue;
    const known = knownImage(STORE_IMAGES[store]);
    if (!known) continue;
    const local = LOCAL_HOSTS.has(url.hostname);
    const name = local ? store : slugName(url.hostname) || store;
    if (local) {
      const rewritten = new URL(url.href);
      rewritten.hostname = name;
      if (!rewritten.port) rewritten.port = String(known.port);
      appEnv[key] = rewritten.href;
    }
    if (services.some((service) => service.name === name)) continue;
    services.push({
      name,
      kind: "image",
      image: STORE_IMAGES[store],
      ports: [],
      env: storeEnv(store, url),
      data: { path: known.dataPath },
      dependsOn: [],
      ready: { command: known.ready },
      memoryMb: known.memoryMb,
    });
  }
  return { services, appEnv };
}

const SEEDS = [
  "db/seed.sql",
  "db/seeds.sql",
  "seed.sql",
  "database/seed.sql",
  "prisma/seed.ts",
  "prisma/seed.js",
  "prisma/seed.mjs",
];

export async function seedFile(files: ProjectFiles): Promise<string | undefined> {
  return (await firstFile(files, SEEDS))?.path;
}

export function attachSeed(services: EnvServiceDef[], seed: string | undefined): void {
  if (!seed) return;
  const target = services.find((service) => {
    const store = knownImage(service.image)?.store;
    return store === "postgres" || store === "mysql" || store === "mariadb";
  });
  if (target && !target.seed) target.seed = { file: seed };
}

function procfileLines(text: string): [string, string][] {
  return text
    .split(/\r?\n/)
    .map((line) => /^([A-Za-z0-9_-]+)\s*:\s*(.+)$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => [match[1] as string, (match[2] as string).trim()]);
}

export async function stackServices(
  files: ProjectFiles,
): Promise<Detected & { services: EnvServiceDef[] }> {
  const used: string[] = [];
  const app = await nodeApp(files);
  const example = await envExample(files);
  const stores = urlServices(example?.vars ?? {});
  if (example && stores.services.length > 0) used.push(example.path);
  const apps: EnvServiceDef[] = [];
  const procfile = app?.command ? null : await firstFile(files, ["Procfile.dev", "Procfile"]);
  const appService = (name: string, command: string | undefined, port?: number): EnvServiceDef => ({
    name,
    kind: "app",
    image: app?.image ?? "",
    command,
    ports: port ? [port] : [],
    env: { ...(app?.env ?? {}), ...(port ? { PORT: String(port) } : {}), ...stores.appEnv },
    dependsOn: stores.services.map((service) => service.name),
    ...(port ? { ready: { port } } : {}),
    memoryMb: APP_MEMORY_MB,
  });
  if (procfile) {
    used.push(procfile.path);
    for (const [name, command] of procfileLines(procfile.text)) {
      if (name === "release") continue;
      const slug = slugName(name);
      const port = slug === "web" ? (app?.port ?? 3000) : undefined;
      apps.push(
        appService(slug, app ? withInstall(app.manager, app.locked, command) : command, port),
      );
    }
  } else if (app?.command) {
    apps.push(appService("web", app.command, app.port));
  }
  if (app && apps.length > 0) used.unshift(...app.files);
  const services = [...stores.services, ...apps];
  const seed = await seedFile(files);
  attachSeed(services, seed);
  if (seed && services.some((service) => service.seed)) used.push(seed);
  return { services, files: [...new Set(used)], warnings: [] };
}
