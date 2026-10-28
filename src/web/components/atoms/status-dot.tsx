import { cn } from "@/lib/utils";

export type DotTone = "green" | "orange" | "red" | "blue" | "idle" | "accent";

const TONE: Record<DotTone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
  blue: "bg-blue",
  idle: "bg-ink-5",
  accent: "bg-accent-ink",
};

export function StatusDot({
  tone = "green",
  size = 6,
  className,
}: {
  tone?: DotTone;
  size?: 5 | 6 | 7 | 8;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full", TONE[tone], className)}
      style={{ width: size, height: size }}
    />
  );
}
