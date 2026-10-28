import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "orange" | "red" | "accent";

const TONE: Record<Tone, string> = {
  neutral: "bg-hover text-ink-3",
  green: "bg-green-tint text-green",
  orange: "bg-orange-tint text-orange",
  red: "bg-red-tint text-red",
  accent: "bg-accent-tint text-accent-ink",
};

export function ValuePill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center rounded-full px-[7px] text-2xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
