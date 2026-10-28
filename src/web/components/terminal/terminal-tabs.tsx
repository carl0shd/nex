import { Plus } from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusDot } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

export interface TerminalTabItem {
  id: string;
  name: string;
  port?: number;
  running?: boolean;
}

export function TerminalTabs({
  terminals,
  active,
  onSelect,
  onNew,
}: {
  terminals: readonly TerminalTabItem[];
  active: string;
  onSelect: (id: string) => void;
  onNew?: () => void;
}) {
  return (
    <div role="tablist" aria-label="Terminals" className="flex min-w-0 items-center gap-0.5">
      {terminals.map((terminal) => {
        const selected = terminal.id === active;
        return (
          <button
            key={terminal.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(terminal.id)}
            className={cn(
              "interactive press flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-mono text-2xs select-none",
              selected
                ? "bg-elevated text-ink shadow-tab"
                : "text-ink-3 hover:bg-hover hover:text-ink-2",
            )}
          >
            {terminal.running && <StatusDot tone="green" />}
            {terminal.name}
            {terminal.port && <span className="text-ink-4">:{terminal.port}</span>}
          </button>
        );
      })}
      <IconButton aria-label="New terminal" className="size-[26px]" onClick={onNew}>
        <Plus width={13} height={13} strokeWidth={2.25} />
      </IconButton>
    </div>
  );
}
