import { posix } from "path";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  clampMemory,
  ENTRY_PORT,
  hostPortOf,
  LOCAL_DOMAIN,
  mainService,
  NEX_ADDRESS_DOMAIN,
  orderServices,
  originFor,
  serviceAddress,
  serviceRole,
  slugName,
  WORKSPACE_PATH,
  webPort,
} from "./definition";
import { containerName, type ContainerRun } from "./translate";
import type {
  StoredTaskEnv,
  TaskEnvDown,
  TaskEnvService,
  TaskEnvServiceState,
  TaskEnvState,
  TaskEnvStatus,
} from "./types";

export const TASK_ENVS_KEY = "taskEnvironments";
export const MAX_SLUG = 20;
export const MAX_FORWARDED = 200;
export const DEFAULT_RUN_AT_MOST = 3;
export const DEFAULT_PAUSE_MINUTES = 15;

const RESERVED = /^check-/;

function fit(base: string, suffix: string): string {
  return `${base.slice(0, MAX_SLUG - suffix.length).replace(/-+$/, "")}${suffix}`;
}

export function slugSource(name: string, title: string): string {
  const numbered = /^(?<base>.+)-(?<number>\d+)$/.exec(name)?.groups;
  if (!numbered?.base) return name;
  return slugName(title).endsWith(`-${numbered.number}`) ? name : numbered.base;
}

export function taskSlug(name: string, taken: ReadonlySet<string>): string {
  const cleaned = slugName(name) || "task";
  const base = RESERVED.test(cleaned) ? `t-${cleaned}` : cleaned;
  const first = fit(base, "");
  if (!taken.has(first)) return first;
  for (let index = 2; ; index++) {
    const candidate = fit(base, `-${index}`);
    if (!taken.has(candidate)) return candidate;
  }
}

export const startsByItself = (
  state: Pick<TaskEnvState, "status" | "pausedReason">,
  turnedOff: boolean,
) =>
  (state.status === "none" && !turnedOff) ||
  (state.status === "paused" && state.pausedReason !== "you");

export const notesEnvironment = (status: TaskEnvStatus, turnedOff: boolean) =>
  !(status === "none" && turnedOff);

export const environmentMemoryMb = (env: ProjectEnvironment) =>
  env.services.reduce((sum, service) => sum + clampMemory(service.memoryMb), 0);

export function runAtMost(preference: string | undefined): number {
  const value = Number.parseInt(preference ?? "", 10);
  return Number.isFinite(value) && value >= 1 ? value : DEFAULT_RUN_AT_MOST;
}

