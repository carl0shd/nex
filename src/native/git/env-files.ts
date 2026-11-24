import { constants, existsSync } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { dirname, join, posix } from "path";
import type { ProjectEnvironment } from "@native/db/types";
import { gitSilent } from "@native/git/git";

export const MAX_ENV_FILES = 50;

export interface EnvFileSources {
  files: string[];
  dirs: string[];
}

const clean = (path: string) => {
  const normalized = posix.normalize(path).replace(/^\.\/+|\/+$/g, "");
  return normalized === "." ? "" : normalized;
};

const outside = (path: string) => path === ".." || path.startsWith("../") || path.startsWith("/");

export function envFileSources(env: ProjectEnvironment): EnvFileSources {
  const files = new Set<string>();
  const dirs = new Set<string>();
  for (const service of env.services) {
    for (const file of service.envFiles ?? []) files.add(clean(file));
    if (service.kind === "app") dirs.add("");
    if (service.build) dirs.add(clean(service.build.context));
    for (const mount of service.mounts ?? []) dirs.add(clean(mount.source));
  }
  return {
    files: [...files].filter((file) => file && !outside(file)),
    dirs: [...dirs].filter((dir) => !outside(dir)),
  };
}

const isEnvFile = (dir: string, path: string) => {
  const rest = dir ? path.slice(dir.length + 1) : path;
  return (!dir || path.startsWith(`${dir}/`)) && rest.startsWith(".env");
};

export interface EnvFileCheck {
  inMain: (path: string) => boolean;
  inWorktree: (path: string) => boolean;
}

export function pickEnvFiles(
  sources: EnvFileSources,
  ignored: Readonly<Record<string, readonly string[]>>,
  check: EnvFileCheck,
): string[] {
  const listed = sources.dirs.flatMap((dir) =>
    (ignored[dir] ?? []).filter((path) => isEnvFile(dir, path)),
  );
  return [...new Set([...sources.files, ...listed])]
    .filter((path) => !outside(path) && check.inMain(path) && !check.inWorktree(path))
    .toSorted()
    .slice(0, MAX_ENV_FILES);
}

async function ignoredIn(root: string, dir: string): Promise<string[]> {
  const cwd = join(root, dir);
  if (!existsSync(cwd)) return [];
  const listed = await gitSilent(cwd, [
    "ls-files",
    "--others",
    "--ignored",
    "--exclude-standard",
    "--",
    ".env*",
  ]);
  return listed
    .split("\n")
    .filter(Boolean)
    .slice(0, MAX_ENV_FILES)
    .map((path) => posix.join(dir, path));
}

export async function copyEnvFiles(
  mainPath: string,
  worktreePath: string,
  env: ProjectEnvironment,
): Promise<string[]> {
  const sources = envFileSources(env);
  const ignored = Object.fromEntries(
    await Promise.all(sources.dirs.map(async (dir) => [dir, await ignoredIn(mainPath, dir)])),
  );
  const picked = pickEnvFiles(sources, ignored, {
    inMain: (path) => existsSync(join(mainPath, path)),
    inWorktree: (path) => existsSync(join(worktreePath, path)),
  });
  const copied: string[] = [];
  for (const path of picked) {
    const target = join(worktreePath, path);
    try {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(join(mainPath, path), target, constants.COPYFILE_EXCL);
      copied.push(path);
    } catch {
      continue;
    }
  }
  return copied;
}
