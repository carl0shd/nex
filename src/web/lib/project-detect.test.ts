import { describe, expect, it } from "vite-plus/test";
import type { RepoInspection } from "@native/git/inspect";
import { projectConfig, scriptCommand } from "@/lib/project-detect";

const inspection = (overrides: Partial<RepoInspection> = {}): RepoInspection => ({
  name: "atlas",
  path: "/Users/me/code/atlas",
  git: true,
  clean: true,
  baseBranch: "develop",
  branches: ["main", "develop", "feat/login"],
  packageManager: "pnpm",
  lockfile: "pnpm-lock.yaml",
  scripts: ["dev", "build", "test"],
  envFiles: [".env"],
  ...overrides,
});

describe("scriptCommand", () => {
  it("uses run only for npm", () => {
    expect(scriptCommand("npm", "dev")).toBe("npm run dev");
    expect(scriptCommand("pnpm", "dev")).toBe("pnpm dev");
    expect(scriptCommand(null, "dev")).toBe("npm run dev");
  });
});

describe("projectConfig", () => {
  it("puts the base branch first and turns on install, env copy, dev and test", () => {
    const config = projectConfig(inspection());
    expect(config.branches).toEqual(["develop", "main", "feat/login"]);
    expect(config.setup.install).toEqual({ on: true, command: "pnpm install" });
    expect(config.setup.copy).toEqual({ on: true, files: [".env"] });
    expect(config.detectedFrom).toEqual(["pnpm-lock.yaml", ".env"]);
    expect(config.commands.filter((command) => command.on).map((command) => command.name)).toEqual([
      "dev",
      "test",
    ]);
  });

  it("leaves install off when there is no package manager", () => {
    const config = projectConfig(inspection({ packageManager: null, lockfile: null, scripts: [] }));
    expect(config.setup.install.on).toBe(false);
    expect(config.commands).toEqual([]);
  });
});
