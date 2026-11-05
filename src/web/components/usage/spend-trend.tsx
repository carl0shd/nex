import { useRef, useState, type MouseEvent } from "react";
import { compactTokens, comparedToAverage, formatUsd, sparkline } from "@/lib/usage";

export interface SpendDay {
  label: string;
  costUsd: number;
  tokens: number;
}

export interface DailySpend {
  today: string;
  inNex: string;
  outside: string;
  comparedToAverage: string;
  lastDays: readonly number[];
  days?: readonly SpendDay[];
}

export function SpendTrend({ spend }: { spend: DailySpend }) {
  const line = sparkline(spend.lastDays);
  const [hovered, setHovered] = useState<number | null>(null);
  const last = spend.lastDays.length - 1;
  const index = hovered ?? last;
  const day = hovered === null ? undefined : spend.days?.[hovered];
  const left = last > 0 ? (index / last) * 100 : 100;

  const chartRef = useRef<HTMLDivElement>(null);
  const track = (event: MouseEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    if (!chart || !spend.days?.length || last <= 0) return;
    const rect = chart.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHovered(Math.round(ratio * last));
  };

  return (
    <div onMouseMove={track} onMouseLeave={() => setHovered(null)}>
      <div className="flex items-baseline px-2.5">
        <span className="text-xs text-ink-3">{day ? day.label : "Spent today"}</span>
        <span className="ml-auto text-base font-semibold text-ink tabular-nums">
          {day ? formatUsd(day.costUsd) : spend.today}
        </span>
      </div>

      <div
        ref={chartRef}
        aria-label={`Last ${spend.lastDays.length} days`}
        className="relative mx-2.5 mt-2.5 h-7"
      >
        <span
          className="fade-in-late absolute inset-x-0 border-t border-dashed border-line-strong"
          style={{ top: `${line.averageTop}%` }}
        />
        <svg
          aria-hidden
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="draw-x absolute inset-0 size-full overflow-visible text-ink-3"
        >
          <polyline
            points={line.points}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          aria-hidden
          className="absolute -inset-y-1 w-px bg-line-strong transition-[left,opacity] duration-150 ease-out-strong"
          style={{ left: `${left}%`, opacity: hovered === null ? 0 : 1 }}
        />
        <span
          className="dot-in-late absolute -mt-1 -ml-1 size-2 rounded-full bg-accent shadow-[0_0_0_3px_var(--glass)] transition-[left,top] duration-150 ease-out-strong"
          style={{ left: `${left}%`, top: `${line.tops[index] ?? line.lastTop}%` }}
        />
      </div>

      <div className="mt-2 flex px-2.5 text-2xs text-ink-4 tabular-nums">
        {day ? (
          <span>{compactTokens(day.tokens)} tokens</span>
        ) : (
          <span>
            <span className="text-ink-2">{spend.inNex}</span> in Nex · {spend.outside} outside
          </span>
        )}
        <span className="ml-auto">
          {hovered === null ? spend.comparedToAverage : comparedToAverage(spend.lastDays, hovered)}
        </span>
      </div>
    </div>
  );
}
