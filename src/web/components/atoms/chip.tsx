import { Play } from "iconoir-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/atoms/status-dot";

type ChipProps = {
  children: React.ReactNode;
  running?: boolean;
  meta?: string;
  onClick?: () => void;
  className?: string;
};

export function Chip({ children, running = false, meta, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "interactive press inline-flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-[9px] font-mono text-3xs shadow-[inset_0_0_0_1px_var(--line-chip)] select-none hover:bg-hover",
        running ? "text-ink-2" : "text-ink-3",
        className,
      )}
    >
      {running ? <StatusDot tone="green" /> : <Play width={9} height={9} strokeWidth={2.5} />}
      {children}
      {meta && <span className="text-ink-4">{meta}</span>}
    </button>
  );
}

export function CountChip({ count, className }: { count: number; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`${count} more`}
      className={cn(
        "interactive press inline-flex h-[26px] shrink-0 cursor-pointer items-center rounded-full px-2 font-mono text-3xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-chip)] select-none hover:bg-hover",
        className,
      )}
    >
      +{count}
    </button>
  );
}
