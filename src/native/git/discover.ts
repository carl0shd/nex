import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

export interface LocalRepo {
  name: string;
  path: string;
  branch: string;
  activeAt: number;
}

export interface LocalRepos {
  repos: LocalRepo[];
  cloneParent: string;
}

const ROOTS = [
  "code",
  "Code",
  "Developer",
  "dev",
  "Projects",
  "projects",
  "src",
  "repos",
  "work",
  "Sites",
  "github",
  "GitHub",
  "Documents",
  "Documents/GitHub",
  "Desktop",
];
const SKIP = new Set([
  "node_modules",
  ".worktrees",
  "Library",
  "Applications",
  "Pictures",
  "Music",
]);
const MAX_REPOS = 8;
const DEPTH = 3;

function readBranch(gitDir: string): string {
  try {
    const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
    return head.startsWith("ref: refs/heads/") ? head.slice("ref: refs/heads/".length) : "";
  } catch {
    return "";
  }
}

function activity(gitDir: string): number {
  for (const file of ["index", "HEAD"]) {
    try {
      return statSync(join(gitDir, file)).mtimeMs;
    } catch {
      continue;
    }
  }
  return 0;
}

function scan(dir: string, depth: number, found: Map<string, LocalRepo>): void {
  const gitDir = join(dir, ".git");
  if (existsSync(gitDir)) {
    if (!statSync(gitDir).isDirectory()) return;
    found.set(dir, {
      name: dir.split("/").pop() ?? dir,
      path: dir,
      branch: readBranch(gitDir),
      activeAt: activity(gitDir),
    });
    return;
  }
  if (depth === 0) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith(".") || SKIP.has(entry)) continue;
    const child = join(dir, entry);
    try {
      if (statSync(child).isDirectory()) scan(child, depth - 1, found);
    } catch {
      continue;
    }
  }
}

export function findLocalRepos(exclude: readonly string[]): LocalRepos {
  const home = homedir();
  const found = new Map<string, LocalRepo>();
  for (const root of ROOTS) {
    const dir = join(home, root);
    if (existsSync(dir)) scan(dir, DEPTH, found);
  }
  const taken = new Set(exclude);
  const all = [...found.values()].toSorted((a, b) => b.activeAt - a.activeAt);
  return {
    repos: all.filter((repo) => !taken.has(repo.path)).slice(0, MAX_REPOS),
    cloneParent: all[0] ? dirname(all[0].path) : join(home, "code"),
  };
}
