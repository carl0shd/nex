import type {
  EnvironmentStatus,
  EnvSetupState,
  EnvSetupStep,
  EnvStepId,
} from "@native/environments/types";
import type { EnvironmentsUsage } from "@/components/environment/machine-popover";
import type { CheckItem } from "@/components/onboarding/check-list";
import type { RuntimeStatus } from "@/components/settings/runtime-card";
import type { SettingsEnvironments } from "@/components/settings/settings-page";

export type EnvPhase = "offer" | "running" | "ready" | "unsupported" | "failed";

export interface EnvCopy {
  title: string;
  description: string;
}

const RUNTIME_SIZE = "about 160 MB";

const STEP_SECONDS: Record<EnvStepId, number> = {
  runtime: 50,
  system: 15,
  addresses: 10,
  check: 10,
};

export type EnvAction = "restarting" | "repairing" | "removing";

export function envPhase(status: EnvironmentStatus, setup: EnvSetupState | null): EnvPhase {
  if (!status.supported) return "unsupported";
  if (setup?.phase === "running") return "running";
  if (setup?.phase === "failed") return "failed";
  if (setup?.phase === "done" || status.enabled) return "ready";
  return "offer";
}

export const checkItems = (steps: readonly EnvSetupStep[]): CheckItem[] =>
  steps.map(({ label, detail, state }) => ({ label, detail, state }));

export function timeLeftLabel(setup: EnvSetupState): string | undefined {
  const seconds = setup.steps
    .filter((step) => step.state !== "done")
    .reduce((sum, step) => sum + STEP_SECONDS[step.id], 0);
  if (seconds <= 0) return undefined;
  if (seconds < 60) return "Less than a minute left";
  return `About ${Math.round(seconds / 60)} min left`;
}

export function formatTook(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest}s` : `${minutes} min`;
}

export function tookLabel(setup: EnvSetupState): string | undefined {
  return setup.finishedAt ? formatTook(setup.finishedAt - setup.startedAt) : undefined;
}

export function unsupportedCopy(status: EnvironmentStatus): EnvCopy {
  return status.reasonUnsupported === "arch"
    ? {
        title: "Environments need Apple silicon",
        description: "Apple container only runs on Macs with Apple silicon.",
      }
    : {
        title: "Environments need macOS 26",
        description: `This Mac runs macOS ${status.macos}. Apple container only works on macOS 26 and later.`,
      };
}

export function runtimeDetail(status: EnvironmentStatus): string {
  const { runtime } = status;
  if (runtime.compatible) return `Already on this Mac · ${runtime.version}`;
  if (runtime.installed) return `Updates the version on this Mac · ${RUNTIME_SIZE}`;
  return `Container runtime made by Apple · ${RUNTIME_SIZE}`;
}

export const memoryOptions = (choices: readonly number[]) =>
  choices.map((gb) => ({ value: String(gb), label: `${gb} GB` }));

export function shownMemory(choices: readonly number[], preferred: string): string {
  if (choices.includes(Number(preferred))) return preferred;
  return String(choices.includes(8) ? 8 : (choices.at(-1) ?? 4));
}

export const memoryBudget = (status: EnvironmentStatus, preferred: string) =>
  Number(shownMemory(status.memoryChoices, preferred));

export function environmentsUsage(status: EnvironmentStatus, budgetGb: number): EnvironmentsUsage {
  return {
    usedGb: status.usage.usedGb,
    totalGb: budgetGb,
    containers: status.usage.running,
    idle: 0,
    environments: [],
  };
}

export function runtimeCard(
  status: EnvironmentStatus,
  action: EnvAction | null,
  budgetGb: number,
): RuntimeStatus {
  return {
    state: action === "restarting" ? "restarting" : status.runtime.running ? "running" : "stopped",
    version: status.runtime.version,
    addresses:
      action === "repairing" ? "repairing" : status.dns.registered ? "registered" : "missing",
    containers: status.usage.running,
    usedGb: status.usage.usedGb,
    budgetGb,
  };
}

export function settingsEnvironments(
  status: EnvironmentStatus,
  setup: EnvSetupState | null,
  action: EnvAction | null,
  preferredMemory: string,
): SettingsEnvironments {
  const progress = setup && !status.enabled ? setup : null;
  const memory = shownMemory(status.memoryChoices, preferredMemory);
  return {
    unsupported: status.supported ? null : unsupportedCopy(status),
    enabled: status.enabled,
    runtime: runtimeCard(status, action, Number(memory)),
    containers: status.usage.containers,
    memory,
    memoryOptions: memoryOptions(status.memoryChoices),
    setup: progress && {
      items: checkItems(progress.steps),
      current: progress.current,
      phase: progress.phase === "done" ? "ready" : progress.phase,
      leftLabel: timeLeftLabel(progress),
      took: tookLabel(progress),
      error: progress.error && `${progress.error.title}. ${progress.error.detail}`,
    },
    removesRuntime: status.runtime.installedByNex,
    removing: action === "removing",
  };
}
