import type { RepoInspection } from "@native/git/inspect";
import type { ProjectConfig } from "@/components/projects/add-project-dialog";
import type { FoundRepo } from "@/components/projects/repo-picker";

const DEFAULT_PREFIX = "feat/";
const COMMANDS_ON_BY_DEFAULT = new Set(["dev", "test"]);

export function scriptCommand(manager: RepoInspection["packageManager"], script: string) {
  if (!manager || manager === "npm") return `npm run ${script}`;
  return `${manager} ${script}`;
}

export function foundRepo(inspection: RepoInspection): FoundRepo {
  return {
    name: inspection.name,
    path: inspection.path,
    branch: inspection.baseBranch ?? "",
    active: "",
  };
}

export function projectConfig(inspection: RepoInspection): ProjectConfig {
  const base = inspection.baseBranch ?? "main";
  const manager = inspection.packageManager;
  return {
    branches: [base, ...inspection.branches.filter((branch) => branch !== base)],
    branch: { base, prefix: DEFAULT_PREFIX, pull: true },
    setup: {
      install: { on: Boolean(manager), command: manager ? `${manager} install` : "" },
      copy: { on: inspection.envFiles.length > 0, files: inspection.envFiles },
      script: { on: false, path: "" },
    },
    detectedFrom: [inspection.lockfile, ...inspection.envFiles].filter((file): file is string =>
      Boolean(file),
    ),
    commands: inspection.scripts.map((name) => ({
      name,
      command: scriptCommand(manager, name),
      on: COMMANDS_ON_BY_DEFAULT.has(name),
    })),
  };
}
