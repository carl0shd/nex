import { createHash } from "crypto";
import { posix } from "path";
import type { EnvBuild, ProjectEnvironment } from "@native/db/types";
import { parseDockerfile } from "./dockerfile";
import { nexLabels, PROJECT_LABEL, projectKey } from "./labels";
import { repoPath, type ProjectFiles } from "./project-files";

export const BUILD_LABEL = "nex.build";

const HASH_LENGTH = 12;
const MAX_STEP = 90;

const MANIFESTS = [
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "pyproject.toml",
  "uv.lock",
  "poetry.lock",
  "pdm.lock",
  "Pipfile",
  "Pipfile.lock",
  "requirements.txt",
  "Gemfile",
  "Gemfile.lock",
  "go.mod",
  "go.sum",
  "Cargo.toml",
  "Cargo.lock",
  "composer.json",
  "composer.lock",
  "mix.exs",
  "mix.lock",
];

export interface BuildPlan {
  tag: string;
  slot: string;
  services: string[];
  args: string[];
}

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

export function buildKey(build: EnvBuild): string {
  const args = Object.entries(build.args ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([build.context, build.dockerfile, build.target ?? "", args]);
}

function globPattern(name: string): RegExp {
  const escaped = name.replace(/[.+^${}()|\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")}$`);
}

export function inputCandidates(build: EnvBuild, sources: readonly string[]): string[] {
  const candidates = sources.flatMap((source) => {
    const path = repoPath(build.context, source);
    if (path.startsWith("..")) return [];
    const name = posix.basename(path);
    if (/[*?[]/.test(name)) {
      const pattern = globPattern(name);
      const dir = posix.dirname(path) === "." ? "" : posix.dirname(path);
      return MANIFESTS.filter((manifest) => pattern.test(manifest)).map((manifest) =>
        repoPath(dir, manifest),
      );
    }
    return [path, ...MANIFESTS.map((manifest) => repoPath(path, manifest))].filter(Boolean);
  });
  return [...new Set(candidates)].sort();
}

export async function buildHash(
  files: ProjectFiles,
  build: EnvBuild,
  projectPath: string,
): Promise<string> {
  const hash = createHash("sha256").update(projectPath).update("\0").update(buildKey(build));
  const dockerfile = await files.read(build.dockerfile);
  hash.update("\0").update(dockerfile ?? "");
  const sources = dockerfile === null ? [] : parseDockerfile(dockerfile).sources;
  for (const path of inputCandidates(build, sources)) {
    const text = await files.read(path);
    if (text !== null) hash.update("\0").update(path).update("\0").update(text);
  }
  return hash.digest("hex").slice(0, HASH_LENGTH);
}

export async function buildHashes(
  env: ProjectEnvironment,
  files: ProjectFiles,
  projectPath: string,
): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  for (const service of env.services) {
    if (service.kind !== "build" || !service.build) continue;
    const key = buildKey(service.build);
    if (!hashes.has(key)) hashes.set(key, await buildHash(files, service.build, projectPath));
  }
  return hashes;
}

export interface BuildTarget {
  projectSlug: string;
  projectPath: string;
  hashes: ReadonlyMap<string, string>;
}

export function buildPlans(env: ProjectEnvironment, target: BuildTarget): BuildPlan[] {
  const { projectSlug, projectPath, hashes } = target;
  const plans = new Map<string, BuildPlan>();
  for (const service of env.services) {
    if (service.kind !== "build" || !service.build) continue;
    const build = service.build;
    const key = buildKey(build);
    const existing = plans.get(key);
    if (existing) {
      existing.services.push(service.name);
      continue;
    }
    const repository = `nex-${projectSlug}-${service.name}`;
    const tag = `${repository}:${hashes.get(key) ?? "latest"}`;
    const slot = sha(`${projectPath}\0${repository}`).slice(0, HASH_LENGTH);
    plans.set(key, {
      tag,
      slot,
      services: [service.name],
      args: [
        "build",
        "--progress",
        "plain",
        "--tag",
        tag,
        ...nexLabels({
          [PROJECT_LABEL]: projectKey(projectPath),
          [BUILD_LABEL]: slot,
        }),
        "--file",
        posix.join(projectPath, build.dockerfile),
        ...(build.target ? ["--target", build.target] : []),
        ...Object.entries(build.args ?? {}).flatMap(([key, value]) => [
          "--build-arg",
          `${key}=${value}`,
        ]),
        posix.join(projectPath, build.context),
      ],
    });
  }
  return [...plans.values()];
}

export const builtImages = (plans: readonly BuildPlan[]): Record<string, string> =>
  Object.fromEntries(plans.flatMap((plan) => plan.services.map((name) => [name, plan.tag])));

const clip = (text: string) => (text.length > MAX_STEP ? `${text.slice(0, MAX_STEP - 1)}…` : text);
const megabytes = (value: string, unit: string) =>
  Math.round(Number(value) * ({ B: 1 / 1e6, KB: 1 / 1e3, kB: 1 / 1e3, MB: 1, GB: 1e3 }[unit] ?? 1));
const RUN_FLAGS = /^RUN (?:--\S+\s+)+/;

export function buildStep(line: string): string | null {
  const text = line.trim();
  const step = /^#\d+ \[([^\]]+ \d+\/\d+)\] (.+)$/.exec(text);
  if (step) {
    const parts = (step[1] ?? "").split(/\s+/);
    const position = parts.at(-1) ?? "";
    const stage = parts.slice(0, -1).filter((part) => !part.includes("/"));
    const where = stage.length ? `${stage.join(" ")} ${position}` : `Step ${position}`;
    const command = (step[2] ?? "").replace(/\s+/g, " ").replace(RUN_FLAGS, "RUN ");
    return clip(`${where} · ${command}`);
  }
  const context = /^#\d+ transferring context: ([\d.]+)\s*(B|kB|KB|MB|GB)/.exec(text);
  if (context)
    return `Sending project files · ${megabytes(context[1] ?? "0", context[2] ?? "MB")} MB`;
  const fetching = /^#\d+ \[resolver\] fetching image\.\.\.(?:docker\.io\/library\/)?(\S+)/.exec(
    text,
  );
  if (fetching) return clip(`Fetching ${fetching[1]}`);
  const layer = /^#\d+ sha256:\w+ ([\d.]+)\s*(kB|KB|MB|GB) \/ ([\d.]+)\s*(kB|KB|MB|GB)/.exec(text);
  if (layer) {
    const done = megabytes(layer[1] ?? "0", layer[2] ?? "MB");
    return `Downloading the base image · ${done} of ${megabytes(layer[3] ?? "0", layer[4] ?? "MB")} MB`;
  }
  if (/^#\d+ (exporting|sending tarball)/.test(text)) return "Saving the image";
  return null;
}
