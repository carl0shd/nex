import { execFileSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { copyEnvFiles, envFileSources, pickEnvFiles } from "@native/git/env-files";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "build",
  image: "",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 512,
  ...overrides,
});

const env = (services: EnvServiceDef[]): ProjectEnvironment => ({
  services,
  source: "detected",
  detectedFrom: [],
  warnings: [],
});

const MONOREPO = env([
  service({
    name: "triton-django",
    build: { context: "triton", dockerfile: "triton/compose/local/django/Dockerfile" },
    mounts: [{ source: "triton", target: "/app" }],
    envFiles: ["triton/.envs/.local/.django", "./triton/.env"],
  }),
  service({
    name: "oberon-web",
    build: { context: "oberon", dockerfile: "oberon/deploy/local/local.Dockerfile" },
    mounts: [{ source: "./oberon/", target: "/oberon" }],
    envFiles: ["oberon/.env"],
  }),
  service({
    name: "db",
    kind: "image",
    image: "postgres:16",
    mounts: [{ source: "../x", target: "/x" }],
  }),
]);

describe("env files a task needs", () => {
  it("reads the files the environment names and the code roots of its services", () => {
    expect(envFileSources(MONOREPO)).toEqual({
      files: ["triton/.envs/.local/.django", "triton/.env", "oberon/.env"],
      dirs: ["triton", "oberon"],
    });
    expect(envFileSources(env([service({ kind: "app", image: "node:22" })])).dirs).toEqual([""]);
  });

  it("copies only what the checkout has and the worktree lacks", () => {
    const main = new Set([
      "triton/.env",
      "oberon/.env",
      "oberon/.env.local",
      "triton/.envs/.local/.django",
    ]);
    const worktree = new Set(["triton/.envs/.local/.django"]);
    const picked = pickEnvFiles(
      envFileSources(MONOREPO),
      {
        oberon: ["oberon/.env", "oberon/.env.local", "oberon/node_modules/x/.env"],
        triton: ["triton/.env"],
      },
      { inMain: (path) => main.has(path), inWorktree: (path) => worktree.has(path) },
    );
    expect(picked).toEqual(["oberon/.env", "oberon/.env.local", "triton/.env"]);
  });
});

describe("copyEnvFiles", () => {
  let root: string | null = null;
  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
    root = null;
  });

  const write = (path: string, text: string) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  };
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd });

  it("copies gitignored env files into a new worktree, also inside a nested repo", async () => {
    root = mkdtempSync(join(tmpdir(), "nex-env-files-"));
    const main = join(root, "main");
    const worktree = join(root, "worktree");
    write(join(main, ".gitignore"), ".env*\n!.env.example\n");
    write(join(main, ".env.example"), "A=example\n");
    write(join(main, ".env"), "A=secret\n");
    write(join(main, "oberon/.gitignore"), ".env\n.env.local\n");
    write(join(main, "oberon/.env"), "VITE_API_URL=http://localhost:8000/\n");
    write(join(main, "oberon/.env.local"), "LOCAL=1\n");
    git(main, "init", "-q");
    git(join(main, "oberon"), "init", "-q");
    write(join(worktree, "oberon/.env.local"), "MINE=1\n");
    const environment = env([
      service({ name: "app", kind: "app", image: "node:22" }),
      service({
        name: "oberon-web",
        build: { context: "oberon", dockerfile: "oberon/Dockerfile" },
      }),
    ]);
    expect(await copyEnvFiles(main, worktree, environment)).toEqual([".env", "oberon/.env"]);
    expect(readFileSync(join(worktree, "oberon/.env"), "utf8")).toContain("localhost:8000");
    expect(readFileSync(join(worktree, "oberon/.env.local"), "utf8")).toBe("MINE=1\n");
    expect(existsSync(join(worktree, ".env.example"))).toBe(false);
  });
});
