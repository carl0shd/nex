import { readdir, readFile } from "fs/promises";
import { basename, join } from "path";
import { detectBaseBranch, gitSilent, isGitRepo, listBranches } from "@native/git/git";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export interface RepoInspection {
  name: string;
  path: string;
  git: boolean;
  clean: boolean;
  baseBranch: string | null;
  branches: string[];
  packageManager: PackageManager | null;
  lockfile: string | null;
  scripts: string[];
  envFiles: string[];
}

const LOCKFILES: [string, PackageManager][] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
];

async function packageScripts(path: string): Promise<string[]> {
  try {
    const pkg = JSON.parse(await readFile(join(path, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    return Object.keys(pkg.scripts ?? {});
  } catch {
    return [];
  }
}

export async function inspectRepo(path: string): Promise<RepoInspection> {
  const [entries, git, scripts] = await Promise.all([
    readdir(path).catch(() => [] as string[]),
    isGitRepo(path),
    packageScripts(path),
  ]);
  const [baseBranch, branches, status] = git
    ? await Promise.all([
        detectBaseBranch(path),
        listBranches(path),
        gitSilent(path, ["status", "--porcelain"]),
      ])
    : [null, [], ""];
  const lock = LOCKFILES.find(([file]) => entries.includes(file));
  return {
    name: basename(path),
    path,
    git,
    clean: !status?.trim(),
    baseBranch,
    branches,
    packageManager: lock?.[1] ?? (entries.includes("package.json") ? "npm" : null),
    lockfile: lock?.[0] ?? null,
    scripts,
    envFiles: entries.filter((entry) => entry === ".env" || entry.startsWith(".env.")),
  };
}
