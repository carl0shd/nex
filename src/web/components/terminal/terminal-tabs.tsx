import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Plus, X } from "lucide-react";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { fitTabs } from "@/lib/tab-overflow";
import { cn } from "@/lib/utils";

export interface TerminalTabItem {
  id: string;
  name: string;
  port?: number;
  running?: boolean;
}

const TAB_GAP = 4;
const NEW_BUTTON = 26;

interface Measure {
  widths: number[];
  moreWidth: number;
  available: number;
}

function TerminalTab({
  terminal,
  selected,
  onSelect,
  onClose,
}: {
  terminal: TerminalTabItem;
  selected: boolean;
  onSelect?: () => void;
  onClose?: () => void;
}) {
  return (
    <span
      className={cn(
        "group/tab interactive flex h-[26px] shrink-0 items-center rounded-full font-mono text-2xs",
        selected ? "bg-elevated text-ink shadow-tab" : "text-ink-3 hover:bg-hover hover:text-ink-2",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={onSelect}
        className={cn(
          "press flex h-full cursor-pointer items-center gap-1.5 pl-2.5 select-none",
          onClose ? "pr-1" : "pr-2.5",
        )}
      >
        {terminal.running && <StatusDot tone="green" />}
        <span className="max-w-[160px] truncate" title={terminal.name}>
          {terminal.name}
        </span>
        {terminal.port && <span className="text-ink-4">:{terminal.port}</span>}
      </button>
      {onClose && (
        <button
          type="button"
          aria-label={`Close ${terminal.name}`}
          onClick={onClose}
          className={cn(
            "interactive press mr-1.5 flex size-3.5 cursor-pointer items-center justify-center text-ink-4 transition-opacity select-none hover:text-ink",
            selected ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100",
          )}
        >
          <X width={10} height={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

function MoreTabs({
  count,
  open,
  onClick,
}: {
  count: number;
  open?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${count} more terminals`}
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press flex h-[26px] shrink-0 cursor-pointer items-center rounded-full px-2.5 font-mono text-2xs tabular-nums select-none",
        open ? "bg-hover text-ink" : "text-ink-3 hover:bg-hover hover:text-ink-2",
      )}
    >
      +{count}
    </button>
  );
}

export function TerminalTabs({
  terminals,
  active,
  onSelect,
  onNew,
  onClose,
}: {
  terminals: readonly TerminalTabItem[];
  active: string;
  onSelect: (id: string) => void;
  onNew?: () => void;
  onClose?: (id: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [measure, setMeasure] = useState<Measure | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    const ruler = measureRef.current;
    if (!row || !ruler) return;
    const observer = new ResizeObserver(() => {
      const items = [...ruler.children].map((child) => (child as HTMLElement).offsetWidth);
      // Synchronous so the corrected row paints in the same frame instead of jumping.
      flushSync(() =>
        setMeasure({
          widths: items.slice(0, -1),
          moreWidth: items.at(-1) ?? 0,
          available: row.clientWidth - NEW_BUTTON,
        }),
      );
    });
    observer.observe(row);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, []);

  const activeIndex = terminals.findIndex((terminal) => terminal.id === active);
  const fit =
    measure && measure.widths.length === terminals.length
      ? fitTabs({ ...measure, active: activeIndex, gap: TAB_GAP })
      : { visible: terminals.map((_, index) => index), hidden: [] };
  const hidden = fit.hidden.map((index) => terminals[index]);

  return (
    <div
      ref={rowRef}
      role="tablist"
      aria-label="Terminals"
      className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
    >
      <div
        ref={measureRef}
        aria-hidden
        inert
        className="pointer-events-none invisible absolute top-0 left-0 flex"
      >
        {terminals.map((terminal) => (
          <TerminalTab
            key={terminal.id}
            terminal={terminal}
            selected={false}
            onClose={onClose && (() => {})}
          />
        ))}
        <MoreTabs count={terminals.length} />
      </div>
      {fit.visible.map((index) => {
        const terminal = terminals[index];
        return (
          <TerminalTab
            key={terminal.id}
            terminal={terminal}
            selected={terminal.id === active}
            onSelect={() => onSelect(terminal.id)}
            onClose={onClose && (() => onClose(terminal.id))}
          />
        );
      })}
      {hidden.length > 0 && (
        <AnchoredPopover
          open={moreOpen}
          onOpenChange={setMoreOpen}
          side="bottom"
          strategy="fixed"
          trigger={
            <MoreTabs
              count={hidden.length}
              open={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
            />
          }
        >
          <Menu width={220} maxHeight={320}>
            {hidden.map((terminal) => (
              <MenuItem
                key={terminal.id}
                meta={terminal.port ? `:${terminal.port}` : undefined}
                onSelect={() => {
                  setMoreOpen(false);
                  onSelect(terminal.id);
                }}
              >
                {terminal.name}
              </MenuItem>
            ))}
          </Menu>
        </AnchoredPopover>
      )}
      <IconButton aria-label="New terminal" className="size-[26px]" onClick={onNew}>
        <Plus width={13} height={13} strokeWidth={2.25} />
      </IconButton>
    </div>
  );
}
