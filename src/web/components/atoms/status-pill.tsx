import { cn } from "@/lib/utils";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";

type Tone = "green" | "orange" | "red" | "accent" | "neutral";

const STYLE: Record<Tone, { pill: string; dot: DotTone }> = {
  green: { pill: "bg-green-tint text-green", dot: "green" },
  orange: { pill: "bg-orange-tint text-orange", dot: "orange" },
  red: { pill: "bg-red-tint text-red", dot: "red" },
  accent: { pill: "bg-blue-tint text-blue", dot: "blue" },
  neutral: { pill: "bg-hover text-ink-4", dot: "idle" },
};

export function StatusPill({
  tone = "neutral",
  dot = true,
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-[9px] text-2xs font-medium",
        STYLE[tone].pill,
        className,
      )}
    >
      {dot && <StatusDot tone={STYLE[tone].dot} />}
      {children}
    </span>
  );
}
