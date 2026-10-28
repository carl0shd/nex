import { cn } from "@/lib/utils";

type MeterTone = "green" | "orange" | "red" | "blue";

const FILL: Record<MeterTone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
  blue: "bg-blue",
};

export function Meter({
  value,
  tone,
  width = 56,
  showValue = true,
  className,
}: {
  value: number;
  tone?: MeterTone;
  width?: number;
  showValue?: boolean;
  className?: string;
}) {
  const resolved = tone ?? (value >= 60 ? "orange" : "green");
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-2xs text-ink-3 tabular-nums", className)}
    >
      <span className="block h-1 overflow-hidden rounded-full bg-line-chip" style={{ width }}>
        <span
          className={cn("block h-full rounded-full", FILL[resolved])}
          style={{ width: `${value}%` }}
        />
      </span>
      {showValue && `${value}%`}
    </span>
  );
}
