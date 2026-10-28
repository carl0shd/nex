import { useRef, useState } from "react";
import { Erase, Refresh, Square } from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";
import { TerminalSurface, type TerminalHandle } from "@/components/terminal/terminal-surface";
import { TerminalTabs, type TerminalTabItem } from "@/components/terminal/terminal-tabs";
import { cn } from "@/lib/utils";

export interface ShellTerminal extends TerminalTabItem {
  output?: string;
}

export function ShellView({
  terminals,
  defaultActive,
  onInput,
  onNewTerminal,
  onRestart,
  onStop,
}: {
  terminals: readonly ShellTerminal[];
  defaultActive?: string;
  onInput?: (id: string, data: string, terminal: TerminalHandle) => void;
  onNewTerminal?: () => void;
  onRestart?: (id: string) => void;
  onStop?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultActive ?? terminals[0]?.id ?? "");
  const handles = useRef(new Map<string, TerminalHandle>());
  const current = terminals.find((terminal) => terminal.id === active);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex h-[42px] shrink-0 items-center gap-1 pr-2.5 pl-3">
        <TerminalTabs
          terminals={terminals}
          active={active}
          onSelect={(id) => {
            setActive(id);
            requestAnimationFrame(() => handles.current.get(id)?.focus());
          }}
          onNew={onNewTerminal}
        />
        <span className="ml-auto flex items-center gap-0.5">
          <IconButton size="sm" aria-label="Restart" onClick={() => onRestart?.(active)}>
            <Refresh width={13} height={13} strokeWidth={2} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Stop"
            disabled={!current?.running}
            onClick={() => onStop?.(active)}
            className="disabled:pointer-events-none disabled:opacity-40"
          >
            <Square width={12} height={12} strokeWidth={2} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Clear"
            onClick={() => handles.current.get(active)?.clear()}
          >
            <Erase width={13} height={13} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <div className="mx-2 mb-2 flex min-h-0 flex-1 rounded-panel bg-page px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line)]">
        {terminals.map((terminal) => (
          <TerminalSurface
            key={terminal.id}
            ref={(handle) => {
              if (handle) handles.current.set(terminal.id, handle);
              else handles.current.delete(terminal.id);
            }}
            initialOutput={terminal.output}
            onData={(data) => {
              const handle = handles.current.get(terminal.id);
              if (handle) onInput?.(terminal.id, data, handle);
            }}
            className={cn("flex-1", terminal.id !== active && "hidden")}
          />
        ))}
      </div>
    </div>
  );
}
