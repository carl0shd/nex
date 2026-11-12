import { existsSync, readFileSync, rmSync, statSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import * as projectRepo from "@native/db/repositories/project.repo";
import * as settings from "@native/db/repositories/settings.repo";
import type { EnvServiceDef, Project, ProjectEnvironment } from "@native/db/types";
import { gitSilent } from "@native/git/git";
import { run, runOk } from "./cli";
import {
  APP_STOP_SECONDS,
  baseStatus,
  baseTaskSlug,
  baseVolumeArgs,
  baseVolumes,
  baseSteps,
  CLEAN_BASES_KEY,
  clonePlan,
  dataServices,
  isMigrationPath,
  MAX_FINGERPRINT_BYTES,
  MAX_FINGERPRINT_FILES,
  migrationFingerprint,
  planSteps,
  prepareExecArgs,
  seedPaths,
  setupKey,
  startDetail,
  stopArgs,
  stopOrder,
  STORE_STOP_SECONDS,
} from "./clean-base-plan";
import { inspectContainer, removeTaskResources } from "./containers";
import { splitCommand } from "./definition";
import { planRun, runServices, brokenSummary } from "./env-run";
import { BASE_LABEL, projectKey } from "./labels";
import { friendlyError, parseImageConfig, parseLines, parseVolumes } from "./parse";
import { container, ensureContentStore, systemRunning, volumeImagePath } from "./runtime";
import { exclusive, log } from "./service";
import { secondsLabel } from "./setup-steps";
import type { ContainerPlan } from "./translate";
import type {
  CleanBaseRecord,
  CleanBaseState,
  CleanBaseStep,
  CleanBaseVolume,
  EnvCheckService,
} from "./types";

const PREPARE_TIMEOUT_MS = 30 * 60_000;
const STOP_TIMEOUT_MS = (STORE_STOP_SECONDS + 30) * 1000;
const DETAIL_EVERY_MS = 250;
const NESTED_REPO_DEPTH = 2;

const live = new Map<string, CleanBaseState>();
const controllers = new Map<string, AbortController>();
const cloning = new Map<string, Set<Promise<unknown>>>();
const listeners = new Set<(state: CleanBaseState) => void>();

const readRecords = () => settings.get<Record<string, CleanBaseRecord>>(CLEAN_BASES_KEY, {});

function writeRecord(key: string, record: CleanBaseRecord | null) {
  const { [key]: _previous, ...rest } = readRecords();
  settings.set(CLEAN_BASES_KEY, record ? { ...rest, [key]: record } : rest);
}

function publish(state: CleanBaseState) {
  if (state.status === "building") live.set(state.projectId, state);
  else live.delete(state.projectId);
  for (const listener of listeners) listener(state);
}

export function onCleanBaseProgress(listener: (state: CleanBaseState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function repoFiles(root: string, depth = 0): Promise<string[]> {
  const listed = (await gitSilent(root, ["ls-files", "-co", "--exclude-standard", "-z"]))
    .split("\0")
    .filter(Boolean);
  if (depth >= NESTED_REPO_DEPTH) return listed;
  const modules = [
    ...(existsSync(join(root, ".gitmodules"))
      ? readFileSync(join(root, ".gitmodules"), "utf8").matchAll(/^\s*path\s*=\s*(.+)$/gm)
      : []),
  ].map((match) => (match[1] ?? "").trim());
  const nested = [...new Set([...modules, ...listed.filter((path) => path.endsWith("/"))])]
    .map((path) => path.replace(/\/$/, ""))
    .filter((path) => path && existsSync(join(root, path, ".git")));
  const inner = await Promise.all(
    nested.map(async (path) =>
      (await repoFiles(join(root, path), depth + 1)).map((file) => `${path}/${file}`),
    ),
  );
  return [...listed.filter((path) => !path.endsWith("/")), ...inner.flat()];
}

export async function migrationsFingerprint(
  projectPath: string,
  env: ProjectEnvironment,
): Promise<string | null> {
  if (!existsSync(join(projectPath, ".git"))) return null;
  const seeds = seedPaths(env);
  const paths = (await repoFiles(projectPath))
    .filter((path) => isMigrationPath(path, seeds))
    .slice(0, MAX_FINGERPRINT_FILES);
  let bytes = 0;
  const entries: { path: string; text: string }[] = [];
  for (const path of paths) {
    const text = await readFile(join(projectPath, path), "utf8").catch(() => null);
    if (text === null) continue;
    bytes += text.length;
    if (bytes > MAX_FINGERPRINT_BYTES) break;
    entries.push({ path, text });
  }
  return migrationFingerprint(entries);
}

const volumesPresent = (volumes: readonly CleanBaseVolume[]) =>
  volumes.length > 0 && volumes.every((volume) => existsSync(volumeImagePath(volume.name)));

const imageSize = (name: string) => {
  try {
    return statSync(volumeImagePath(name)).blocks * 512;
  } catch {
    return 0;
  }
};

async function describe(project: Project): Promise<CleanBaseState | null> {
  const env = project.environment;
  if (!env) return null;
  const building = live.get(project.id);
  if (building) return building;
  const record = readRecords()[projectKey(project.path)] ?? null;
  const ready = record?.status === "ready";
  const { status, stale } = baseStatus(record, false, {
    volumesPresent: record ? volumesPresent(record.volumes) : false,
    fingerprint: ready ? await migrationsFingerprint(project.path, env) : null,
    setupKey: setupKey(env),
  });
  const kept = status !== "none" && record;
  return {
    projectId: project.id,
    projectPath: project.path,
    status,
    ...(stale ? { stale } : {}),
    services: dataServices(env).map((service) => service.name),
    steps: kept ? record.steps : planSteps(env),
    ...(kept
      ? {
          startedAt: record.startedAt,
          finishedAt: record.finishedAt,
          builtAt: record.builtAt,
          branch: record.branch,
          commit: record.commit,
          sizeBytes: record.sizeBytes,
          error:
            record.status === "building"
              ? "Nex quit before the clean base was saved."
              : record.error,
        }
      : {}),
  };
}

export async function getCleanBase(projectId: string): Promise<CleanBaseState | null> {
  const project = projectRepo.getById(projectId);
  return project ? describe(project) : null;
}

type StepUpdate = (index: number, patch: Partial<CleanBaseStep>) => void;

async function imageConfig(service: EnvServiceDef, image: string) {
  if (service.kind === "app") return { entrypoint: [], workdir: null };
  const result = await run(container(), ["image", "inspect", image]);
  const config = parseImageConfig(result.code === 0 ? result.stdout : "");
  return {
    entrypoint: service.entrypoint ? splitCommand(service.entrypoint) : config.entrypoint,
    workdir: service.workdir ?? config.workdir,
  };
}

async function runPrepareSteps(
  env: ProjectEnvironment,
  plan: ContainerPlan,
  update: StepUpdate,
  signal: AbortSignal,
) {
  for (const [offset, prepare] of baseSteps(env).entries()) {
    if (signal.aborted) return;
    const index = offset + 1;
    update(index, { state: "running", detail: prepare.service });
    const service = env.services.find((item) => item.name === prepare.service);
    const spec = plan.runs.find((item) => item.service === prepare.service);
    if (!service || !spec) throw new Error(`${prepare.service} isn’t a service.`);
    const started = Date.now();
    let lastEmit = 0;
    const result = await run(
      container(),
      prepareExecArgs(spec.name, await imageConfig(service, spec.image), prepare.command),
      {
        log,
        signal,
        timeoutMs: PREPARE_TIMEOUT_MS,
        onLine: (line) => {
          const now = Date.now();
          if (now - lastEmit < DETAIL_EVERY_MS) return;
          lastEmit = now;
          update(index, { detail: `${prepare.service} · ${line.trim().slice(0, 90)}` });
        },
      },
    );
    if (signal.aborted) return;
    if (result.code !== 0) {
      const last = parseLines(`${result.stdout}\n${result.stderr}`).at(-1);
      throw new Error(last ? friendlyError(last) : `${prepare.command} failed.`);
    }
    update(index, {
      state: "done",
      detail: `${prepare.service} · ${secondsLabel(Date.now() - started)}`,
    });
  }
}

async function stopCleanly(env: ProjectEnvironment, plan: ContainerPlan) {
  const { apps, stores } = stopOrder(env);
  const byName = new Map(env.services.map((service) => [service.name, service]));
  const containerOf = (name: string) => plan.runs.find((spec) => spec.service === name)?.name;
  await Promise.all(
    apps.map(async (name) => {
      const id = containerOf(name);
      const service = byName.get(name);
      if (id && service) await run(container(), stopArgs(service, id, APP_STOP_SECONDS), { log });
    }),
  );
  for (const name of stores) {
    const id = containerOf(name);
    const service = byName.get(name);
    if (!id || !service) continue;
    await runOk(container(), stopArgs(service, id, STORE_STOP_SECONDS), {
      log,
      timeoutMs: STOP_TIMEOUT_MS,
    });
    if ((await inspectContainer(id))?.state === "running") {
      throw new Error(`${name} didn’t stop cleanly.`);
    }
  }
}

async function removeBaseVolumes(volumes: readonly CleanBaseVolume[]) {
  for (const volume of volumes) await run(container(), ["volume", "rm", volume.name], { log });
}

async function checkoutRef(projectPath: string) {
  const [branch, commit] = await Promise.all([
    gitSilent(projectPath, ["rev-parse", "--abbrev-ref", "HEAD"]),
    gitSilent(projectPath, ["rev-parse", "HEAD"]),
  ]);
  return { branch: branch || undefined, commit: commit || undefined };
}

async function republish(project: Project) {
  live.delete(project.id);
  const state = await describe(project);
  if (state) publish(state);
}

async function runBuild(project: Project, env: ProjectEnvironment, signal: AbortSignal) {
  if (signal.aborted) return republish(project);
  const key = projectKey(project.path);
  const previous = readRecords()[key] ?? null;
  let replaced = false;
  const taskSlug = baseTaskSlug(project.name);
  const volumes = baseVolumes(env, key);
  const startedAt = Date.now();
  let state: CleanBaseState = {
    projectId: project.id,
    projectPath: project.path,
    status: "building",
    services: volumes.map((volume) => volume.service),
    steps: planSteps(env),
    startedAt,
  };
  let running = 0;
  let built = false;
  const update: StepUpdate = (index, patch) => {
    if (patch.state === "running") running = index;
    state = {
      ...state,
      steps: state.steps.map((step, at) => (at === index ? { ...step, ...patch } : step)),
    };
    publish(state);
  };
  const last = state.steps.length - 1;
  publish(state);
  writeRecord(key, { status: "building", volumes, steps: state.steps, startedAt });
  try {
    await Promise.all(cloning.get(key) ?? []);
    if (volumes.length === 0) throw new Error("No service keeps data, so there’s nothing to save.");
    if (!(await systemRunning())) throw new Error("Apple container isn’t running.");
    log(`Building the clean base of ${project.name}`);
    update(0, { state: "running", detail: "Getting ready" });
    const { builds, plan } = await planRun(
      { environment: env, projectPath: project.path, projectName: project.name },
      {
        taskSlug,
        labels: { [BASE_LABEL]: key },
        dataVolumes: Object.fromEntries(volumes.map((volume) => [volume.service, volume.name])),
        mountProject: true,
      },
    );
    built = builds.length > 0;
    await removeTaskResources(taskSlug, log);
    ensureContentStore();
    const services = new Map<string, EnvCheckService>(
      env.services.map((service) => [service.name, { name: service.name, state: "waiting" }]),
    );
    const { broken } = await runServices({
      environment: env,
      builds,
      plan,
      signal,
      strictPorts: new Set([
        ...env.services.filter((service) => service.data).map((service) => service.name),
        ...baseSteps(env).map((step) => step.service),
      ]),
      beforeStart: async () => {
        replaced = true;
        await removeBaseVolumes(volumes);
        for (const volume of volumes)
          await runOk(container(), baseVolumeArgs(key, volume), { log });
      },
      report: (names, patch) => {
        for (const name of names) {
          const service = services.get(name);
          if (service) services.set(name, { ...service, ...patch });
        }
        update(0, { detail: startDetail([...services.values()]) });
      },
    });
    if (signal.aborted) return;
    if (broken.length > 0) {
      const detail = services.get(broken[0] as string)?.detail;
      throw new Error(broken.length === 1 && detail ? detail : brokenSummary(broken));
    }
    update(0, {
      state: "done",
      detail: `${services.size} ready in ${secondsLabel(Date.now() - startedAt)}`,
    });
    await runPrepareSteps(env, plan, update, signal);
    if (signal.aborted) return;
    update(last - 1, { state: "running", detail: state.services.join(", ") });
    await stopCleanly(env, plan);
    update(last - 1, { state: "done" });
    update(last, { state: "running", detail: undefined });
    await removeTaskResources(taskSlug, log);
    const sizeBytes = volumes.reduce((sum, volume) => sum + imageSize(volume.name), 0);
    const ref = await checkoutRef(project.path);
    update(last, { state: "done" });
    const finishedAt = Date.now();
    const record: CleanBaseRecord = {
      status: "ready",
      volumes,
      steps: state.steps,
      startedAt,
      finishedAt,
      builtAt: finishedAt,
      ...ref,
      sizeBytes,
      fingerprint: await migrationsFingerprint(project.path, env),
      setupKey: setupKey(env),
    };
    writeRecord(key, record);
    log(`Clean base of ${project.name} saved · ${Math.round(sizeBytes / 1e6)} MB`);
  } catch (error) {
    if (signal.aborted) return;
    const message = friendlyError(error instanceof Error ? error.message : String(error));
    log(`Clean base failed: ${message}`);
    update(running, { state: "failed", detail: message });
    await removeTaskResources(taskSlug, log).catch(() => {});
    await removeBaseVolumes(volumes).catch(() => {});
    writeRecord(key, {
      status: "failed",
      volumes,
      steps: state.steps,
      startedAt,
      finishedAt: Date.now(),
      error: message,
    });
  } finally {
    if (signal.aborted) {
      await removeTaskResources(taskSlug, log).catch(() => {});
      if (replaced) await removeBaseVolumes(volumes).catch(() => {});
      writeRecord(key, replaced ? null : previous);
    }
    if (built) await run(container(), ["builder", "stop"], { log }).catch(() => {});
    await republish(project);
  }
}

export function buildCleanBase(projectId: string, environment: ProjectEnvironment): CleanBaseState {
  const project = projectRepo.getById(projectId);
  if (!project) throw new Error("That project isn’t in Nex anymore.");
  const existing = live.get(projectId);
  if (existing) return existing;
  const controller = new AbortController();
  controllers.set(projectId, controller);
  const pending: CleanBaseState = {
    projectId,
    projectPath: project.path,
    status: "building",
    services: dataServices(environment).map((service) => service.name),
    steps: planSteps(environment),
    startedAt: Date.now(),
  };
  publish(pending);
  void exclusive(() =>
    runBuild({ ...project, environment }, environment, controller.signal),
  ).finally(() => controllers.delete(projectId));
  return pending;
}

export async function stopCleanBase(projectId: string): Promise<void> {
  const controller = controllers.get(projectId);
  const project = projectRepo.getById(projectId);
  if (!controller || !project) return;
  controller.abort();
  await removeTaskResources(baseTaskSlug(project.name), log).catch(() => {});
}

async function volumeSources(names: readonly string[]) {
  const result = await run(container(), ["volume", "inspect", ...names]);
  return new Map(
    parseVolumes(result.code === 0 ? result.stdout : "").map((volume) => [volume.name, volume]),
  );
}

async function cloneVolumes(key: string, volumes: readonly CleanBaseVolume[], taskSlug: string) {
  const sources = await volumeSources(volumes.map((volume) => volume.name));
  const sizes: Record<string, number> = {};
  for (const volume of volumes) {
    const found = sources.get(volume.name);
    if (!found) throw new Error(`The clean base of ${volume.service} is missing.`);
    if (found.sizeInBytes) sizes[volume.name] = found.sizeInBytes;
  }
  const plans = clonePlan(volumes, key, taskSlug, sizes);
  for (const plan of plans) {
    await run(container(), ["volume", "rm", plan.target], { log });
    await runOk(container(), plan.args, { log });
    const source = sources.get(plan.source)?.source ?? volumeImagePath(plan.source);
    const target = volumeImagePath(plan.target);
    if (!existsSync(target)) throw new Error(`${plan.target} wasn’t created.`);
    rmSync(target);
    await runOk("cp", ["-c", source, target], { log });
  }
  return Object.fromEntries(plans.map((plan) => [plan.service, plan.target]));
}

export async function cloneBaseForTask(
  projectPath: string,
  taskSlug: string,
): Promise<Record<string, string>> {
  const key = projectKey(projectPath);
  const record = readRecords()[key];
  const busy = [...live.values()].some((state) => state.projectPath === projectPath);
  if (busy || record?.status !== "ready" || !volumesPresent(record.volumes)) {
    throw new Error("The clean base isn’t ready.");
  }
  const started = Date.now();
  const work = cloneVolumes(key, record.volumes, taskSlug);
  const pending = cloning.get(key) ?? new Set<Promise<unknown>>();
  cloning.set(key, pending.add(work));
  try {
    const cloned = await work;
    log(`Cloned the clean base into ${taskSlug} in ${Date.now() - started} ms`);
    return cloned;
  } finally {
    pending.delete(work);
  }
}

export function forgetCleanBase(projectPath: string): void {
  writeRecord(projectKey(projectPath), null);
}

export async function refreshCleanBases(): Promise<void> {
  const records = readRecords();
  for (const project of projectRepo.getAll()) {
    const record = records[projectKey(project.path)];
    if (!record) continue;
    if (record.status === "building" && !live.has(project.id) && (await systemRunning())) {
      await removeTaskResources(baseTaskSlug(project.name), log).catch(() => {});
      await removeBaseVolumes(record.volumes).catch(() => {});
    }
    const state = await describe(project).catch(() => null);
    if (state) publish(state);
  }
}
