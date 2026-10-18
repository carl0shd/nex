import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onClick?: () => void;
  className?: string;
}

function CommandBar({ onClick, className }: CommandBarProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass interactive press group flex h-8 w-80 cursor-pointer items-center justify-between rounded-full pr-1.5 pl-3 outline-none select-none",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <Search size={13} className="text-ink-3" />
        <span className="interactive text-xs text-ink-4 group-hover:text-ink-3">
          Search or type a command…
        </span>
      </span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

export default CommandBar;
