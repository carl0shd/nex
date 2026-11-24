import { existsSync, statSync, watch } from "fs";
import { totalmem } from "os";
import { join } from "path";
import { createTerminalForSession } from "@native/agents/agent-terminal";
import {
  onAgentActivity,
  refreshAgentSystemNote,
  setAgentSystemNote,
} from "@native/agents/agent-runner";
import * as projectRepo from "@native/db/repositories/project.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import * as settings from "@native/db/repositories/settings.repo";
import * as terminalRepo from "@native/db/repositories/terminal.repo";
import type { Project, ProjectEnvironment, Session, Terminal } from "@native/db/types";
import { isIgnored } from "@native/git/watcher";
import { readPreferences } from "@native/main/preferences";
import type { BuildPlan } from "./build";
import { run, runOk } from "./cli";
import {
  bootLog,
  containerMemory,
  imageExists,
  inspectContainer,
  lastLogLine,
  listContainers,
  listVolumes,
  removeCleanBases,
  removeTaskResources,
} from "./containers";
import { orderServices, searchDomain } from "./definition";
import { migratesOnStart } from "./detect-prepare";
import { brokenSummary, imageConfig, planRun, runServices, waitReady } from "./env-run";
import {
  APP_STOP_SECONDS,
  dataServices,
  prepareExecArgs,
  stepServices,
  stopArgs,
  stopOrder,
  STORE_STOP_SECONDS,
} from "./env-steps";
import { CHECK_LABEL, isNex, SERVICE_LABEL, TASK_LABEL } from "./labels";
import { friendlyError, gbFromBytes, memoryChoices, parseLines, type ContainerInfo } from "./parse";
import {
  blockedPorts,
  checkProxyPorts,
  configureProxy,
  forgetAddresses,
  onProxyChange,
  proxyEntryPort,
  setProxyTasks,
} from "./proxy";
import { envInstance } from "./instance";
import { nexAddressesOn, onNexAddressesChange, refreshNexAddresses, startNexDns } from "./nex-dns";
import { projectFiles } from "./project-files";
import { proxyTask } from "./proxy-routing";
import {
  container,
  containerPath,
  ensureContentStore,
  systemRunning,
  volumeImagePath,
} from "./runtime";
import { environmentsEnabled, exclusive, log } from "./service";
import {
  agentEnvironmentNote,
  admit,
  budgetGb,
  downFrom,
  environmentMemoryMb,
  exitCodeFromBootLog,
  forwardedPath,
  forwardPlan,
  idleToPause,
  initialServices,
  logsCommand,
  mountTargets,
  notesEnvironment,
  observedStatus,
  pauseAfterMs,
  pauseSuggestion,
  reconciledStatus,
  runAtMost,
  serviceUrl,
  slugSource,
  startsByItself,
  TASK_ENVS_KEY,
  taskSlug,
  touchArgs,
  withPortProbe,
  type AddressOptions,
  type IdleCandidate,
} from "./task-env-plan";
import { containerName, dataVolumeName, type ContainerRun } from "./translate";
import type {
  EnvCheckService,
  StoredTaskEnv,
  TaskEnvPause,
  TaskEnvService,
  TaskEnvState,
  TaskEnvStatus,
  TaskEnvStepState,
} from "./types";

const POLL_MS = 15_000;
const LEGACY_BASES_KEY = "cleanBases";
const FORWARD_DEBOUNCE_MS = 150;
const FORWARD_TIMEOUT_MS = 10_000;
const USAGE_FRESH_MS = 5_000;
const RESUME_READY_MS = 2 * 60_000;
const START_TIMEOUT_MS = 2 * 60_000;
const STOP_TIMEOUT_MS = (STORE_STOP_SECONDS + 30) * 1000;
const PREPARE_TIMEOUT_MS = 30 * 60_000;
const IDLE_HINT_MS = 5 * 60_000;

const ACTIVE: ReadonlySet<TaskEnvStatus> = new Set(["starting", "running", "down"]);

interface Live {
  state: TaskEnvState;
  env: ProjectEnvironment;
  controller: AbortController | null;
  starting: Promise<void> | null;
  stopping: Promise<void> | null;
  fresh: boolean;
  seeded: boolean;
  restarting: Set<string>;
  exited: Set<string>;
  stopForwarding: (() => void) | null;
}

const envs = new Map<string, Live>();
const queue: string[] = [];
const listeners = new Set<(state: TaskEnvState) => void>();
const agentRunning = new Set<string>();
const skipNextView = new Set<string>();
let viewing: string | null = null;
let usage = { at: 0, usedGb: 0 };
let advancing: Promise<void> = Promise.resolve();
let started = false;

const readStored = () => settings.get<Record<string, StoredTaskEnv>>(TASK_ENVS_KEY, {});

