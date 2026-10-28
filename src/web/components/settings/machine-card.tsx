import { BoxIso } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { ValuePill } from "@/components/atoms/value-pill";
import { usageTone, type UsageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

export interface MachineStatus {
  runtime: string;
  environments: number;
  usedGb: number;
  totalGb: number;
  healthy: boolean;
}

const FILL: Record<UsageTone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
};

export function MachineCard({
  machine,
  onRestart,
}: {
  machine: MachineStatus;
  onRestart?: () => void;
}) {
  const percent = Math.round((machine.usedGb / machine.totalGb) * 100);
  return (
    <div className="flex items-center gap-3 rounded-panel bg-surface px-4 py-3.5 shadow-card">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-green-tint text-green">
        <BoxIso width={15} height={15} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          Linux machine running
          <ValuePill tone={machine.healthy ? "green" : "orange"}>
            {machine.healthy ? "Healthy" : "Needs attention"}
          </ValuePill>
        </span>
        <span className="text-xs text-ink-3 tabular-nums">
          {machine.runtime} · {machine.environments} environments · {machine.usedGb} of{" "}
          {machine.totalGb} GB in use
        </span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-hover">
          <span
            className={cn("block h-full rounded-full", FILL[usageTone(percent)])}
            style={{ width: `${percent}%` }}
          />
        </span>
      </span>
      <Button size="sm" onClick={onRestart}>
        Restart machine
      </Button>
    </div>
  );
}
