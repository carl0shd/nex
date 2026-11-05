import { Zap } from "lucide-react";
import { usageTone, type UsageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

const TONE: Record<UsageTone, { icon: string; track: string; fill: string }> = {
  green: { icon: "text-green", track: "bg-green-tint", fill: "bg-green" },
  orange: { icon: "text-orange", track: "bg-orange-tint", fill: "bg-orange" },
  red: { icon: "text-red", track: "bg-red-tint", fill: "bg-red" },
};

export function UsagePill({
  percent,
  cost,
  open = false,
  onClick,
}: {
  percent: number;
  cost: string;
  open?: boolean;
  onClick?: () => void;
}) {
  const tone = TONE[usageTone(percent)];
  return (
    <button
      type="button"
      aria-label="Usage today"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press-wide flex h-8 shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-3 text-2xs font-medium text-ink-2 select-none",
        open
          ? "bg-control-off shadow-[0_0_0_1px_var(--line-focus)]"
          : "bg-island shadow-island hover:bg-surface-raised hover:text-ink",
      )}
    >
      <Zap width={12} height={12} strokeWidth={2} className={tone.icon} />
      <span className={cn("block h-1 w-12 overflow-hidden rounded-full", tone.track)}>
        <span
          className={cn("block h-full rounded-full", tone.fill)}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="tabular-nums">{percent}%</span>
      <span className="h-3.5 w-px bg-line-strong" />
      <span className="tabular-nums">{cost}</span>
    </button>
  );
}
