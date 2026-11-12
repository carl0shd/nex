import type { CleanBaseState, CleanBaseStep } from "@native/environments/types";
import type { CheckItem } from "@/components/onboarding/check-list";
import { relativeTime } from "@/lib/relative-time";

export type DataCopyAction = "build" | "rebuild" | "stop" | "details";

export interface DataCopyView {
  title: string;
  hint: string;
  tone: "neutral" | "orange" | "red";
  busy: boolean;
  action: DataCopyAction | null;
  actionLabel: string;
}

const ACTION_LABEL: Record<DataCopyAction, string> = {
  build: "Build a copy",
  rebuild: "Rebuild",
  stop: "Stop",
  details: "Details",
};

export function sizeLabel(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}

export const shortCommit = (commit: string) => commit.slice(0, 7);

function builtLine(state: CleanBaseState, now: number): string {
  const when = state.builtAt ? `Built ${relativeTime(state.builtAt, now)}` : "Built";
  const from = state.branch
    ? ` from ${state.branch}${state.commit ? ` @ ${shortCommit(state.commit)}` : ""}`
    : "";
  return [`${when}${from}`, state.sizeBytes ? sizeLabel(state.sizeBytes) : null]
    .filter(Boolean)
    .join(" · ");
}

function runningLine(steps: readonly CleanBaseStep[]): string {
  const step = steps.find((item) => item.state === "running");
  if (!step) return "Waiting for the other environment work to finish";
  return step.detail && !step.code ? `${step.label} · ${step.detail}` : step.label;
}

function copySource(state: CleanBaseState): string {
  if (!state.branch) return "Copy of the main checkout";
  return `Copy of ${state.branch}${state.commit ? ` · ${shortCommit(state.commit)}` : ""}`;
}

function copyFacts(state: CleanBaseState, now: number): string {
  return [
    state.builtAt ? relativeTime(state.builtAt, now) : null,
    state.sizeBytes ? sizeLabel(state.sizeBytes) : null,
    "every task starts here",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function dataCopyView(state: CleanBaseState | null, now: number): DataCopyView {
  const view = (
    title: string,
    hint: string,
    action: DataCopyAction | null,
    tone: DataCopyView["tone"] = "neutral",
  ): DataCopyView => ({
    title,
    hint,
    tone,
    busy: action === "stop",
    action,
    actionLabel: action ? ACTION_LABEL[action] : "",
  });
  if (!state) return view("No copy yet", "Build one once the project is added", null);
  if (state.status === "building") {
    const done = state.steps.filter((step) => step.state === "done").length;
    return view(
      `Copying the data… ${done} of ${state.steps.length}`,
      runningLine(state.steps),
      "stop",
    );
  }
  if (state.services.length === 0) return view("Nothing to copy", "No service keeps data", null);
  if (state.status === "ready") return view(copySource(state), copyFacts(state, now), "rebuild");
  if (state.status === "stale") {
    const reason =
      state.stale === "setup"
        ? "The data services or seed steps changed"
        : `${state.branch ?? "The main checkout"} has new migrations`;
    return view(
      "The copy is out of date",
      `${reason} · ${builtLine(state, now)}`,
      "rebuild",
      "orange",
    );
  }
  if (state.status === "failed")
    return view("The copy failed", state.error ?? "The last build didn’t finish", "details", "red");
  return view("No copy yet", `New tasks start with empty ${state.services.join(", ")}`, "build");
}

export function failureSteps(state: CleanBaseState): CheckItem[] {
  return state.steps.map((step) => ({
    label: step.label,
    state: step.state,
    ...(step.state === "failed" ? {} : step.detail ? { detail: step.detail } : {}),
  }));
}
