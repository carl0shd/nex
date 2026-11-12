import { connect } from "net";
import type { ProjectEnvironment } from "@native/db/types";
import {
  buildHashes,
  BUILD_LABEL,
  buildPlans,
  buildStep,
  builtImages,
  type BuildPlan,
} from "./build";
import { run, runOk } from "./cli";
import { builderArgs, imageExists, inspectContainer, removeOtherBuilds } from "./containers";
import { slugName } from "./definition";
import { parseEnvFile } from "./env-file";
import { projectKey } from "./labels";
import { friendlyError, parseLines } from "./parse";
import { projectFiles } from "./project-files";
import { container } from "./runtime";
import { log } from "./service";
import { secondsLabel } from "./setup-steps";
import {
  toContainerRuns,
  type ContainerPlan,
  type ContainerRun,
  type RunTarget,
  type VolumePlan,
} from "./translate";
import type { EnvCheckService } from "./types";

const BUILD_TIMEOUT_MS = 30 * 60_000;
const SEED_TIMEOUT_MS = 10 * 60_000;
const PULL_TIMEOUT_MS = 10 * 60_000;
const RUN_TIMEOUT_MS = 2 * 60_000;
const IMAGE_READY_MS = 2 * 60_000;
const APP_READY_MS = 6 * 60_000;
const STRICT_APP_READY_MS = 20 * 60_000;
const PROBE_TIMEOUT_MS = 10_000;
const POLL_MS = 1000;
const SETTLE_MS = 3000;
const PORT_GRACE_MS = 60_000;

export type ServiceReport = (names: readonly string[], patch: Partial<EnvCheckService>) => void;

interface Deferred {
  promise: Promise<boolean>;
  resolve: () => void;
  settle: (ok: boolean) => void;
}

