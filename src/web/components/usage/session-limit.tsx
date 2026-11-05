import { TrendingUp } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { usageTone, type UsageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

export interface SessionWindow {
  window?: "session" | "weekly";
  unavailable?: string;
  percent: number;
  projected: number;
  resetsIn: string;
  startedAt: string;
  resetsAt: string;
  forecast: string;
}

const FILL: Record<UsageTone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
};

export function SessionLimit({
  session,
  switchTo,
  onSwitch,
}: {
  session: SessionWindow;
  switchTo?: string;
  onSwitch?: () => void;
}) {
  const tone = usageTone(session.percent);
  const nearLimit = tone === "red";

  return (
    <section aria-label="Current session" className="px-[18px] pt-[18px] pb-4">
      <div className="flex items-end gap-2.5">
        <span className="text-3xl leading-8 font-semibold tracking-[-0.03em] text-ink tabular-nums italic">
          {session.unavailable ? (
            "—"
          ) : (
            <>
              {session.percent}
              <span className="text-lg font-medium text-ink-3">%</span>
            </>
          )}
        </span>
        <span className="flex flex-col gap-px pb-[3px]">
          <span className="text-sm leading-4 font-medium text-ink">
            {session.window === "weekly" ? "Weekly limit" : "Session limit"}
          </span>
          <span className="text-xs leading-[15px] text-ink-3">
            {session.unavailable ??
              `${session.window === "weekly" ? "7-day window" : "5-hour window"} · resets in ${session.resetsIn}`}
          </span>
        </span>
      </div>

      <div className="relative mt-3.5 h-2 rounded-full bg-hover">
        <span
          className={cn(
            "bar-grow-late absolute inset-y-0 left-0 rounded-full opacity-[0.22]",
            FILL[tone],
          )}
          style={{ width: `${session.projected}%` }}
        />
        <span
          className={cn("bar-grow absolute inset-y-0 left-0 rounded-full", FILL[tone])}
          style={{ width: `${session.percent}%` }}
        />
        <span
          className={cn(
            "dot-in-late absolute -inset-y-[3px] w-0.5 rounded-[2px]",
            nearLimit ? "bg-red" : "bg-ink-4",
          )}
          style={{ left: `calc(${session.projected}% - 1px)` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-3xs text-ink-4">
        <span>Started {session.startedAt}</span>
        <span>Resets {session.resetsAt}</span>
      </div>

      <div
        className={cn(
          "mt-3 flex min-h-[34px] items-center gap-2 rounded-field py-[5px] pr-[5px] pl-2.5 text-xs",
          nearLimit ? "bg-red-tint text-red" : "bg-hover text-ink-3",
        )}
      >
        <TrendingUp width={13} height={13} strokeWidth={2} className="shrink-0" />
        <span className="flex-1">{session.forecast}</span>
        {nearLimit && switchTo && (
          <Button variant="inverse" size="xs" onClick={onSwitch}>
            Use {switchTo}
          </Button>
        )}
      </div>
    </section>
  );
}
