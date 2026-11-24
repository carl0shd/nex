import { AppleMark } from "@/components/atoms/brand-icons";
import { Button } from "@/components/atoms/button";
import { ValuePill } from "@/components/atoms/value-pill";
import { usageTone, type UsageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

export type RuntimeCardState = "running" | "stopped" | "restarting";

export type AddressesState = "registered" | "missing" | "repairing";

export interface RuntimeStatus {
  state: RuntimeCardState;
  version: string | null;
  addresses: AddressesState;
  containers: number;
  usedGb: number;
  budgetGb: number;
  blocked?: string;
}

const FILL: Record<UsageTone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
};

function health(runtime: RuntimeStatus): { label: string; tone: "green" | "orange" | "neutral" } {
  if (runtime.state === "restarting") return { label: "Restarting", tone: "neutral" };
  if (runtime.state === "stopped") return { label: "Stopped", tone: "neutral" };
  if (runtime.addresses !== "registered") return { label: ".nex addresses off", tone: "orange" };
  if (runtime.blocked) return { label: "Port in use", tone: "orange" };
  return { label: "Healthy", tone: "green" };
}

function summary(runtime: RuntimeStatus): string {
  const parts = [runtime.version ? `Version ${runtime.version}` : "Apple container"];
  if (runtime.state !== "running") return [...parts, `${runtime.budgetGb} GB budget`].join(" · ");
  if (runtime.containers > 0) {
    parts.push(`${runtime.containers} ${runtime.containers === 1 ? "container" : "containers"}`);
  }
  parts.push(`${runtime.usedGb} of ${runtime.budgetGb} GB in use`);
  return parts.join(" · ");
}

export function RuntimeCard({
  runtime,
  onRestart,
  onRepair,
}: {
  runtime: RuntimeStatus;
  onRestart?: () => void;
  onRepair?: () => void;
}) {
  const running = runtime.state === "running";
  const registered = runtime.addresses === "registered";
  const status = health(runtime);
  const percent = runtime.budgetGb > 0 ? Math.round((runtime.usedGb / runtime.budgetGb) * 100) : 0;
  return (
    <div className="flex items-center gap-3 rounded-panel bg-surface px-4 py-3.5 shadow-card">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-control",
          running ? "bg-green-tint text-green" : "bg-hover text-ink-3",
        )}
      >
        <AppleMark width={15} height={15} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          Apple container
          <ValuePill tone={status.tone}>{status.label}</ValuePill>
        </span>
        <span className="text-xs text-ink-3 tabular-nums">{summary(runtime)}</span>
        {runtime.blocked && running && (
          <span title={runtime.blocked} className="truncate text-xs text-orange">
            {runtime.blocked}
          </span>
        )}
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-hover">
          <span
            className={cn(
              "block h-full rounded-full transition-[width] duration-200 ease-out",
              FILL[usageTone(percent)],
            )}
            style={{ width: `${running ? Math.min(percent, 100) : 0}%` }}
          />
        </span>
      </span>
      {!registered && (
        <Button
          variant="quiet"
          size="sm"
          disabled={runtime.addresses === "repairing"}
          onClick={onRepair}
        >
          {runtime.addresses === "repairing" ? "Repairing…" : "Repair"}
        </Button>
      )}
      <Button size="sm" disabled={runtime.state === "restarting"} onClick={onRestart}>
        {runtime.state === "restarting" ? "Restarting…" : running ? "Restart" : "Start"}
      </Button>
    </div>
  );
}
