import { cn } from "@/lib/utils";

const RADIUS = 6.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ContextRing({ percent }: { percent: number }) {
  const nearFull = percent >= 85;
  const filled = (percent / 100) * CIRCUMFERENCE;
  return (
    <button
      type="button"
      aria-label={`Context ${percent}% used`}
      className={cn(
        "interactive press flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full px-2 text-2xs font-medium tabular-nums select-none hover:bg-hover",
        nearFull ? "text-orange" : "text-ink-3",
      )}
    >
      <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
        <circle cx={8} cy={8} r={RADIUS} fill="none" stroke="var(--line-focus)" strokeWidth={2} />
        <circle
          cx={8}
          cy={8}
          r={RADIUS}
          fill="none"
          stroke={nearFull ? "var(--orange)" : "var(--accent-ink)"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          transform="rotate(-90 8 8)"
        />
      </svg>
      {percent}%
    </button>
  );
}