function store(sessionId: string, record: StoredTaskEnv | null) {
  const { [sessionId]: _previous, ...rest } = readStored();
  settings.set(TASK_ENVS_KEY, record ? { ...rest, [sessionId]: record } : rest);
}

function persist(live: Live) {
  const { state } = live;
  if (state.status === "running" || state.status === "down") {
    store(state.sessionId, {
      slug: state.slug,
      status: "running",
      readyMs: state.readyMs,
      ...seededFlag(live),
    });
  } else if (state.status === "paused") {
    store(state.sessionId, {
      slug: state.slug,
      status: "paused",
      pausedAt: state.pausedAt,
      pausedReason: state.pausedReason,
      idleMinutes: state.idleMinutes,
      ...seededFlag(live),
    });
  } else if (state.status === "failed") {
    store(state.sessionId, {
      slug: state.slug,
      status: "failed",
      error: state.error,
      ...seededFlag(live),
    });
  }
}

const seededFlag = (live: Live) => (live.seeded ? {} : { seeded: false });

export function onTaskEnvironment(listener: (state: TaskEnvState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(state: TaskEnvState) {
  for (const listener of listeners) listener(state);
  routeAddresses();
}

const ROUTED: ReadonlySet<TaskEnvStatus> = new Set(["starting", "running", "down", "paused"]);

function routeAddresses() {
  const tasks = [...envs.values()]
    .filter((live) => ROUTED.has(live.state.status))
    .map(({ env, state }) =>
      proxyTask(env, state.slug, state.startedAt ?? 0, state.status === "paused"),
    );
  const viewed = viewing ? (envs.get(viewing)?.state.slug ?? null) : null;
  void setProxyTasks(tasks, viewed);
}

const addressOptions = (): AddressOptions => ({
  port: proxyEntryPort(),
  nex: nexAddressesOn(),
  hostPorts: envInstance().ownsMacNetwork,
});

function followProxy() {
  const blocked = blockedPorts();
  const addresses = addressOptions();
  for (const live of envs.values()) {
    const { env, state } = live;
    const owners = new Map(
      proxyTask(env, state.slug, 0, false).services.flatMap((service) =>
        service.ports.map((port) => [port.host, service.name] as const),
      ),
    );
    const mine = blocked.flatMap((item) => {
      const service = owners.get(item.port);
      return service ? [{ ...item, service }] : [];
    });
    const defs = new Map(env.services.map((service) => [service.name, service]));
    const services = state.services.map((service) => {
      const def = defs.get(service.name);
      return def ? { ...service, ...serviceUrl(env, def, state.slug, addresses) } : service;
    });
    const next = { blockedPorts: mine.length > 0 ? mine : undefined, services };
    const current = { blockedPorts: state.blockedPorts, services: state.services };
    if (JSON.stringify(next) !== JSON.stringify(current)) update(live, next);
  }
}

function update(live: Live, patch: Partial<TaskEnvState>) {
  live.state = { ...live.state, ...patch };
  publish(live.state);
}

function updateServices(live: Live, names: readonly string[], patch: Partial<TaskEnvService>) {
  update(live, {
    services: live.state.services.map((service) =>
      names.includes(service.name) ? { ...service, ...patch } : service,
    ),
  });
}

interface TaskContext {
  session: Session;
  project: Project;
  env: ProjectEnvironment;
}

function context(sessionId: string): TaskContext | null {
  const session = sessionRepo.getById(sessionId);
  const project = session ? projectRepo.getById(session.projectId) : null;
  const env = project?.environment;
  if (!session || !project || !env || env.services.length === 0) return null;
  return { session, project, env };
}

const deletingSlugs = new Set<string>();

function ensureSlug(session: Session): string {
  if (session.envSlug) return session.envSlug;
  const taken = new Set([
    ...sessionRepo
      .getAll()
      .filter((item) => item.id !== session.id)
      .map((item) => item.envSlug)
      .filter(Boolean),
    ...deletingSlugs,
  ]);
  const slug = taskSlug(slugSource(session.name, session.title), taken);
  sessionRepo.setEnvSlug(session.id, slug);
  return slug;
}

function liveFor(sessionId: string): Live | null {
  const existing = envs.get(sessionId);
  if (existing) return existing;
  const ctx = context(sessionId);
  if (!ctx) return null;
  const slug = ensureSlug(ctx.session);
  const live: Live = {
    env: ctx.env,
    state: {
      sessionId,
      projectId: ctx.project.id,
      slug,
      status: "none",
      services: initialServices(ctx.env, slug, "stopped", addressOptions()),
      steps: [],
      memoryMb: environmentMemoryMb(ctx.env),
      usedGb: 0,
      lastActiveAt: Date.now(),
      idle: false,
    },
    controller: null,
    starting: null,
    stopping: null,
    fresh: false,
    seeded: readStored()[sessionId]?.seeded !== false,
    restarting: new Set(),
    exited: new Set(),
    stopForwarding: null,
  };
  envs.set(sessionId, live);
  return live;
}

export const taskEnvironments = (): TaskEnvState[] => [...envs.values()].map((live) => live.state);

const hostMemoryGb = () => Math.round(totalmem() / 1024 ** 3);

function budget() {
  const prefs = readPreferences();
  return {
    maxRunning: runAtMost(prefs.envRunAtMost),
    memoryGb: budgetGb(prefs.envMemory, memoryChoices(hostMemoryGb())),
  };
}

const ownContainers = (containers: readonly ContainerInfo[], slug: string) =>
  containers.filter((item) => isNex(item.labels) && item.labels[TASK_LABEL] === slug);

async function measure(): Promise<Map<string, number>> {
  const running = (await listContainers()).filter(
    (item) => isNex(item.labels) && !item.labels[CHECK_LABEL] && item.state === "running",
  );
  const memory = await containerMemory(running.map((item) => item.id));
  const total = [...memory.values()].reduce((sum, bytes) => sum + bytes, 0);
  usage = { at: Date.now(), usedGb: gbFromBytes(total) };
  return memory;
}

function candidates(): IdleCandidate[] {
  return [...envs.values()].map(({ state }) => ({
    sessionId: state.sessionId,
    status: state.status,
    lastActiveAt: state.lastActiveAt,
    viewing: viewing === state.sessionId,
    agentRunning: agentRunning.has(state.sessionId),
  }));
}

function taskTitle(sessionId: string) {
  const session = sessionRepo.getById(sessionId);
  return session ? session.title || session.name : "another task";
}

async function admitQueued(): Promise<void> {
  while (queue.length > 0) {
    const sessionId = queue[0] as string;
    const live = envs.get(sessionId);
    if (!live || live.state.status !== "queued") {
      queue.shift();
      continue;
    }
    if (Date.now() - usage.at > USAGE_FRESH_MS) await measure().catch(() => null);
    const others = [...envs.values()].filter(
      (item) => item !== live && ACTIVE.has(item.state.status),
    );
    const load = {
      active: others.length,
      startingMb: others
        .filter((item) => item.state.status === "starting")
        .reduce((sum, item) => sum + item.state.memoryMb, 0),
      usedGb: usage.usedGb,
    };
    const limits = budget();
    const decision = admit(load, limits, live.state.memoryMb);
    if (!decision.ok) {
      const suggested = pauseSuggestion(candidates(), sessionId);
      update(live, {
        waiting: {
          reason: decision.reason,
          running: load.active,
          max: limits.maxRunning,
          usedGb: usage.usedGb,
          budgetGb: limits.memoryGb,
          ...(suggested
            ? { suggestion: { sessionId: suggested, title: taskTitle(suggested) } }
            : {}),
        },
      });
      return;
    }
    queue.shift();
    const starting = begin(live);
    live.starting = starting;
    void starting.finally(() => {
      if (live.starting === starting) live.starting = null;
    });
  }
}

function advance(): Promise<void> {
  advancing = advancing.then(admitQueued, admitQueued).catch(() => {});
  return advancing;
}

const turnedOff = (sessionId: string) => sessionRepo.getById(sessionId)?.envOff === true;

export function startTaskEnvironment(sessionId: string): TaskEnvState | null {
  if (!environmentsEnabled()) return null;
  const live = liveFor(sessionId);
  if (!live) return null;
  if (turnedOff(sessionId)) {
    sessionRepo.setEnvOff(sessionId, false);
    refreshAgentSystemNote(sessionId);
  }
  if (live.state.status === "queued" || ACTIVE.has(live.state.status)) return live.state;
  if (!queue.includes(sessionId)) queue.push(sessionId);
  update(live, { status: "queued", error: undefined, down: undefined, waiting: undefined });
  void advance();
  return live.state;
}

async function runTaskPrepare(
  live: Live,
  env: ProjectEnvironment,
  spec: ContainerRun,
  signal: AbortSignal,
) {
  const service = env.services.find((item) => item.name === spec.service);
  const steps = (env.taskPrepare ?? []).filter((step) => step.service === spec.service);
  if (!service || steps.length === 0) return;
  const config = await imageConfig(service, spec.image);
  for (const step of steps) {
    if (signal.aborted) return;
    updateServices(live, [spec.service], { detail: step.command });
    const result = await run(container(), prepareExecArgs(spec.name, config, step.command), {
      log,
      signal,
      timeoutMs: PREPARE_TIMEOUT_MS,
    });
    if (result.code !== 0 && !signal.aborted) {
      const last = parseLines(`${result.stdout}\n${result.stderr}`).at(-1);
      throw new Error(`${step.command} failed${last ? `: ${friendlyError(last)}` : ""}`);
    }
  }
}

function runSpec(slug: string, env: ProjectEnvironment, name: string): ContainerRun {
  const service = env.services.find((item) => item.name === name);
  const spec = { service: name, name: containerName(slug, name), image: "", aliases: [], args: [] };
  return withPortProbe({ ...spec, ready: service?.ready }, service);
}

async function resume(
  live: Live,
  env: ProjectEnvironment,
  own: readonly ContainerInfo[],
  signal: AbortSignal,
) {
  const { slug } = live.state;
  const ready = new Map<string, Promise<void>>();
  for (const service of orderServices(env.services)) {
    const dependencies = service.dependsOn.map((name) => ready.get(name));
    const start = async () => {
      await Promise.all(dependencies);
      if (signal.aborted) return;
      const info = own.find((item) => item.labels[SERVICE_LABEL] === service.name);
      updateServices(live, [service.name], { state: "starting", detail: undefined });
      if (info?.state !== "running") {
        await runOk(container(), ["start", containerName(slug, service.name)], {
          log,
          timeoutMs: START_TIMEOUT_MS,
        });
      }
      const note = await waitReady(
        runSpec(slug, env, service.name),
        RESUME_READY_MS,
        false,
        signal,
      );
      updateServices(live, [service.name], { state: "ready", detail: note });
    };
    ready.set(service.name, start());
  }
  await Promise.all(ready.values());
}

const INTERRUPTED =
  "Nex quit while it was preparing the data. Start it again to begin from scratch.";

async function freshData(live: Live, env: ProjectEnvironment, existing: Set<string>) {
  const names = dataServices(env).map((service) => dataVolumeName(live.state.slug, service.name));
  if (!live.seeded) {
    for (const name of names.filter((item) => existing.has(item))) {
      await run(container(), ["volume", "rm", name], { log });
      existing.delete(name);
    }
  }
  const empty = names.some((name) => !existing.has(name));
  if (empty && (env.prepare ?? []).length > 0) {
    live.seeded = false;
    store(live.state.sessionId, {
      slug: live.state.slug,
      status: "failed",
      error: INTERRUPTED,
      seeded: false,
    });
  }
}

async function strictServices(env: ProjectEnvironment, worktreePath: string) {
  const files = projectFiles(worktreePath);
  const migrating = await Promise.all(
    env.services.map(async (service) =>
      (await migratesOnStart(files, service)) ? service.name : null,
    ),
  );
  return new Set([
    ...dataServices(env).map((service) => service.name),
    ...stepServices(env),
    ...migrating.filter((name): name is string => name !== null),
  ]);
}

function updateStep(live: Live, index: number, state: TaskEnvStepState) {
  update(live, {
    steps: live.state.steps.map((step, at) => (at === index ? { ...step, state } : step)),
  });
}

async function runPrepare(
  live: Live,
  env: ProjectEnvironment,
  runs: readonly ContainerRun[],
  signal: AbortSignal,
) {
  for (const [index, step] of (env.prepare ?? []).entries()) {
    if (signal.aborted) return;
    const service = env.services.find((item) => item.name === step.service);
    const spec = runs.find((item) => item.service === step.service);
    if (!service || !spec) throw new Error(`${step.service} isn’t a service.`);
    updateStep(live, index, "running");
    const config = await imageConfig(service, spec.image);
    const result = await run(container(), prepareExecArgs(spec.name, config, step.command), {
      log,
      signal,
      timeoutMs: PREPARE_TIMEOUT_MS,
    });
    if (signal.aborted) return;
    if (result.code !== 0) {
      updateStep(live, index, "failed");
      const last = parseLines(`${result.stdout}\n${result.stderr}`).at(-1);
      throw new Error(`${step.command} failed${last ? `: ${friendlyError(last)}` : ""}`);
    }
    updateStep(live, index, "done");
  }
  live.seeded = true;
}

function fail(live: Live, message: string) {
  log(`Environment of ${live.state.slug} failed: ${message}`);
  live.fresh = true;
  update(live, { status: "failed", error: message });
  persist(live);
  const ctx = context(live.state.sessionId);
  if (ctx) void stopContainers(ctx.env, live.state.slug).catch(() => {});
}

async function begin(live: Live): Promise<void> {
  const ctx = context(live.state.sessionId);
  if (!ctx) {
    update(live, { status: "none" });
    return;
  }
  const { session, project, env } = ctx;
  const { slug } = live.state;
  const controller = new AbortController();
  live.controller = controller;
  const { signal } = controller;
  const startedAt = Date.now();
  live.exited.clear();
  live.env = env;
  forgetAddresses(slug);
  update(live, {
    status: "starting",
    startedAt,
    services: initialServices(env, slug, "waiting", addressOptions()),
    memoryMb: environmentMemoryMb(env),
    steps: [],
    error: undefined,
    down: undefined,
    waiting: undefined,
    pausedAt: undefined,
    pausedReason: undefined,
    idleMinutes: undefined,
    readyMs: undefined,
    lastActiveAt: Date.now(),
  });
  try {
    await live.stopping;
    if (!(await systemRunning())) throw new Error("Apple container isn’t running.");
    const [containers, volumes] = await Promise.all([listContainers(), listVolumes()]);
    const own = ownContainers(containers, slug);
    const present = new Set(own.map((item) => item.labels[SERVICE_LABEL]));
    const current = own.every((item) => item.searchDomains.includes(searchDomain(slug)));
    if (
      !live.fresh &&
      live.seeded &&
      current &&
      own.length > 0 &&
      env.services.every((s) => present.has(s.name))
    ) {
      await resume(live, env, own, signal);
    } else {
      if (own.length > 0) {
        await run(container(), ["delete", "--force", ...own.map((item) => item.id)], { log });
      }
      const existing = new Set(
        volumes
          .filter((item) => isNex(item.labels) && item.labels[TASK_LABEL] === slug)
          .map((item) => item.name),
      );
      await freshData(live, env, existing);
      if (!live.seeded) {
        update(live, {
          steps: (env.prepare ?? []).map((step) => ({ ...step, state: "pending" })),
        });
      }
      if (signal.aborted) return;
      const { builds, plan } = await planRun(
        {
          environment: env,
          projectPath: project.path,
          projectName: project.name,
          worktreePath: session.worktreePath,
        },
        { taskSlug: slug, mountProject: true },
      );
      const defs = new Map(env.services.map((service) => [service.name, service]));
      plan.runs = plan.runs.map((spec) => withPortProbe(spec, defs.get(spec.service)));
      const missingBuilds: BuildPlan[] = [];
      for (const build of builds) if (!(await imageExists(build.tag))) missingBuilds.push(build);
      ensureContentStore();
      const details = new Map<string, Partial<EnvCheckService>>();
      const { broken } = await runServices({
        environment: env,
        builds: missingBuilds,
        plan,
        signal,
        existingVolumes: existing,
        strictPorts: await strictServices(env, session.worktreePath),
        buildLock: exclusive,
        afterReady: (spec) => runTaskPrepare(live, env, spec, signal),
        report: (names, patch) => {
          for (const name of names) details.set(name, { ...details.get(name), ...patch });
          updateServices(live, names, patch);
        },
      });
      if (signal.aborted) return;
      if (broken.length > 0) {
        const detail = details.get(broken[0] as string)?.detail;
        fail(live, broken.length === 1 && detail ? detail : brokenSummary(broken));
        return;
      }
      if (!live.seeded) await runPrepare(live, env, plan.runs, signal);
    }
    if (signal.aborted) return;
    forgetAddresses(slug);
    const readyMs = Date.now() - startedAt;
    log(`Environment of ${slug} ready in ${readyMs} ms`);
    live.fresh = false;
    update(live, { status: "running", readyMs, lastActiveAt: Date.now() });
    persist(live);
    startForwarding(live);
  } catch (error) {
    if (!signal.aborted) {
      fail(live, friendlyError(error instanceof Error ? error.message : String(error)));
    }
  } finally {
    if (live.controller === controller) live.controller = null;
    void advance();
  }
}

async function stopContainers(env: ProjectEnvironment, slug: string) {
  const { apps, stores } = stopOrder(env);
  const byName = new Map(env.services.map((service) => [service.name, service]));
  await Promise.all(
    apps.map(async (name) => {
      const service = byName.get(name);
      if (service) {
        await run(container(), stopArgs(service, containerName(slug, name), APP_STOP_SECONDS), {
          log,
        });
      }
    }),
  );
  for (const name of stores) {
    const service = byName.get(name);
    if (!service) continue;
    await run(container(), stopArgs(service, containerName(slug, name), STORE_STOP_SECONDS), {
      log,
      timeoutMs: STOP_TIMEOUT_MS,
    });
  }
}

export function pauseTaskEnvironment(
  sessionId: string,
  reason: TaskEnvPause = "you",
  idleMinutes?: number,
): Promise<void> {
  const live = envs.get(sessionId);
  const ctx = context(sessionId);
  if (!live || !ctx) return Promise.resolve();
  const wasQueued = queue.indexOf(sessionId);
  if (wasQueued >= 0) queue.splice(wasQueued, 1);
  live.controller?.abort();
  live.stopForwarding?.();
  live.stopForwarding = null;
  update(live, {
    status: "paused",
    pausedAt: Date.now(),
    pausedReason: reason,
    idleMinutes,
    waiting: undefined,
    down: undefined,
    usedGb: 0,
    services: live.state.services.map((service) => ({
      ...service,
      state: "stopped",
      detail: undefined,
    })),
  });
  persist(live);
  forgetAddresses(live.state.slug);
  log(`Pausing the environment of ${live.state.slug}`);
  const { starting, stopping: previous } = live;
  const stopping = (async () => {
    await previous;
    await starting?.catch(() => {});
    await stopContainers(ctx.env, live.state.slug).catch(() => {});
  })();
  live.stopping = stopping.finally(() => {
    if (live.stopping === stopping) live.stopping = null;
    void advance();
  });
  void advance();
  return live.stopping;
}

export async function restartTaskEnvironment(sessionId: string, service?: string): Promise<void> {
  const live = envs.get(sessionId);
  const ctx = context(sessionId);
  if (!live || !ctx) return;
  const def = service ? ctx.env.services.find((item) => item.name === service) : undefined;
  if (!def || live.state.status === "paused" || live.state.status === "starting") {
    await pauseTaskEnvironment(sessionId, "restart");
    startTaskEnvironment(sessionId);
    return;
  }
  const name = containerName(live.state.slug, def.name);
  live.restarting.add(def.name);
  live.exited.delete(def.name);
  updateServices(live, [def.name], { state: "starting", detail: undefined });
  try {
    await run(container(), stopArgs(def, name, def.data ? STORE_STOP_SECONDS : APP_STOP_SECONDS), {
      log,
      timeoutMs: STOP_TIMEOUT_MS,
    });
    await runOk(container(), ["start", name], { log, timeoutMs: START_TIMEOUT_MS });
    const note = await waitReady(
      runSpec(live.state.slug, ctx.env, def.name),
      RESUME_READY_MS,
      false,
    );
    forgetAddresses(live.state.slug);
    updateServices(live, [def.name], { state: "ready", detail: note });
    if (live.state.down?.service === def.name) {
      update(live, { status: "running", down: undefined });
      persist(live);
    }
  } catch (error) {
    const message = friendlyError(error instanceof Error ? error.message : String(error));
    updateServices(live, [def.name], { state: "failed", detail: message });
    update(live, {
      status: "down",
      down: downFrom(def.name, null, message),
    });
  } finally {
    live.restarting.delete(def.name);
  }
}

export async function deleteTaskEnvironment(sessionId: string): Promise<void> {
  const live = envs.get(sessionId);
  const slug =
    live?.state.slug || sessionRepo.getById(sessionId)?.envSlug || readStored()[sessionId]?.slug;
  const index = queue.indexOf(sessionId);
  if (index >= 0) queue.splice(index, 1);
  const pending = [live?.starting, live?.stopping];
  if (live) {
    live.controller?.abort();
    live.stopForwarding?.();
    envs.delete(sessionId);
    publish({ ...live.state, status: "none", services: [], usedGb: 0 });
  }
  store(sessionId, null);
  skipNextView.delete(sessionId);
  if (!slug) return;
  forgetAddresses(slug);
  log(`Deleting the environment of ${slug}`);
  deletingSlugs.add(slug);
  try {
    await Promise.all(pending.map((work) => work?.catch(() => {})));
    if (await systemRunning()) await removeTaskResources(slug, log).catch(() => {});
  } finally {
    deletingSlugs.delete(slug);
  }
  void advance();
}

export function pauseIdleTaskEnvironments(): Promise<void[]> {
  const idle = [...envs.values()].filter((live) => live.state.idle);
  return Promise.all(idle.map((live) => pauseTaskEnvironment(live.state.sessionId, "idle")));
}

function touch(sessionId: string) {
  const live = envs.get(sessionId);
  if (live) update(live, { lastActiveAt: Date.now(), idle: false });
}

export function forgetProjectEnvironments(projectId: string): void {
  for (const live of [...envs.values()]) {
    if (live.state.projectId !== projectId) continue;
    const { sessionId } = live.state;
    const index = queue.indexOf(sessionId);
    if (index >= 0) queue.splice(index, 1);
    live.controller?.abort();
    live.stopForwarding?.();
    envs.delete(sessionId);
    store(sessionId, null);
    publish({ ...live.state, status: "none", services: [], usedGb: 0 });
  }
  void advance();
}

export function viewTaskEnvironment(sessionId: string | null): void {
  if (viewing && viewing !== sessionId) touch(viewing);
  viewing = sessionId;
  routeAddresses();
  if (!sessionId || !environmentsEnabled()) return;
  touch(sessionId);
  if (skipNextView.delete(sessionId)) return;
  const live = liveFor(sessionId);
  if (live && startsByItself(live.state, turnedOff(sessionId))) startTaskEnvironment(sessionId);
}

export function startTaskEnvironmentOnCreate(sessionId: string): void {
  if (!environmentsEnabled() || !context(sessionId) || turnedOff(sessionId)) return;
  if (readPreferences().envStartOnCreate === false) {
    skipNextView.add(sessionId);
    return;
  }
  startTaskEnvironment(sessionId);
}

export function openTaskEnvironmentLogs(sessionId: string, service?: string): Terminal | null {
  const live = liveFor(sessionId);
  const ctx = context(sessionId);
  if (!live || !ctx) return null;
  const services = service ? [service] : orderServices(ctx.env.services).map((item) => item.name);
  const name = service ? `${service} logs` : "Logs";
  const existing = terminalRepo
    .getBySession(sessionId)
    .find((terminal) => terminal.type === "shell" && terminal.name === name);
  if (existing) return existing;
  return createTerminalForSession({
    sessionId,
    type: "shell",
    name,
    runCommand: logsCommand(container(), live.state.slug, services),
  });
}

export function taskEnvironmentNote(sessionId: string): string | null {
  if (!environmentsEnabled()) return null;
  const live = liveFor(sessionId);
  const binary = containerPath();
  if (live && !notesEnvironment(live.state.status, turnedOff(sessionId))) return null;
  return live && binary ? agentEnvironmentNote(live.state.slug, live.state.services, binary) : null;
}

export async function taskEnvironmentSize(sessionId: string): Promise<number | null> {
  const slug = envs.get(sessionId)?.state.slug || sessionRepo.getById(sessionId)?.envSlug;
  if (!slug || !(await systemRunning())) return null;
  const volumes = (await listVolumes()).filter(
    (item) => isNex(item.labels) && item.labels[TASK_LABEL] === slug,
  );
  if (volumes.length === 0) return null;
  return volumes.reduce((sum, volume) => {
    try {
      return sum + statSync(volumeImagePath(volume.name)).blocks * 512;
    } catch {
      return sum;
    }
  }, 0);
}

function mtimeOf(path: string): number | null {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

function startForwarding(live: Live) {
  live.stopForwarding?.();
  live.stopForwarding = null;
  const ctx = context(live.state.sessionId);
  if (!ctx) return;
  const targets = mountTargets(ctx.env, live.state.slug);
  const root = ctx.session.worktreePath;
  if (targets.length === 0 || !existsSync(root)) return;
  const pending = new Set<string>();
  const touched = new Map<string, number | null>();
  const inflight = new Set<string>();
  let timer: NodeJS.Timeout | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, FORWARD_DEBOUNCE_MS);
  };
  const flush = () => {
    timer = null;
    if (live.state.status !== "running" && live.state.status !== "down") return pending.clear();
    const ready = new Set(
      live.state.services
        .filter((service) => service.state === "ready")
        .map((service) => containerName(live.state.slug, service.name)),
    );
    const paths = [
      ...new Set([...pending].map((path) => forwardedPath(path, existsSync(join(root, path))))),
    ];
    pending.clear();
    for (const batch of forwardPlan(targets, paths)) {
      if (!ready.has(batch.container)) continue;
      if (inflight.has(batch.container)) {
        for (const path of paths) pending.add(path);
        schedule();
        continue;
      }
      for (const path of paths) touched.set(path, mtimeOf(join(root, path)));
      inflight.add(batch.container);
      void run(container(), touchArgs(batch), { timeoutMs: FORWARD_TIMEOUT_MS }).finally(() =>
        inflight.delete(batch.container),
      );
    }
  };
  const echoed = (name: string) => {
    if (!touched.has(name)) return false;
    const before = touched.get(name);
    touched.delete(name);
    return before === mtimeOf(join(root, name));
  };
  try {
    const watcher = watch(root, { recursive: true, persistent: false }, (_event, filename) => {
      const name = typeof filename === "string" ? filename : null;
      if (!name || isIgnored(name) || echoed(name)) return;
      pending.add(name);
      schedule();
    });
    watcher.on("error", () => watcher.close());
    live.stopForwarding = () => {
      watcher.close();
      if (timer) clearTimeout(timer);
    };
  } catch {
    live.stopForwarding = null;
  }
}

const serviceNames = (env: ProjectEnvironment) => env.services.map((service) => service.name);

async function observe(live: Live, containers: readonly ContainerInfo[]) {
  const ctx = context(live.state.sessionId);
  if (!ctx || live.restarting.size > 0 || live.state.status === "starting") return;
  const expected = serviceNames(ctx.env).filter((name) => !live.exited.has(name));
  const own = ownContainers(containers, live.state.slug);
  const observed = own.map((item) => ({
    service: item.labels[SERVICE_LABEL] ?? "",
    running: item.state === "running",
  }));
  const { status, stopped } = observedStatus(expected, observed);
  if (status === "running" && live.state.status === "down") {
    update(live, { status: "running", down: undefined });
    persist(live);
    return;
  }
  if (status !== "down" && status !== "paused") return;
  for (const service of stopped) {
    if (live.state.down?.service === service) return;
    const name = containerName(live.state.slug, service);
    const code = exitCodeFromBootLog(await bootLog(name));
    if (code === 0) {
      live.exited.add(service);
      updateServices(live, [service], { state: "exited", detail: "Finished" });
      continue;
    }
    updateServices(live, [service], { state: "failed", detail: undefined });
    update(live, { status: "down", down: downFrom(service, code, await lastLogLine(name)) });
    persist(live);
    return;
  }
}

async function tick(): Promise<void> {
  refreshNexAddresses();
  if (!environmentsEnabled()) return;
  await reconcileOnce();
  const watched = [...envs.values()].filter((live) => ACTIVE.has(live.state.status));
  if (watched.length === 0 && queue.length === 0) return;
  await checkProxyPorts().catch(() => {});
  const containers = await listContainers();
  const memory = await measure();
  for (const live of watched) {
    const bytes = ownContainers(containers, live.state.slug).reduce(
      (sum, item) => sum + (memory.get(item.id) ?? 0),
      0,
    );
    const usedGb = gbFromBytes(bytes);
    if (usedGb !== live.state.usedGb) update(live, { usedGb });
    if (live.state.status === "running" || live.state.status === "down") {
      await observe(live, containers);
    }
  }
  const now = Date.now();
  const all = candidates();
  const hinted = new Set(idleToPause(all, now, IDLE_HINT_MS));
  for (const live of envs.values()) {
    const idle = hinted.has(live.state.sessionId);
    if (idle !== live.state.idle) update(live, { idle });
  }
  const after = pauseAfterMs(readPreferences().envPauseAfter);
  for (const sessionId of idleToPause(all, now, after)) {
    void pauseTaskEnvironment(sessionId, "idle", after ? Math.round(after / 60_000) : undefined);
  }
  if (queue.length > 0) void advance();
}

async function reconcile(): Promise<void> {
  const stored = readStored();
  for (const [sessionId, record] of Object.entries(stored)) {
    if (sessionRepo.getById(sessionId)) continue;
    await removeTaskResources(record.slug, log).catch(() => {});
    store(sessionId, null);
  }
  const containers = await listContainers();
  for (const session of sessionRepo.getAll()) {
    if (!session.envSlug) continue;
    const live = liveFor(session.id);
    const ctx = context(session.id);
    if (!live || !ctx) continue;
    const own = ownContainers(containers, session.envSlug);
    const observed = observedStatus(
      serviceNames(ctx.env),
      own.map((item) => ({
        service: item.labels[SERVICE_LABEL] ?? "",
        running: item.state === "running",
      })),
    );
    const record = stored[session.id];
    const { status, pausedReason } = reconciledStatus(record, observed.status);
    live.env = ctx.env;
    const running = new Set(
      own.filter((item) => item.state === "running").map((item) => item.labels[SERVICE_LABEL]),
    );
    update(live, {
      status,
      services: initialServices(ctx.env, session.envSlug, "stopped", addressOptions()).map(
        (service) => ({
          ...service,
          state: running.has(service.name) ? "ready" : "stopped",
        }),
      ),
      steps: [],
      readyMs: record?.readyMs,
      ...(status === "paused"
        ? {
            pausedAt: record?.pausedAt ?? Date.now(),
            pausedReason,
            idleMinutes: record?.idleMinutes,
          }
        : {}),
      ...(status === "failed" ? { error: record?.error } : {}),
    });
    live.fresh = status === "failed";
    persist(live);
    if (status === "running" || status === "down") {
      startForwarding(live);
      if (status === "down") await observe(live, containers);
    }
  }
}

export async function initTaskEnvironments(): Promise<void> {
  if (started) return;
  started = true;
  configureProxy({ resolve: async (name) => (await inspectContainer(name))?.ip ?? null, log });
  onProxyChange(followProxy);
  onNexAddressesChange(followProxy);
  void startNexDns(log);
  setAgentSystemNote(taskEnvironmentNote);
  onAgentActivity((sessionId, state) => {
    if (state === "running") agentRunning.add(sessionId);
    else agentRunning.delete(sessionId);
    touch(sessionId);
    if (state !== "running" || !environmentsEnabled()) return;
    const live = liveFor(sessionId);
    if (live && startsByItself(live.state, turnedOff(sessionId))) startTaskEnvironment(sessionId);
  });
  setInterval(() => void tick().catch(() => {}), POLL_MS);
  await reconcileOnce();
}

let reconciled = false;

async function reconcileOnce(): Promise<void> {
  if (reconciled || !environmentsEnabled() || !(await systemRunning())) return;
  reconciled = true;
  if (settings.get(LEGACY_BASES_KEY, null) !== null) {
    await removeCleanBases(log).catch(() => {});
    settings.remove(LEGACY_BASES_KEY);
  }
  await reconcile();
}
