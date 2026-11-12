import type {
  EnvPrepareStep,
  EnvServiceDef,
  EnvServiceKind,
  ProjectEnvironment,
} from "@native/db/types";
import {
  APP_MEMORY_MB,
  environmentProblems,
  IMAGE_MEMORY_MB,
  knownImage,
  MEMORY_CHOICES_MB,
  serviceAddress,
} from "@native/environments/definition";
import type { EnvCheckServiceState, EnvCheckState } from "@native/environments/types";
import type { DotTone } from "@/components/atoms/status-dot";
import type { Phrase } from "@/lib/project-summary";
import { relativeTime } from "@/lib/relative-time";

export const TASK_PLACEHOLDER = "{task}";

export const addressOf = (
  env: ProjectEnvironment,
  service: EnvServiceDef,
  task = TASK_PLACEHOLDER,
) => serviceAddress(env, service, task);

export const isDataStore = (service: EnvServiceDef) => knownImage(service.image) !== null;

export function serviceDetail(service: EnvServiceDef): string {
  if (service.kind === "build") {
    const dockerfile = service.build?.dockerfile;
    if (!dockerfile) return "";
    const target = service.build?.target;
    return `Built from ${dockerfile}${target ? ` · ${target} stage` : ""}`;
  }
  if (service.kind === "image")
    return service.command ? `${service.image} ${service.command}` : service.image;
  return service.command || service.image;
}

export const detailIsCode = (service: EnvServiceDef) => service.kind !== "build";

const mentions = (text: string, name: string) =>
  new RegExp(`(^|[^a-z0-9-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9-]|$)`).test(
    text,
  );

export function environmentNotices(env: ProjectEnvironment) {
  const problems = environmentProblems(env);
  const broken = env.services
    .map((service) => service.name)
    .filter((name) => name && problems.some((problem) => mentions(problem, name)));
  const warnings = env.warnings.filter(
    (warning) => !problems.includes(warning) && !broken.some((name) => mentions(warning, name)),
  );
  return { problems, warnings };
}