function deferred(): Deferred {
  let settle: (ok: boolean) => void = () => {};
  const promise = new Promise<boolean>((resolve) => {
    settle = resolve;
  });
  return { promise, resolve: () => settle(true), settle };
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function portOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 1500 });
    const done = (open: boolean) => {
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function recentLogs(name: string): Promise<string> {
  const result = await run(container(), ["logs", "-n", "20", name]);
  if (result.stdout.trim()) log(result.stdout.trim());
  return result.stdout || result.stderr;
}

async function stoppedMessage(spec: ContainerRun): Promise<string> {
  if (!(await inspectContainer(spec.name))) return `${spec.service}’s container was removed.`;
  const last = parseLines(await recentLogs(spec.name)).at(-1);
  return last
    ? `${spec.service} stopped: ${friendlyError(last)}`
    : `${spec.service} stopped right after starting.`;
}

async function probe(spec: ContainerRun, ip: string | null): Promise<boolean> {
  if (spec.ready?.command) {
    const result = await run(container(), ["exec", spec.name, ...spec.ready.command], {
      timeoutMs: PROBE_TIMEOUT_MS,
    });
    return result.code === 0;
  }
  if (spec.ready?.port) return Boolean(ip) && portOpen(ip as string, spec.ready.port);
  return true;
}

async function waitReady(
  spec: ContainerRun,
  timeoutMs: number,
  strictPorts: boolean,
): Promise<string | undefined> {
  const started = Date.now();
  const strict = strictPorts || Boolean(spec.ready?.command);
  while (Date.now() - started < timeoutMs) {
    const info = await inspectContainer(spec.name);
    if (!info || info.state !== "running") throw new Error(await stoppedMessage(spec));
    const elapsed = Date.now() - started;
    if ((strict || elapsed >= SETTLE_MS) && (await probe(spec, info.ip))) return undefined;
    if (!strict && elapsed >= PORT_GRACE_MS)
      return `Running · not answering on :${spec.ready?.port} yet`;
    await wait(POLL_MS);
  }
  await recentLogs(spec.name);
  throw new Error(`${spec.service} didn’t become ready in ${Math.round(timeoutMs / 60_000)} min.`);
}

async function buildImage(plan: BuildPlan, report: ServiceReport, signal: AbortSignal) {
  if (await imageExists(plan.tag)) {
    report(plan.services, { state: "waiting", detail: "Already built" });
    return;
  }
  const started = Date.now();
  report(plan.services, { state: "building", detail: undefined });
  const result = await run(
    container(),
    [...plan.args.slice(0, 1), ...builderArgs(), ...plan.args.slice(1)],
    {
      log,
      signal,
      timeoutMs: BUILD_TIMEOUT_MS,
      onLine: (line) => {
        const detail = buildStep(line);
        if (detail) report(plan.services, { detail });
      },
    },
  );
  if (result.code !== 0) {
    const reason = friendlyError(result.stderr || result.stdout).replace(
      /^failed to solve:\s*/i,
      "",
    );
    throw new Error(`${plan.services[0]} didn’t build: ${reason}`);
  }
  report(plan.services, {
    state: "waiting",
    detail: `Built in ${secondsLabel(Date.now() - started)}`,
  });
  await removeOtherBuilds(plan.tag, BUILD_LABEL, plan.slot, log);
}

async function seedVolumes(spec: ContainerRun): Promise<void> {
  if (!spec.seed) return;
  const result = await run(container(), spec.seed, { log, timeoutMs: SEED_TIMEOUT_MS });
  if (result.code !== 0) {
    throw new Error(
      `${spec.service} couldn’t copy its image’s files into its volumes: ${friendlyError(result.stderr || result.stdout)}`,
    );
  }
}

interface StartOptions {
  volumes: readonly VolumePlan[];
  app: boolean;
  started: Deferred;
  report: ServiceReport;
  strictPorts: boolean;
}

const NO_STRICT: ReadonlySet<string> = new Set();

async function startService(spec: ContainerRun, options: StartOptions) {
  const { report } = options;
  const startedAt = Date.now();
  if (!(await imageExists(spec.image))) {
    report([spec.service], { state: "pulling", detail: spec.image });
    await runOk(container(), ["image", "pull", "--progress", "none", spec.image], {
      log,
      timeoutMs: PULL_TIMEOUT_MS,
    });
  }
  report([spec.service], { state: "starting", detail: undefined });
  for (const volume of options.volumes) await runOk(container(), volume.args, { log });
  await seedVolumes(spec);
  await runOk(container(), spec.args, { log, timeoutMs: RUN_TIMEOUT_MS });
  report([spec.service], { detail: "Running, waiting until it answers" });
  options.started.resolve();
  const timeout = options.app
    ? options.strictPorts
      ? STRICT_APP_READY_MS
      : APP_READY_MS
    : IMAGE_READY_MS;
  const note = await waitReady(spec, timeout, options.strictPorts);
  report([spec.service], {
    state: "ready",
    silent: Boolean(note),
    detail: note ?? `Ready in ${secondsLabel(Date.now() - startedAt)}`,
  });
}

export async function readEnvFiles(
  environment: ProjectEnvironment,
  worktreePath: string,
): Promise<Record<string, Record<string, string>>> {
  const files = projectFiles(worktreePath);
  const found: Record<string, Record<string, string>> = {};
  for (const service of environment.services) {
    for (const path of service.envFiles ?? []) {
      if (path in found) continue;
      const text = await files.read(path);
      if (text === null)
        throw new Error(`${service.name} reads ${path}, which isn’t in this checkout.`);
      found[path] = parseEnvFile(text);
    }
  }
  return found;
}

export interface RunInput {
  environment: ProjectEnvironment;
  projectPath: string;
  projectName: string;
}

export type RunExtras = Pick<
  RunTarget,
  "taskSlug" | "check" | "labels" | "dataVolumes" | "mountProject"
>;

export async function planRun(
  { environment, projectPath, projectName }: RunInput,
  extras: RunExtras,
): Promise<{ builds: BuildPlan[]; plan: ContainerPlan }> {
  const builds = buildPlans(environment, {
    projectSlug: slugName(projectName) || "project",
    projectPath,
    hashes: await buildHashes(environment, projectFiles(projectPath), projectPath),
  });
  const plan = toContainerRuns(environment, {
    ...extras,
    worktreePath: projectPath,
    projectKey: projectKey(projectPath),
    envFiles: await readEnvFiles(environment, projectPath),
    images: builtImages(builds),
  });
  return { builds, plan };
}

export interface ServicesRun {
  environment: ProjectEnvironment;
  builds: readonly BuildPlan[];
  plan: ContainerPlan;
  report: ServiceReport;
  signal: AbortSignal;
  strictPorts?: ReadonlySet<string>;
  beforeStart?: () => Promise<void>;
}

export async function runServices({
  environment,
  builds,
  plan,
  report,
  signal,
  strictPorts = NO_STRICT,
  beforeStart,
}: ServicesRun): Promise<{ broken: string[] }> {
  const failed = new Set<string>();
  const broken: string[] = [];
  const fail = (names: readonly string[], error: unknown) => {
    const message = friendlyError(error instanceof Error ? error.message : String(error));
    log(`Failed: ${message}`);
    report(names, { state: "failed", detail: message });
    for (const name of names) failed.add(name);
    broken.push(...names);
  };
  for (const build of builds) {
    if (signal.aborted) break;
    await buildImage(build, report, signal).catch((error: unknown) => {
      if (!signal.aborted) fail(build.services, error);
    });
  }
  if (signal.aborted) return { broken };
  await beforeStart?.();
  const services = new Map(environment.services.map((service) => [service.name, service]));
  const started = new Map(plan.runs.map((spec) => [spec.service, deferred()]));
  const ready = new Map(plan.runs.map((spec) => [spec.service, deferred()]));
  const launch = async (spec: ContainerRun) => {
    const service = services.get(spec.service);
    for (const name of service?.dependsOn ?? []) {
      const gate = services.get(name)?.ready?.command ? ready.get(name) : started.get(name);
      if (gate && !(await gate.promise) && !failed.has(spec.service)) {
        failed.add(spec.service);
        report([spec.service], { state: "skipped", detail: `Needs ${name}, which failed` });
      }
    }
    if (failed.has(spec.service) || signal.aborted) return;
    await startService(spec, {
      volumes: plan.volumes.filter((volume) => volume.service === spec.service),
      app: service?.kind !== "image",
      started: started.get(spec.service) as Deferred,
      report,
      strictPorts: strictPorts.has(spec.service),
    }).catch((error: unknown) => {
      if (!signal.aborted) fail([spec.service], error);
    });
  };
  await Promise.all(
    plan.runs.map((spec) =>
      launch(spec).finally(() => {
        const ok = !failed.has(spec.service);
        started.get(spec.service)?.settle(ok);
        ready.get(spec.service)?.settle(ok);
      }),
    ),
  );
  return { broken: [...new Set(broken)] };
}

export const brokenSummary = (broken: readonly string[]) =>
  broken.length === 1
    ? `${broken[0]} didn’t start`
    : `${broken.length} services didn’t start: ${broken.join(", ")}`;
