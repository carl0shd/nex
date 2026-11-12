import { createHash } from "crypto";
import type { EnvPrepareStep, EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { knownImage, orderServices, slugName } from "./definition";
import { BASE_LABEL, nexLabels, PROJECT_LABEL, SERVICE_LABEL, TASK_LABEL } from "./labels";
import { dataVolumeName } from "./translate";
import type {
  CleanBaseRecord,
  CleanBaseStale,
  CleanBaseStatus,
  CleanBaseStep,
  CleanBaseVolume,
  EnvCheckService,
} from "./types";

export const CLEAN_BASES_KEY = "cleanBases";
export const APP_STOP_SECONDS = 5;
export const STORE_STOP_SECONDS = 180;
export const MAX_FINGERPRINT_FILES = 5000;
export const MAX_FINGERPRINT_BYTES = 32 * 1024 * 1024;

export const baseTaskSlug = (projectName: string) => `base-${slugName(projectName) || "project"}`;

export const baseVolumeName = (key: string, service: string) => `nex-base-${key}-${service}`;

export const dataServices = (env: ProjectEnvironment) =>
  env.services.filter((service): service is EnvServiceDef & { data: { path: string } } =>
    Boolean(service.data),
  );

export const baseVolumes = (env: ProjectEnvironment, key: string): CleanBaseVolume[] =>
  dataServices(env).map((service) => ({
    service: service.name,
    name: baseVolumeName(key, service.name),
  }));

export function baseVolumeArgs(key: string, volume: CleanBaseVolume, sizeInBytes?: number) {
  return [
    "volume",
    "create",
    ...nexLabels({ [BASE_LABEL]: key, [PROJECT_LABEL]: key, [SERVICE_LABEL]: volume.service }),
    ...(sizeInBytes ? ["-s", String(sizeInBytes)] : []),
    volume.name,
  ];
}

export const baseSteps = (env: ProjectEnvironment): EnvPrepareStep[] => [
  ...(env.taskPrepare ?? []),
  ...(env.prepare ?? []),
];

export function planSteps(env: ProjectEnvironment): CleanBaseStep[] {
  return [
    { label: "Start the services", state: "pending" },
    ...baseSteps(env).map((step): CleanBaseStep => ({
      label: step.command,
      code: true,
      detail: step.service,
      state: "pending",
    })),
    { label: "Stop the databases cleanly", state: "pending" },
    { label: "Save the clean base", state: "pending" },
  ];
}

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

export function startDetail(services: readonly EnvCheckService[]): string {
  const building = services.find((service) => service.state === "building");
  if (building) return `${building.name} · ${building.detail ?? "Building"}`;
  const pulling = services.find((service) => service.state === "pulling");
  if (pulling) return `Downloading ${pulling.detail ?? pulling.name}`;
  const ready = services.filter((service) => service.state === "ready").length;
  const waiting = services
    .filter((service) => service.state === "starting" || service.state === "waiting")
    .map((service) => service.name);
  const shown = waiting.length > 2 ? `${waiting.slice(0, 2).join(", ")}…` : waiting.join(", ");
  return waiting.length > 0
    ? `${ready} of ${services.length} ready · waiting for ${shown}`
    : `${ready} of ${services.length} ready`;
}

export interface ClonePlan {
  service: string;
  source: string;
  target: string;
  args: string[];
}

export function clonePlan(
  volumes: readonly CleanBaseVolume[],
  key: string,
  taskSlug: string,
  sizes: Readonly<Record<string, number>> = {},
): ClonePlan[] {
  return volumes.map((volume) => {
    const target = dataVolumeName(taskSlug, volume.service);
    const size = sizes[volume.name];
    return {
      service: volume.service,
      source: volume.name,
      target,
      args: [
        "volume",
        "create",
        ...nexLabels({
          [TASK_LABEL]: taskSlug,
          [PROJECT_LABEL]: key,
          [SERVICE_LABEL]: volume.service,
        }),
        ...(size ? ["-s", String(size)] : []),
        target,
      ],
    };
  });
}

const SKIPPED_DIRS = /(^|\/)(node_modules|\.venv|venv|site-packages|__pycache__|\.git)\//;
const MIGRATION_PATHS = [/(^|\/)migrations\//, /(^|\/)db\/migrate\//, /(^|\/)alembic\/versions\//];

export function isMigrationPath(path: string, seeds: readonly string[] = []): boolean {
  if (seeds.includes(path)) return true;
  if (SKIPPED_DIRS.test(path) || path.endsWith(".pyc")) return false;
  return MIGRATION_PATHS.some((pattern) => pattern.test(path));
}

export const seedPaths = (env: ProjectEnvironment) =>
  env.services.flatMap((service) => (service.seed?.file ? [service.seed.file] : []));

export function migrationFingerprint(entries: readonly { path: string; text: string }[]): string {
  const hash = createHash("sha256");
  for (const entry of [...entries].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(entry.path).update("\0").update(entry.text).update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}

export function setupKey(env: ProjectEnvironment): string {
  const stores = dataServices(env).map((service) => [
    service.name,
    service.image,
    service.data.path,
    Object.entries(service.env).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  return createHash("sha256")
    .update(JSON.stringify([stores, baseSteps(env)]))
    .digest("hex")
    .slice(0, 16);
}

export interface BaseCheck {
  volumesPresent: boolean;
  fingerprint: string | null;
  setupKey: string;
}

export function baseStatus(
  record: CleanBaseRecord | null,
  building: boolean,
  check: BaseCheck,
): { status: CleanBaseStatus; stale?: CleanBaseStale } {
  if (building) return { status: "building" };
  if (!record) return { status: "none" };
  if (record.status !== "ready") return { status: "failed" };
  if (!check.volumesPresent) return { status: "none" };
  if (record.fingerprint && check.fingerprint && record.fingerprint !== check.fingerprint) {
    return { status: "stale", stale: "migrations" };
  }
  if (record.setupKey && record.setupKey !== check.setupKey) {
    return { status: "stale", stale: "setup" };
  }
  return { status: "ready" };
}
