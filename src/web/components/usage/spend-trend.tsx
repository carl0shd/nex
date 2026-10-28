import { sparkline } from "@/lib/usage";

export interface DailySpend {
  today: string;
  inNex: string;
  outside: string;
  comparedToAverage: string;
  lastDays: readonly number[];
}

export function SpendTrend({ spend }: { spend: DailySpend }) {
  const line = sparkline(spend.lastDays);
  return (
    <div>
      <div className="flex items-baseline px-2.5">
        <span className="text-xs text-ink-3">Spent today</span>
        <span className="ml-auto text-base font-semibold text-ink tabular-nums">{spend.today}</span>
      </div>

      <div aria-label={`Last ${spend.lastDays.length} days`} className="relative mx-2.5 mt-2.5 h-7">
        <span
          className="absolute inset-x-0 border-t border-dashed border-line-strong"
          style={{ top: `${line.averageTop}%` }}
        />
        <svg
          aria-hidden
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="fade-in-late absolute inset-0 size-full overflow-visible text-ink-3"
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
          className="absolute -right-1 -mt-1 size-2 rounded-full bg-accent shadow-[0_0_0_3px_var(--glass)]"
          style={{ top: `${line.lastTop}%` }}
        />
      </div>

      <div className="mt-2 flex px-2.5 text-2xs text-ink-4 tabular-nums">
        <span>
          <span className="text-ink-2">{spend.inNex}</span> in Nex · {spend.outside} outside
        </span>
        <span className="ml-auto">{spend.comparedToAverage}</span>
      </div>
    </div>
  );
}
