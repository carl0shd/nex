import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { FileIcon, FolderGit2, GitBranch, Search } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { Overlay } from "@/components/primitives/overlay";
import { searchItems, stepIndex } from "@/lib/command-search";
import { cn } from "@/lib/utils";

type CommandIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export type CommandTaskStatus = "working" | "waiting" | "idle";

interface CommandBase {
  id: string;
  label: string;
  keywords?: readonly string[];
}

export type CommandItem =
  | (CommandBase & { kind: "task"; project: string; status: CommandTaskStatus })
  | (CommandBase & { kind: "file" })
  | (CommandBase & { kind: "project"; workspace: string })
  | (CommandBase & { kind: "action"; icon: CommandIcon; kbd?: string });

export interface CommandGroup {
  id: string;
  label: string;
  items: readonly CommandItem[];
  onlyWhenSearching?: boolean;
  limit?: number;
}

export interface CommandChoice {
  item: CommandItem;
  split: boolean;
}

const STATUS: Record<CommandTaskStatus, { label: string; tone: string }> = {
  working: { label: "Working", tone: "text-green" },
  waiting: { label: "Needs you", tone: "text-orange" },
  idle: { label: "Idle", tone: "text-ink-4" },
};

function CommandRowContent({ item }: { item: CommandItem }) {
  if (item.kind === "task") {
    const status = STATUS[item.status];
    return (
      <>
        <GitBranch width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-3" />
        <span className="truncate text-sm text-ink">{item.label}</span>
        <span className="shrink-0 text-2xs text-ink-4">{item.project}</span>
        <span className={cn("ml-auto shrink-0 text-2xs", status.tone)}>{status.label}</span>
      </>
    );
  }
  if (item.kind === "file") {
    return (
      <>
        <FileIcon width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-3" />
        <span className="truncate font-mono text-xs text-ink">{item.label}</span>
      </>
    );
  }
  if (item.kind === "project") {
    return (
      <>
        <FolderGit2 width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-3" />
        <span className="truncate text-sm text-ink" title={item.label}>
          {item.label}
        </span>
        <span className="truncate text-2xs text-ink-4" title={item.workspace}>
          {item.workspace}
        </span>
        <span className="ml-auto shrink-0 text-2xs text-ink-4">New task</span>
      </>
    );
  }
  const Icon = item.icon;
  return (
    <>
      <Icon width={14} height={14} strokeWidth={2} />
      <span className="truncate text-sm text-ink">{item.label}</span>
      {item.kbd && <Kbd className="ml-auto">{item.kbd}</Kbd>}
    </>
  );
}

function FooterHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Kbd>{keys}</Kbd>
      {label}
    </span>
  );
}

export function CommandPalette({
  groups,
  defaultQuery = "",
  placeholder = "Jump to a task, project, file or action…",
  onSelect,
  onClose,
}: {
  groups: readonly CommandGroup[];
  defaultQuery?: string;
  placeholder?: string;
  onSelect: (choice: CommandChoice) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const visible = useMemo(
    () =>
      groups
        .filter((group) => !group.onlyWhenSearching || query.trim())
        .map((group) => ({
          ...group,
          items: searchItems(group.items, query).slice(0, group.limit),
        }))
        .filter((group) => group.items.length > 0),
    [groups, query],
  );
  const flat = visible.flatMap((group) => group.items);
  const starts = visible.map((_, groupIndex) =>
    visible.slice(0, groupIndex).reduce((sum, group) => sum + group.items.length, 0),
  );
  const current = flat[Math.min(active, flat.length - 1)];

  useLayoutEffect(() => {
    const list = listRef.current;
    const highlight = highlightRef.current;
    if (!list || !highlight) return;
    const row = list.querySelector<HTMLElement>(`[data-command-index="${active}"]`);
    highlight.style.opacity = row ? "1" : "0";
    if (!row) return;
    highlight.style.top = `${row.offsetTop}px`;
    highlight.style.height = `${row.offsetHeight}px`;
    row.scrollIntoView({ block: "nearest" });
  }, [active, visible]);

  const choose = (item: CommandItem | undefined, split: boolean) => {
    if (item) onSelect({ item, split });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => stepIndex(index, event.key === "ArrowDown" ? 1 : -1, flat.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(current, event.metaKey);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Overlay offset={96} onClose={onClose}>
      <div
        role="dialog"
        aria-label="Command palette"
        className="enter-pop relative h-fit w-[640px] overflow-hidden rounded-panel bg-surface-raised shadow-modal"
        style={{ transformOrigin: "top center" }}
      >
        <div className="flex h-[52px] items-center gap-2.5 border-b border-line px-4">
          <Search width={16} height={16} strokeWidth={2} className="shrink-0 text-ink-3" />
          <input
            autoFocus
            aria-label="Search"
            role="combobox"
            aria-expanded
            aria-controls="command-results"
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-5"
          />
          <Kbd>esc</Kbd>
        </div>

        <div
          ref={listRef}
          id="command-results"
          role="listbox"
          className="relative max-h-[420px] overflow-y-auto p-1.5"
        >
          <span
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 rounded-control bg-hover-2 opacity-0 transition-[top,height] duration-150 ease-out"
          />
          {visible.length === 0 && (
            <div className="flex h-24 items-center justify-center text-sm text-ink-4">
              No results for “{query.trim()}”
            </div>
          )}
          {visible.map((group, groupIndex) => (
            <div key={group.id} role="group" aria-label={group.label}>
              <div
                className={cn(
                  "px-2.5 pb-1 text-xs font-medium text-ink-3",
                  groupIndex === 0 ? "pt-2" : "pt-2.5",
                )}
              >
                {group.label}
              </div>
              {group.items.map((item, itemIndex) => {
                const index = starts[groupIndex] + itemIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === active}
                    data-command-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={(event) => choose(item, event.metaKey)}
                    className={cn(
                      "interactive press-wide relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left select-none",
                      index === active ? "text-ink" : "text-ink-3",
                    )}
                  >
                    <CommandRowContent item={item} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex h-9 items-center gap-4 border-t border-line px-4 text-2xs text-ink-4">
          <FooterHint keys="↑↓" label="navigate" />
          <FooterHint keys="↵" label="open" />
        </div>
      </div>
    </Overlay>
  );
}
