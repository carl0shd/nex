import type { Project, Session } from "@native/db/types";
import type {
  BlockedPort,
  TaskEnvService,
  TaskEnvServiceState,
  TaskEnvState,
} from "@native/environments/types";
import type { EnvBannerState, StartingService } from "@/components/environment/env-banner";
import type { ServiceAddress, ServiceState, TaskService } from "@/components/environment/env-menu";
import type { EnvAddress, EnvStartState } from "@/components/environment/env-start-status";
import type { MachineEnvironment } from "@/components/environment/machine-popover";
import type { EnvState } from "@/components/task/env-button";
import { formatTook } from "@/lib/environments";
import { shortAge } from "@/lib/sidebar-model";

const MINUTE = 60_000;

export function sizeLabel(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}

const IN_PROGRESS: ReadonlySet<TaskEnvServiceState> = new Set(["building", "pulling", "starting"]);

export function envButtonState(env: TaskEnvState | undefined): EnvState | null {
  switch (env?.status) {
    case "queued":
      return "waiting";
    case "starting":
    case "running":
    case "paused":
    case "down":
      return env.status;
    case "failed":
      return "down";
    default:
      return null;
  }
}

const addressLabel = (service: TaskEnvService) =>
  service.url?.replace(/^https?:\/\//, "") ?? service.address ?? service.name;

const VIEWED_DETAIL = "while you view this task";

function viewedAddress(env: TaskEnvState, service: TaskEnvService): EnvAddress | null {
  const port = service.localPort;
  if (!service.url || !port || env.blockedPorts?.some((item) => item.port === port)) return null;
  return { label: `localhost:${port}`, url: `http://localhost:${port}` };
}

const taskAddress = (service: TaskEnvService): EnvAddress | null =>
  service.url ? { label: addressLabel(service), url: service.url } : null;

const mainService = (env: TaskEnvState) => {
  const open = env.services.filter((service) => service.url);
  return open.find((service) => service.main) ?? open[0];
};

export function mainAddress(env: TaskEnvState): EnvAddress | null {
  const main = mainService(env);
  return main ? taskAddress(main) : null;
}

export const envAddresses = (env: TaskEnvState): EnvAddress[] =>
  env.services.flatMap((service) => taskAddress(service) ?? []);

function serviceAddresses(env: TaskEnvState, service: TaskEnvService): ServiceAddress[] {
  const own = taskAddress(service);
  if (!own) return [];
  const viewed = viewedAddress(env, service);
  const local = service.localhostUrl
    ? { label: service.localhostUrl.replace(/^https?:\/\//, ""), url: service.localhostUrl }
    : null;
  const other = viewed ?? local;
  return other ? [own, other] : [own];
}

export function startingSteps(env: TaskEnvState): StartingService[] {
  return [
    ...env.services.map((service): StartingService => ({
      name: service.name,
      state:
        service.state === "ready" ? "done" : IN_PROGRESS.has(service.state) ? "running" : "pending",
    })),
    ...env.steps.map((step): StartingService => ({
      name: `${step.service} data`,
      state: step.state === "done" ? "done" : step.state === "pending" ? "pending" : "running",
    })),
  ];
}

export function startProgress(env: TaskEnvState): { step: number; total: number } {
  const steps = startingSteps(env);
  return { step: steps.filter((step) => step.state === "done").length, total: steps.length };
}

function serviceState(env: TaskEnvState, service: TaskEnvService): ServiceState {
  if (env.status === "paused" || env.status === "queued") return "paused";
  if (service.state === "ready") return "up";
  if (service.state === "failed") return "down";
  if (IN_PROGRESS.has(service.state) || service.state === "waiting") return "starting";
  return "paused";
}

export const blockedLabel = (blocked: BlockedPort) =>
  blocked.reason === "denied"
    ? `Port ${blocked.port} needs administrator rights`
    : `Port ${blocked.port} is used by another app`;

export function menuServices(env: TaskEnvState): TaskService[] {
  return env.services.map((service) => {
    const blocked = env.blockedPorts?.find((item) => item.service === service.name);
    const addresses = serviceAddresses(env, service);
    return {
      name: service.name,
      url: service.url ?? undefined,
      ...(addresses.length > 0 ? { addresses } : {}),
      state: serviceState(env, service),
      detail: service.url
        ? addressLabel(service)
        : service.localPort
          ? `localhost:${service.localPort} · ${VIEWED_DETAIL}`
          : service.ports[0]
            ? `:${service.ports[0]} · inside the task`
            : "Inside the task",
      ...(blocked ? { warning: blockedLabel(blocked) } : {}),
    };
  });
}

const listed = (items: readonly string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

export function blockedTitle(blocked: readonly BlockedPort[]): string | null {
  if (blocked.length === 0) return null;
  if (blocked.length === 1) return blockedLabel(blocked[0] as BlockedPort);
  const ports = listed(blocked.map((item) => String(item.port)));
  return blocked.every((item) => item.reason === "taken")
    ? `Ports ${ports} are used by other apps`
    : `Ports ${ports} can’t be opened`;
}

export function blockedBanner(blocked: readonly BlockedPort[]): EnvBannerState | null {
  const title = blockedTitle(blocked);
  if (!title) return null;
  return {
    kind: "ports",
    title,
    detail: `Nex takes ${blocked.length === 1 ? "it" : "them"} as soon as ${blocked.length === 1 ? "it’s" : "they’re"} free`,
  };
}

const servicesLabel = (count: number) => `${count} ${count === 1 ? "service" : "services"}`;

export function envButtonLabel(env: TaskEnvState): string {
  const name = mainAddress(env)?.label ?? "Environment";
  const { step, total } = startProgress(env);
  switch (env.status) {
    case "starting":
      return `${name} · starting, ${step} of ${total}`;
    case "running":
      return `${name} · ${servicesLabel(env.services.length)} running`;
    case "paused":
      return `${name} · paused`;
    case "queued":
      return `${name} · waiting for room`;
    case "down":
      return `${name} · ${env.down?.service ?? "a service"} stopped`;
    case "failed":
      return `${name} · didn’t start`;
    default:
      return name;
  }
}

export const minutesLabel = (minutes: number) =>
  minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;

const elapsedLabel = (since: number | undefined, now: number) =>
  since ? formatTook(Math.max(now - since, 0)) : "0s";

function waitingDetail(env: TaskEnvState): string {
  const waiting = env.waiting;
  if (!waiting) return "";
  return waiting.reason === "memory"
    ? `${waiting.usedGb.toFixed(1)} of ${waiting.budgetGb} GB in use`
    : `${waiting.running} of ${waiting.max} environments running`;
}

export function bannerState(env: TaskEnvState | undefined, now: number): EnvBannerState | null {
  switch (env?.status) {
    case "starting":
      return {
        kind: "starting",
        services: startingSteps(env),
        elapsed: elapsedLabel(env.startedAt, now),
      };
    case "paused":
      return {
        kind: "paused",
        idleFor:
          env.pausedReason === "idle" && env.idleMinutes
            ? minutesLabel(env.idleMinutes)
            : undefined,
      };
    case "down":
      return {
        kind: "down",
        service: env.down?.service ?? "A service",
        code: env.down?.code ?? null,
        error: env.down?.line ?? "",
      };
    case "failed":
      return { kind: "failed", error: env.error ?? "" };
    case "running":
      return blockedBanner(env.blockedPorts ?? []);
    case "queued":
      return env.waiting
        ? {
            kind: "waiting",
            reason: env.waiting.reason === "memory" ? "memory" : "room",
            detail: waitingDetail(env),
            suggestion: env.waiting.suggestion?.title,
          }
        : null;
    default:
      return null;
  }
}

export function startStatus(env: TaskEnvState | undefined): EnvStartState | null {
  if (!env) return null;
  if (env.status === "starting") {
    const filling = env.steps.some((step) => step.state !== "pending");
    return { kind: filling ? "filling" : "starting", ...startProgress(env) };
  }
  if (env.status === "running") {
    return {
      kind: "ready",
      addresses: envAddresses(env),
      readyIn: env.readyMs ? formatTook(env.readyMs) : undefined,
    };
  }
  if (env.status === "queued" && env.waiting) {
    return {
      kind: "waiting",
      running: env.waiting.running,
      max: env.waiting.max,
      suggestion: env.waiting.suggestion?.title,
    };
  }
  return null;
}

const SHOWN: ReadonlySet<TaskEnvState["status"]> = new Set([
  "queued",
  "starting",
  "running",
  "down",
  "failed",
  "paused",
]);

function machineDetail(env: TaskEnvState, now: number): string {
  const { step, total } = startProgress(env);
  switch (env.status) {
    case "queued":
      return "waiting for room";
    case "starting":
      return `starting ${step} of ${total}`;
    case "down":
      return `${env.down?.service ?? "a service"} stopped`;
    case "failed":
      return "didn’t start";
    case "running":
      return env.idle
        ? `idle ${minutesLabel(Math.max(1, Math.round((now - env.lastActiveAt) / MINUTE)))}`
        : servicesLabel(env.services.length);
    default:
      return "";
  }
}

export interface MachineSource {
  environments: readonly TaskEnvState[];
  sessions: readonly Session[];
  projects: readonly Project[];
  nearlyFull: boolean;
}

export function machineEnvironments(source: MachineSource, now: number): MachineEnvironment[] {
  const shown = source.environments.filter((env) => SHOWN.has(env.status));
  const suggested = source.nearlyFull
    ? shown
        .filter((env) => env.status === "running" && env.idle)
        .toSorted((a, b) => a.lastActiveAt - b.lastActiveAt)[0]?.sessionId
    : undefined;
  return shown.flatMap((env): MachineEnvironment[] => {
    const session = source.sessions.find((item) => item.id === env.sessionId);
    if (!session) return [];
    const project = source.projects.find((item) => item.id === env.projectId);
    const paused = env.status === "paused";
    return [
      {
        id: env.sessionId,
        title: session.title || session.name,
        project: project?.name ?? "",
        detail: machineDetail(env, now),
        state: paused
          ? "paused"
          : env.status === "queued" || env.status === "starting"
            ? "starting"
            : env.status === "running"
              ? "running"
              : "down",
        ...(paused
          ? { pausedFor: shortAge(env.pausedAt ?? now, now) }
          : { gb: env.usedGb, suggested: env.sessionId === suggested }),
      },
    ];
  });
}

export const idleCount = (environments: readonly TaskEnvState[]) =>
  environments.filter((env) => env.status === "running" && env.idle).length;

export function closeEnvironment(
  env: TaskEnvState | undefined,
  sizeBytes: number | null,
): { size?: string; address?: string } | undefined {
  if (!env || (env.status === "none" && sizeBytes === null)) return undefined;
  const main = mainService(env);
  return {
    size: sizeBytes ? sizeLabel(sizeBytes) : undefined,
    address: main && taskAddress(main)?.label,
  };
}