export function pauseAfterMs(preference: string | undefined): number | null {
  if (preference === undefined) return DEFAULT_PAUSE_MINUTES * 60_000;
  const minutes = Number.parseInt(preference, 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60_000 : null;
}

export function budgetGb(preference: string | undefined, choices: readonly number[]): number {
  const preferred = Number(preference);
  if (choices.includes(preferred)) return preferred;
  return choices.includes(8) ? 8 : (choices.at(-1) ?? 4);
}

export interface EnvLoad {
  active: number;
  startingMb: number;
  usedGb: number;
}

export interface EnvBudget {
  maxRunning: number;
  memoryGb: number;
}

export type Admission = { ok: true } | { ok: false; reason: "count" | "memory" };

export function admit(load: EnvLoad, budget: EnvBudget, needMb: number): Admission {
  if (load.active === 0) return { ok: true };
  if (load.active >= budget.maxRunning) return { ok: false, reason: "count" };
  const usedMb = load.usedGb * 1024 + load.startingMb;
  if (usedMb + needMb > budget.memoryGb * 1024) return { ok: false, reason: "memory" };
  return { ok: true };
}

export interface IdleCandidate {
  sessionId: string;
  status: TaskEnvStatus;
  lastActiveAt: number;
  viewing: boolean;
  agentRunning: boolean;
}

const pausable = (candidate: IdleCandidate) =>
  (candidate.status === "running" || candidate.status === "down") &&
  !candidate.viewing &&
  !candidate.agentRunning;

export function idleToPause(
  candidates: readonly IdleCandidate[],
  now: number,
  pauseAfter: number | null,
): string[] {
  if (pauseAfter === null) return [];
  return candidates
    .filter((candidate) => pausable(candidate) && now - candidate.lastActiveAt >= pauseAfter)
    .map((candidate) => candidate.sessionId);
}

export function pauseSuggestion(
  candidates: readonly IdleCandidate[],
  exclude: string,
): string | null {
  const oldest = candidates
    .filter((candidate) => candidate.sessionId !== exclude && pausable(candidate))
    .toSorted((a, b) => a.lastActiveAt - b.lastActiveAt)[0];
  return oldest?.sessionId ?? null;
}

export interface MountTarget {
  service: string;
  container: string;
  source: string;
  target: string;
}

function repoPath(source: string): string {
  const normalized = posix.normalize(source).replace(/\/+$/, "");
  return normalized === "." ? "" : normalized;
}

export function mountTargets(env: ProjectEnvironment, slug: string): MountTarget[] {
  return env.services.flatMap((service) => {
    const container = containerName(slug, service.name);
    if (service.kind === "app") {
      return [{ service: service.name, container, source: "", target: WORKSPACE_PATH }];
    }
    return (service.mounts ?? [])
      .filter((mount) => !mount.readOnly)
      .map((mount) => ({
        service: service.name,
        container,
        source: repoPath(mount.source),
        target: mount.target,
      }));
  });
}

export interface ForwardBatch {
  container: string;
  paths: string[];
}

export function forwardPlan(
  targets: readonly MountTarget[],
  changed: readonly string[],
  limit = MAX_FORWARDED,
): ForwardBatch[] {
  const batches = new Map<string, Set<string>>();
  for (const path of changed) {
    for (const target of targets) {
      const inside =
        target.source === "" || path === target.source || path.startsWith(`${target.source}/`);
      if (!inside) continue;
      const rest = target.source === "" ? path : path.slice(target.source.length + 1);
      const paths = batches.get(target.container) ?? new Set<string>();
      if (paths.size < limit) paths.add(rest ? posix.join(target.target, rest) : target.target);
      batches.set(target.container, paths);
    }
  }
  return [...batches].map(([container, paths]) => ({ container, paths: [...paths] }));
}

export function forwardedPath(path: string, exists: boolean): string {
  if (exists) return path;
  const parent = posix.dirname(path);
  return parent === "." ? "" : parent;
}

// Touching each file with its own times fires inotify in the container without changing the
// file on the Mac, so the watcher here can tell the echo from a real edit.
export const touchArgs = (batch: ForwardBatch) => [
  "exec",
  batch.container,
  "sh",
  "-c",
  'for f; do touch -c -r "$f" "$f"; done',
  "sh",
  ...batch.paths,
];

export interface ObservedContainer {
  service: string;
  running: boolean;
}

export function observedStatus(
  expected: readonly string[],
  observed: readonly ObservedContainer[],
): { status: Extract<TaskEnvStatus, "none" | "running" | "paused" | "down">; stopped: string[] } {
  if (observed.length === 0) return { status: "none", stopped: [] };
  const running = new Set(observed.filter((item) => item.running).map((item) => item.service));
  const stopped = expected.filter((service) => !running.has(service));
  if (stopped.length === 0) return { status: "running", stopped };
  if (running.size === 0) return { status: "paused", stopped };
  return { status: "down", stopped };
}

export function reconciledStatus(
  stored: StoredTaskEnv | undefined,
  observed: ReturnType<typeof observedStatus>["status"],
): { status: TaskEnvStatus; pausedReason?: StoredTaskEnv["pausedReason"] } {
  if (observed === "none") return { status: stored?.status === "failed" ? "failed" : "none" };
  if (observed === "paused") {
    const paused = stored?.status === "paused";
    return { status: "paused", pausedReason: paused ? stored.pausedReason : "restart" };
  }
  return { status: observed };
}

export function exitCodeFromBootLog(log: string): number | null {
  const matches = [...log.matchAll(/status: (-?\d+) managed process exit/g)];
  const last = matches.at(-1)?.[1];
  return last === undefined ? null : Number(last);
}

export function downFrom(
  service: string,
  code: number | null,
  lastLine: string | undefined,
): TaskEnvDown {
  return { service, code, line: lastLine?.trim() ?? "" };
}

export interface AddressOptions {
  port: number;
  nex: boolean;
}

export const DEFAULT_ADDRESSES: AddressOptions = { port: ENTRY_PORT, nex: false };

export function serviceUrl(
  env: ProjectEnvironment,
  service: EnvServiceDef,
  slug: string,
  addresses: AddressOptions = DEFAULT_ADDRESSES,
): Pick<TaskEnvService, "address" | "url" | "localhostUrl"> {
  const opens = serviceRole(service) === "open" && webPort(service) !== undefined;
  const local = opens ? serviceAddress(env, service, slug, LOCAL_DOMAIN) : null;
  if (!local) return { address: null, url: null, localhostUrl: null };
  const localhostUrl = originFor(local, addresses.port);
  const nex = addresses.nex ? serviceAddress(env, service, slug, NEX_ADDRESS_DOMAIN) : null;
  const url = nex ? originFor(nex, addresses.port) : localhostUrl;
  return {
    address: url.replace(/^http:\/\//, ""),
    url,
    localhostUrl: nex ? localhostUrl : null,
  };
}

export function forwardedPort(service: EnvServiceDef): number | null {
  const role = serviceRole(service);
  const port = role === "data" ? service.ports[0] : role === "open" ? webPort(service) : undefined;
  return port === undefined ? null : hostPortOf(service, port);
}

export function initialServices(
  env: ProjectEnvironment,
  slug: string,
  state: TaskEnvServiceState = "waiting",
  addresses: AddressOptions = DEFAULT_ADDRESSES,
): TaskEnvService[] {
  const main = mainService(env)?.name;
  return orderServices(env.services).map((service) => ({
    name: service.name,
    state,
    ports: service.ports,
    main: service.name === main,
    localPort: forwardedPort(service),
    ...serviceUrl(env, service, slug, addresses),
  }));
}

export function logsCommand(binary: string, slug: string, services: readonly string[]): string {
  const quoted = `'${binary.replace(/'/g, `'\\''`)}'`;
  if (services.length === 1) {
    return `${quoted} logs -n 200 -f ${containerName(slug, services[0] as string)}`;
  }
  const width = Math.max(...services.map((service) => service.length));
  const follow = services.map(
    (service) =>
      `(${quoted} logs -n 50 -f ${containerName(slug, service)} 2>&1 | sed -u 's/^/${service.padEnd(width)} | /') &`,
  );
  return `(${follow.join(" ")} wait)`;
}

export function withPortProbe(
  spec: ContainerRun,
  service: EnvServiceDef | undefined,
): ContainerRun {
  const port = service?.ports[0];
  return spec.ready || port === undefined ? spec : { ...spec, ready: { port } };
}

function agentServiceLine(slug: string, service: TaskEnvService): string {
  const inside = service.ports.map((port) => `${service.name}:${port}`).join(", ");
  const where = [service.url, inside && `inside the task ${inside}`].filter(Boolean).join(" · ");
  return `- ${service.name}${where ? `: ${where}` : ""} (container ${containerName(slug, service.name)})`;
}

export function agentEnvironmentNote(
  slug: string,
  services: readonly TaskEnvService[],
  binary: string,
): string | null {
  if (services.length === 0) return null;
  return [
    "This task has its own environment in Nex: every service runs in an Apple container from this worktree, with its own databases. Nex starts, pauses and resumes it, so don't start these services yourself (no docker compose, no dev servers on the Mac).",
    "",
    "Services:",
    ...services.map((service) => agentServiceLine(slug, service)),
    "",
    `Run a command inside a service with \`${binary} exec <container> <command>\` and read its output with \`${binary} logs -n 100 <container>\`.`,
    "Edits in the worktree reach the containers within a second. Use the addresses above from the Mac: localhost ports reach whichever task the user is viewing, not necessarily this one.",
  ].join("\n");
}
