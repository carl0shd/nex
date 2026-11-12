import { DitherProgress } from "@/components/atoms/dither-progress";
import { CheckList, type CheckItem } from "@/components/onboarding/check-list";
import { cn } from "@/lib/utils";

export type SetupProgressPhase = "running" | "ready" | "failed";

export function SetupProgress({
  items,
  current,
  phase,
  took,
  leftLabel,
  className,
}: {
  items: readonly CheckItem[];
  current: number;
  phase: SetupProgressPhase;
  took?: string;
  leftLabel?: string;
  className?: string;
}) {
  const total = items.length;
  const done = phase === "ready" ? total : Math.min(current, total);
  return (
    <div
      className={cn("overflow-hidden rounded-panel bg-surface px-4 py-3.5 shadow-card", className)}
    >
      <DitherProgress value={total ? (done / total) * 100 : 0} />
      <div className="mt-2 flex text-2xs text-ink-4">
        <span>
          {phase === "ready"
            ? `${total} of ${total}`
            : phase === "failed"
              ? `Stopped at step ${current + 1} of ${total}`
              : `Step ${current + 1} of ${total}`}
        </span>
        <span className="ml-auto">
          {phase === "ready" && took && `Took ${took}`}
          {phase === "running" && leftLabel}
        </span>
      </div>
      <CheckList items={items} className="mt-2" />
    </div>
  );
}
