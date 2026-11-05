import { ChevronsUpDown } from "lucide-react";
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
      <span title={value} className="min-w-0 flex-1 truncate text-left">
        {value}
      </span>
      <ChevronsUpDown width={12} height={12} strokeWidth={2} className="shrink-0 text-ink-3" />
    </button>
  );
}
