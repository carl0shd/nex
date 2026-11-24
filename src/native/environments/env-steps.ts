import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { knownImage, orderServices } from "./definition";

export const APP_STOP_SECONDS = 5;
export const STORE_STOP_SECONDS = 180;

export const dataServices = (env: ProjectEnvironment) =>
  env.services.filter((service) => service.data);

export function stopOrder(env: ProjectEnvironment): { apps: string[]; stores: string[] } {
  const reversed = orderServices(env.services).reverse();
  return {
    apps: reversed.filter((service) => !service.data).map((service) => service.name),
    stores: reversed.filter((service) => service.data).map((service) => service.name),
  };
}

// Postgres treats SIGTERM as a smart shutdown that waits for every client; SIGINT checkpoints and exits.
export function stopArgs(service: EnvServiceDef, name: string, seconds: number): string[] {
  const postgres = knownImage(service.image)?.store === "postgres";
  return ["stop", "--time", String(seconds), ...(postgres ? ["--signal", "SIGINT"] : []), name];
}

export const prepareExecArgs = (
  name: string,
  image: { entrypoint: readonly string[]; workdir: string | null },
  command: string,
) => [
  "exec",
  ...(image.workdir ? ["--workdir", image.workdir] : []),
  name,
  ...image.entrypoint,
  "sh",
  "-c",
  command,
];

export const stepServices = (env: ProjectEnvironment) =>
  new Set([...(env.taskPrepare ?? []), ...(env.prepare ?? [])].map((step) => step.service));
