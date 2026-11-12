import { run } from "./cli";
import { removeTaskResources } from "./containers";
import { slugName } from "./definition";
import { brokenSummary, planRun, runServices } from "./env-run";
import { friendlyError } from "./parse";
import { container, ensureContentStore, systemRunning } from "./runtime";
import { exclusive, log } from "./service";
import type { EnvCheckInput, EnvCheckService, EnvCheckState } from "./types";

const checks = new Map<string, EnvCheckState>();
const listeners = new Set<(state: EnvCheckState) => void>();

export const checkTaskSlug = (projectName: string) => `check-${slugName(projectName) || "project"}`;

function publish(state: EnvCheckState) {
  checks.set(state.projectPath, state);
  for (const listener of listeners) listener(state);
}

export function onCheckProgress(listener: (state: EnvCheckState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateService(projectPath: string, name: string, patch: Partial<EnvCheckService>) {
  const state = checks.get(projectPath);
  if (!state) return;
  publish({
    ...state,
    services: state.services.map((service) =>
      service.name === name ? { ...service, ...patch } : service,
    ),
  });
}

function finish(projectPath: string, error?: string) {
  const state = checks.get(projectPath);
  if (!state) return;
  publish({
    ...state,
    phase: error ? "failed" : "done",
    error,
    finishedAt: Date.now(),
    services: state.services.map((service) =>
      error &&
      (service.state === "waiting" ||
        service.state === "building" ||
        service.state === "pulling" ||
        service.state === "starting")
        ? { ...service, state: "skipped", detail: undefined }
        : service,
    ),
  });
}

const controllers = new Map<string, { controller: AbortController; taskSlug: string }>();

async function runCheck(input: EnvCheckInput, signal: AbortSignal): Promise<void> {
  const { projectPath, projectName, environment } = input;
  const taskSlug = checkTaskSlug(projectName);
  try {
    if (!(await systemRunning())) throw new Error("Apple container isn’t running.");
    const { builds, plan } = await planRun(input, { taskSlug, check: true });
    log(`Checking the environment of ${projectName}`);
    await removeTaskResources(taskSlug, log);
    ensureContentStore();
    const { broken } = await runServices({
      environment,
      builds,
      plan,
      signal,
      report: (names, patch) => {
        for (const name of names) updateService(projectPath, name, patch);
      },
    });
    if (signal.aborted) {
      finish(projectPath, "Stopped");
      return;
    }
    finish(projectPath, broken.length === 0 ? undefined : brokenSummary(broken));
  } catch (error) {
    const message = friendlyError(error instanceof Error ? error.message : String(error));
    log(`Check failed: ${message}`);
    finish(projectPath, message);
  } finally {
    await removeTaskResources(taskSlug, log).catch(() => {});
    await run(container(), ["builder", "stop"], { log }).catch(() => {});
  }
}

export function checkProjectEnvironment(input: EnvCheckInput): EnvCheckState {
  const existing = checks.get(input.projectPath);
  if (existing?.phase === "running") return existing;
  publish({
    projectPath: input.projectPath,
    phase: "running",
    startedAt: Date.now(),
    services: input.environment.services.map((service) => ({
      name: service.name,
      state: "waiting",
    })),
  });
  const controller = new AbortController();
  controllers.set(input.projectPath, { controller, taskSlug: checkTaskSlug(input.projectName) });
  void exclusive(() => runCheck(input, controller.signal)).finally(() =>
    controllers.delete(input.projectPath),
  );
  return checks.get(input.projectPath) as EnvCheckState;
}

export const environmentCheck = (projectPath: string) => checks.get(projectPath) ?? null;

export async function stopProjectCheck(projectPath: string): Promise<void> {
  const running = controllers.get(projectPath);
  if (!running) return;
  running.controller.abort();
  await removeTaskResources(running.taskSlug, log).catch(() => {});
}
