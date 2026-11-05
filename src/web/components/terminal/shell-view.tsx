import { useRef, useState } from "react";
import { Eraser, RotateCcw, Square } from "lucide-react";
import { IconButton } from "@/components/atoms/icon-button";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { PtyTerminal } from "@/components/terminal/pty-terminal";
import { TerminalFrame } from "@/components/terminal/terminal-frame";
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
  onClose,
  live = false,
  focusId,
}: {
  terminals: readonly ShellTerminal[];
  defaultActive?: string;
  live?: boolean;
  focusId?: string;
  onInput?: (id: string, data: string, terminal: TerminalHandle) => void;
  onNewTerminal?: () => void;
  onRestart?: (id: string) => void;
  onStop?: (id: string) => void;
  onClose?: (id: string) => void;
}) {
  const [chosen, setActive] = useState(focusId ?? defaultActive ?? terminals[0]?.id ?? "");
  const [count, setCount] = useState(terminals.length);
  const [focused, setFocused] = useState(focusId);
  if (focusId !== focused) {
    setFocused(focusId);
    if (focusId) setActive(focusId);
  }
  if (count !== terminals.length) {
    setCount(terminals.length);
    if (terminals.length > count) setActive(terminals.at(-1)?.id ?? "");
  }
  const active = terminals.some((terminal) => terminal.id === chosen)
    ? chosen
    : (terminals.at(-1)?.id ?? "");
  const handles = useRef(new Map<string, TerminalHandle>());
  const [picked, setPicked] = useState<string>();
  const current = terminals.find((terminal) => terminal.id === active);
  const { ref: viewportRef, near } = useNearViewport<HTMLDivElement>();

  return (
    <div ref={viewportRef} className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex h-[42px] shrink-0 items-center gap-1 pr-2.5 pl-3">
        <TerminalTabs
          terminals={terminals}
          active={active}
          onSelect={(id) => {
            setActive(id);
            setPicked(id);
            requestAnimationFrame(() => handles.current.get(id)?.focus());
          }}
          onNew={onNewTerminal}
          onClose={onClose}
        />
        <span className="ml-auto flex items-center gap-0.5">
          <IconButton size="sm" aria-label="Restart" onClick={() => onRestart?.(active)}>
            <RotateCcw width={13} height={13} strokeWidth={2} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Stop"
            disabled={live ? !current : !current?.running}
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
            <Eraser width={13} height={13} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <TerminalFrame>
        {terminals.map((terminal) => {
          const register = (handle: TerminalHandle | null) => {
            if (handle) handles.current.set(terminal.id, handle);
            else handles.current.delete(terminal.id);
          };
          const className = cn("flex-1", terminal.id !== active && "hidden");
          if (live && (terminal.id !== active || !near)) return null;
          return live ? (
            <PtyTerminal
              key={terminal.id}
              terminalId={terminal.id}
              autoFocus={terminal.id === picked}
              ref={register}
              className={className}
            />
          ) : (
            <TerminalSurface
              key={terminal.id}
              ref={register}
              className={className}
              initialOutput={terminal.output}
              onData={(data) => {
                const handle = handles.current.get(terminal.id);
                if (handle) onInput?.(terminal.id, data, handle);
              }}
            />
          );
        })}
      </TerminalFrame>
    </div>
  );
}
