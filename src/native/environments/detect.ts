import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { COMPOSE_FILES, composeServices } from "./detect-compose";
import { prepareSteps } from "./detect-prepare";
import { stackServices } from "./detect-stack";
import { projectFiles, type ProjectFiles } from "./project-files";

async function withSteps(
  files: ProjectFiles,
  services: EnvServiceDef[],
  detectedFrom: string[],
  warnings: string[],
): Promise<ProjectEnvironment> {
  const steps = await prepareSteps(files, services);
  return {
    services,
    ...(steps.prepare.length ? { prepare: steps.prepare } : {}),
    ...(steps.taskPrepare.length ? { taskPrepare: steps.taskPrepare } : {}),
    source: "detected",
    detectedFrom: detectedFrom.length ? [...new Set([...detectedFrom, ...steps.files])] : [],
    warnings,
  };
}

export async function detectFromFiles(files: ProjectFiles): Promise<ProjectEnvironment> {
  for (const path of COMPOSE_FILES) {
    const text = await files.read(path);
    if (text === null) continue;
    const found = await composeServices(files, path, text);
    return withSteps(files, found.services, found.files, found.warnings);
  }
  const found = await stackServices(files);
  return withSteps(files, found.services, found.services.length ? found.files : [], found.warnings);
}

export const detectEnvironment = (root: string) => detectFromFiles(projectFiles(root));
