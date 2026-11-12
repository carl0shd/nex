import type { ReactNode } from "react";
import { Spinner } from "@/components/atoms/spinner";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

const TITLE_TONE: Partial<Record<DotTone, string>> = {
  orange: "text-orange",
  red: "text-red",
};

export function StatusCard({
  tone,
  busy = false,
  title,
  hint,
  action,
  className,
}: {
  tone: DotTone;
  busy?: boolean;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-field bg-hover px-3 py-2.5",
        className,
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {busy ? <Spinner className="size-3" /> : <StatusDot tone={tone} size={7} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          title={title}
          className={cn("truncate text-xs font-medium text-ink", TITLE_TONE[tone])}
        >
          {title}
        </span>
        {hint && (
          <span title={hint} className="truncate text-2xs text-ink-3">
            {hint}
          </span>
        )}
      </span>
      {action && <span className="flex shrink-0 items-center">{action}</span>}
    </div>
  );
}
