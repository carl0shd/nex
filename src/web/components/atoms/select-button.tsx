import { DataTransferBoth } from "iconoir-react";
import { cn } from "@/lib/utils";

export function SelectButton({
  value,
  mono = false,
  onClick,
  className,
}: {
  value: string;
  mono?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "interactive press-wide flex h-[30px] min-w-[170px] shrink-0 cursor-pointer items-center gap-2 rounded-control bg-field pr-2.5 pl-3 whitespace-nowrap shadow-inset-field select-none hover:bg-hover-2",
        mono ? "font-mono text-xs text-ink-2" : "text-sm text-ink",
        className,
      )}
    >
      <span className="flex-1 text-left">{value}</span>
      <DataTransferBoth width={12} height={12} strokeWidth={2} className="rotate-90 text-ink-3" />
    </button>
  );
}
