import type { EnvSetupState, EnvSetupStep, EnvStepId } from "./types";

export const SETUP_STEPS: readonly EnvStepId[] = ["runtime", "system", "addresses", "check"];

const FAILED_TITLE: Record<EnvStepId, string> = {
  runtime: "Couldn’t install Apple container",
  system: "Couldn’t start Apple container",
  addresses: "Couldn’t register .nex addresses",
  check: "Environments didn’t pass the check",
};

const PENDING_LABEL: Record<EnvStepId, string> = {
  runtime: "Install Apple container",
  system: "Start Apple container",
  addresses: "Register .nex addresses",
  check: "Check that a task can run",
};

export function newSetup(now: number): EnvSetupState {
  return {
    phase: "running",
    current: 0,
    startedAt: now,
    steps: SETUP_STEPS.map((id) => ({ id, label: PENDING_LABEL[id], state: "pending" })),
  };
}

const patchStep = (
  setup: EnvSetupState,
  index: number,
  patch: Partial<EnvSetupStep>,
): EnvSetupStep[] => setup.steps.map((step, at) => (at === index ? { ...step, ...patch } : step));

export function startStep(setup: EnvSetupState, index: number, detail?: string): EnvSetupState {
  return {
    ...setup,
    phase: "running",
    current: index,
    error: undefined,
    finishedAt: undefined,
    steps: patchStep(setup, index, { state: "running", detail }),
  };
}

export function stepDetail(setup: EnvSetupState, index: number, detail: string): EnvSetupState {
  return { ...setup, steps: patchStep(setup, index, { detail }) };
}

export function finishStep(
  setup: EnvSetupState,
  index: number,
  label: string,
  detail?: string,
): EnvSetupState {
  return { ...setup, steps: patchStep(setup, index, { state: "done", label, detail }) };
}

export function failStep(
  setup: EnvSetupState,
  index: number,
  detail: string,
  now: number,
): EnvSetupState {
  const step = setup.steps[index];
  return {
    ...setup,
    phase: "failed",
    current: index,
    finishedAt: now,
    error: { title: FAILED_TITLE[step.id], detail },
    steps: patchStep(setup, index, { state: "failed", detail }),
  };
}

export function completeSetup(setup: EnvSetupState, now: number): EnvSetupState {
  return { ...setup, phase: "done", current: setup.steps.length, finishedAt: now };
}

export function resumeIndex(setup: EnvSetupState | null): number {
  if (!setup || setup.phase !== "failed") return 0;
  return setup.current;
}

export function downloadDetail(receivedBytes: number, totalBytes: number): string {
  const mb = (bytes: number) => Math.round(bytes / 1024 ** 2);
  return totalBytes > 0
    ? `Downloading · ${mb(receivedBytes)} of ${mb(totalBytes)} MB`
    : `Downloading · ${mb(receivedBytes)} MB`;
}

export function secondsLabel(ms: number): string {
  return `${(Math.max(ms, 100) / 1000).toFixed(1)}s`;
}