export function mountsNote(service: EnvServiceDef): string | null {
  const mounts = (service.mounts ?? []).map(
    (mount) =>
      `${mount.source || "the project"} at ${mount.target}${mount.readOnly ? " (read only)" : ""}`,
  );
  const kept = service.volumes ?? [];
  const parts = [
    mounts.length ? `Mounts ${listed(mounts)}.` : null,
    kept.length ? `Keeps ${listed(kept)} from the image in each task.` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function listed(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export function servicePort(service: EnvServiceDef): number | undefined {
  return service.ports[0] ?? knownImage(service.image)?.port;
}

export type ServiceRole = "open" | "background" | "data";

const WORKER =
  /celery|worker|sidekiq|flower|scheduler|resque|crontab|\bbeat\b|\bqueue\b|\bcron\b|\brq\b/i;

export function serviceRole(service: EnvServiceDef): ServiceRole {
  if (service.data || isDataStore(service)) return "data";
  if (service.ports.length === 0) return "background";
  return WORKER.test(`${service.name} ${service.command ?? ""}`) ? "background" : "open";
}

export interface PinnedRole {
  index: number;
  role: ServiceRole;
}

export function groupServices(
  env: ProjectEnvironment,
  pinned: PinnedRole | null = null,
): Record<ServiceRole, number[]> {
  const groups: Record<ServiceRole, number[]> = { open: [], background: [], data: [] };
  env.services.forEach((service, index) => {
    groups[pinned?.index === index ? pinned.role : serviceRole(service)].push(index);
  });
  return groups;
}

export function sourcesLine(env: ProjectEnvironment): string {
  const files = env.detectedFrom.join(", ");
  if (env.source === "edited") return files ? `Edited · first found in ${files}` : "Set up by hand";
  return files ? `Found in ${files}` : "Nothing found in this project";
}

export function environmentPhrase(env: ProjectEnvironment, project: string): Phrase {
  const count = env.services.length;
  if (count === 0) return [{ text: "No services yet · tasks run only the agent" }];
  if (count === 1) return [{ text: `Each task runs its own ${env.services[0]?.name}` }];
  return [{ text: `Each task runs ${project}’s ${count} services` }];
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export const issuesLabel = (count: number) => `${plural(count, "thing")} to check`;

export function advancedSummary(service: EnvServiceDef): string {
  const after = service.dependsOn.length ? `starts after ${service.dependsOn.join(", ")}` : null;
  return [
    service.kind === "build" ? "Dockerfile" : "image",
    service.ports.length ? "ports" : null,
    Object.keys(service.env).length || service.envFiles?.length ? "variables" : null,
    after,
  ]
    .filter(Boolean)
    .join(", ");
}

export function seedSummary(env: ProjectEnvironment): string {
  const once = env.prepare?.length ?? 0;
  const each = env.taskPrepare?.length ?? 0;
  const parts = [
    once ? plural(once, "seed step") : null,
    each ? `${plural(each, "step")} in every task` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Nothing to run";
}

export const edited = (env: ProjectEnvironment): ProjectEnvironment => ({
  ...env,
  source: "edited",
});

export function updateService(
  env: ProjectEnvironment,
  name: string,
  patch: Partial<EnvServiceDef>,
): ProjectEnvironment {
  const renamed = patch.name !== undefined && patch.name !== name ? patch.name : null;
  const rename = (steps?: EnvPrepareStep[]) =>
    renamed && steps
      ? steps.map((step) => (step.service === name ? { ...step, service: renamed } : step))
      : steps;
  return edited({
    ...env,
    ...(env.prepare ? { prepare: rename(env.prepare) } : {}),
    ...(env.taskPrepare ? { taskPrepare: rename(env.taskPrepare) } : {}),
    services: env.services.map((service) => {
      if (service.name === name) return { ...service, ...patch };
      if (!renamed) return service;
      return {
        ...service,
        dependsOn: service.dependsOn.map((dependency) =>
          dependency === name ? renamed : dependency,
        ),
      };
    }),
  });
}

export function removeService(env: ProjectEnvironment, name: string): ProjectEnvironment {
  const kept = (steps?: EnvPrepareStep[]) => steps?.filter((step) => step.service !== name);
  return edited({
    ...env,
    ...(env.prepare ? { prepare: kept(env.prepare) } : {}),
    ...(env.taskPrepare ? { taskPrepare: kept(env.taskPrepare) } : {}),
    services: env.services
      .filter((service) => service.name !== name)
      .map((service) => ({
        ...service,
        dependsOn: service.dependsOn.filter((dependency) => dependency !== name),
      })),
  });
}

function freeName(env: ProjectEnvironment, base: string): string {
  const taken = new Set(env.services.map((service) => service.name));
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index++;
  return `${base}-${index}`;
}

export function addService(env: ProjectEnvironment, kind: EnvServiceKind) {
  const service: EnvServiceDef = {
    name: freeName(env, kind === "image" ? "service" : "app"),
    kind,
    image: "",
    ...(kind === "build" ? { build: { context: "", dockerfile: "Dockerfile" } } : {}),
    ports: [],
    env: {},
    dependsOn: [],
    memoryMb: kind === "image" ? IMAGE_MEMORY_MB : APP_MEMORY_MB,
  };
  return { env: edited({ ...env, services: [...env.services, service] }), name: service.name };
}

export type StepList = "prepare" | "taskPrepare";

export const updateSteps = (
  env: ProjectEnvironment,
  list: StepList,
  steps: EnvPrepareStep[],
): ProjectEnvironment => edited({ ...env, [list]: steps });

export const serviceOptions = (env: ProjectEnvironment) =>
  env.services.map((service) => ({ value: service.name, label: service.name }));

export function parsePorts(text: string): number[] {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map((part) => Number.parseInt(part, 10))
        .filter((port) => Number.isInteger(port) && port > 0),
    ),
  ];
}

export const memoryOptions = (current: number) =>
  [...new Set([...MEMORY_CHOICES_MB, current])]
    .sort((a, b) => a - b)
    .map((mb) => ({
      value: String(mb),
      label: mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb} MB`,
    }));

const CHECK_STATUS: Record<EnvCheckServiceState, { tone: DotTone; label: string }> = {
  waiting: { tone: "idle", label: "Waiting" },
  building: { tone: "blue", label: "Building" },
  pulling: { tone: "blue", label: "Downloading" },
  starting: { tone: "orange", label: "Starting" },
  ready: { tone: "green", label: "Ready" },
  failed: { tone: "red", label: "Failed" },
  skipped: { tone: "idle", label: "Not started" },
};

const BUILT_STATUS: { tone: DotTone; label: string } = { tone: "idle", label: "Built" };

const BUILD_FIRST_TIME = "First time only, then every task reuses it";

export interface ServiceCheck {
  tone: DotTone;
  label: string;
  detail?: string;
  busy: boolean;
}

export function serviceCheck(
  check: EnvCheckState | null | undefined,
  name: string,
): ServiceCheck | null {
  const found = check?.services.find((service) => service.name === name);
  if (!found) return null;
  const built = found.state === "waiting" && Boolean(found.detail);
  return {
    ...(built ? BUILT_STATUS : CHECK_STATUS[found.state]),
    detail: found.detail ?? (found.state === "building" ? BUILD_FIRST_TIME : undefined),
    busy: found.state === "building" || found.state === "pulling" || found.state === "starting",
  };
}

export interface TestStatus {
  tone: DotTone;
  label: string;
  hint: string;
  busy: boolean;
}

const STOPPED = "Stopped";

export function testStatus(check: EnvCheckState | null | undefined, now: number): TestStatus {
  if (!check) {
    return {
      tone: "idle",
      label: "Not tested yet",
      hint: "Run it once to see every service start",
      busy: false,
    };
  }
  const count = (state: EnvCheckServiceState) =>
    check.services.filter((service) => service.state === state).length;
  if (check.phase === "running") {
    const total = check.services.length;
    return {
      tone: "blue",
      label: "Testing…",
      hint: total ? `${count("ready")} of ${total} ready` : "Starting",
      busy: true,
    };
  }
  if (check.phase === "done") {
    const tested = `Tested ${relativeTime(check.finishedAt ?? check.startedAt, now)}`;
    const silent = check.services.filter((service) => service.silent).length;
    return silent
      ? {
          tone: "orange",
          label: "Everything starts",
          hint: `${plural(silent, "isn’t", "aren’t")} answering yet · ${tested}`,
          busy: false,
        }
      : { tone: "green", label: "Everything starts", hint: tested, busy: false };
  }
  if (check.error === STOPPED) {
    return {
      tone: "idle",
      label: "Test stopped",
      hint: "Run it again when you’re ready",
      busy: false,
    };
  }
  const failed = count("failed");
  return {
    tone: "red",
    label: failed ? `${plural(failed, "needs", "need")} attention` : "The test didn’t finish",
    hint: check.error ?? "Open the red services to see why",
    busy: false,
  };
}

export interface FoundService {
  name: string;
  detail: string;
  code: boolean;
  meta?: string;
  address?: string;
}

export function foundServices(env: ProjectEnvironment): FoundService[] {
  return env.services.map((service) => {
    const port = servicePort(service);
    const meta = [port ? `:${port}` : null, service.seed ? `seeds from ${service.seed.file}` : null]
      .filter(Boolean)
      .join(" · ");
    return {
      name: service.name,
      detail: serviceDetail(service),
      code: detailIsCode(service),
      ...(meta ? { meta } : {}),
      ...(addressOf(env, service, "task")
        ? { address: addressOf(env, service, "task") as string }
        : {}),
    };
  });
}
