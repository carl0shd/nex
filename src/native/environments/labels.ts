import { createHash } from "crypto";

export const NEX_DOMAIN = "nex";

export const NEX_LABEL = "nex";
export const TASK_LABEL = "nex.task";
export const CHECK_LABEL = "nex.check";
export const PROJECT_LABEL = "nex.project";
export const SERVICE_LABEL = "nex.service";
export const BASE_LABEL = "nex.base";

export const nexLabels = (extra: Record<string, string> = {}): string[] =>
  Object.entries({ [NEX_LABEL]: "1", ...extra }).flatMap(([key, value]) => [
    "--label",
    `${key}=${value}`,
  ]);

export const projectKey = (projectPath: string) =>
  createHash("sha256").update(projectPath).digest("hex").slice(0, 12);

export const isNex = (labels: Record<string, string>) => labels[NEX_LABEL] === "1";
