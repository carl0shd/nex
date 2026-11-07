import { Play } from "lucide-react";
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
        "interactive press inline-flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-[9px] text-2xs shadow-[inset_0_0_0_1px_var(--line-chip)] select-none hover:bg-hover",
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

export function CountChip({
  count,
  open,
  running = false,
  onClick,
  className,
}: {
  count: number;
  open?: boolean;
  running?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`${count} more`}
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press inline-flex h-[26px] shrink-0 cursor-pointer items-center rounded-full px-2 text-2xs tabular-nums text-ink-3 shadow-[inset_0_0_0_1px_var(--line-chip)] select-none hover:bg-hover",
        open && "bg-hover text-ink-2",
        className,
      )}
    >
      {running && <span className="mr-1.5 size-1.5 rounded-full bg-green" />}+{count}
    </button>
  );
}
