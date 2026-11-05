import { Search } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { cn } from "@/lib/utils";

export function SearchButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Open command palette"
      onClick={onClick}
      className={cn(
        "interactive press-wide flex h-8 w-[340px] shrink-0 cursor-pointer items-center gap-2 rounded-full bg-island pr-2 pl-3 text-xs text-ink-4 shadow-island hover:bg-surface-raised hover:text-ink-3 select-none",
        className,
      )}
    >
      <Search width={13} height={13} strokeWidth={2} className="text-ink-3" />
      <span className="flex-1 text-left">Jump to a task, project or action…</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}
