import type { ProjectConfig } from "@/components/projects/add-project-dialog";
import type { FoundRepo } from "@/components/projects/repo-picker";

export const FOUND: FoundRepo[] = [
  { name: "atlas", path: "~/Documents/Studio/atlas", branch: "main", active: "today" },
  { name: "atlas-api", path: "~/code/atlas-api", branch: "main", active: "3d ago" },
  { name: "studio-site", path: "~/code/studio-site", branch: "dev", active: "1w ago" },
];

const COMMANDS = ["dev", "test", "lint", "typecheck", "build"];

export function detect(repo: FoundRepo): ProjectConfig {
  return {
    branches: [repo.branch, "develop", "release/2.4"],
    branch: { base: repo.branch, prefix: "feat/", pull: true },
    setup: {
      install: { on: true, command: "yarn install" },
      copy: { on: true, files: [".env"] },
      script: { on: false, path: "" },
    },
    detectedFrom: ["yarn.lock", ".gitignore"],
    commands: COMMANDS.map((name, index) => ({ name, command: `yarn ${name}`, on: index < 2 })),
  };
}

export function detectWithEnvironment(repo: FoundRepo): ProjectConfig {
  const base = detect(repo);
  return {
    ...base,
    setup: { ...base.setup, install: { ...base.setup.install, on: false } },
    commands: base.commands.map((command) => ({ ...command, on: command.name === "test" })),
    environment: {
      browser: [
        { name: "web", port: 5173, command: "yarn dev", address: "studio-{task}.nex" },
        { name: "api", port: 8000, command: "yarn dev:api", address: "api.studio-{task}.nex" },
      ],
      internal: [
        { name: "postgres", port: 5432, note: "data cloned from the clean base" },
        { name: "redis", port: 6379, note: "starts empty" },
      ],
      values: [{ key: "VITE_API_URL", value: "https://api.studio-{task}.nex" }],
      cleanBase: {
        detail: "Prepared 2h ago from main · 1.4 GB · new tasks start in ~3s",
        steps: ["yarn install", "yarn db:migrate", "yarn db:seed"],
      },
    },
  };
}
