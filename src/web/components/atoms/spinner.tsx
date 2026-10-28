import { cn } from "@/lib/utils";

export function Spinner({ accent = false, className }: { accent?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-ring-idle",
        accent ? "border-t-accent-ink" : "border-t-ink-2",
        className,
      )}
    />
  );
}

export function SpinnerArc({
  width = 12,
  height = 12,
  strokeWidth = 2,
}: {
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
