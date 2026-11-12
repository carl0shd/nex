import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

export function ServiceChip({
  name,
  tone = "idle",
  selected = false,
  onClick,
  className,
}: {
  name: string;
  tone?: DotTone;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={name}
      aria-expanded={selected}
      onClick={onClick}
      className={cn(
        "interactive press inline-flex h-[26px] max-w-[180px] min-w-0 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs select-none",
        selected
          ? "bg-hover-2 text-ink shadow-[inset_0_0_0_1px_var(--line-chip)]"
          : "text-ink-2 shadow-[inset_0_0_0_1px_var(--line-chip)] hover:bg-hover hover:text-ink",
        className,
      )}
    >
      <StatusDot tone={tone} />
      <span className="truncate">{name}</span>
    </button>
  );
}
