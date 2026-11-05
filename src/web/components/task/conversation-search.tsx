import { useEffect, useRef } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { IconButton } from "@/components/atoms/icon-button";

export function ConversationSearch({
  query,
  focusRequest,
  current,
  total,
  onQueryChange,
  onStep,
  onClose,
}: {
  query: string;
  focusRequest: number;
  current: number;
  total: number;
  onQueryChange: (query: string) => void;
  onStep: (delta: 1 | -1) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusRequest]);
  useHotkey("Enter", () => onStep(1), { target: inputRef });
  useHotkey("Shift+Enter", () => onStep(-1), { target: inputRef });
  useHotkey("Escape", onClose, { target: inputRef });

  return (
    <div className="enter-pop absolute top-2.5 right-3 z-20 flex h-9 w-[280px] items-center gap-1 rounded-field bg-elevated pr-1 pl-2.5 shadow-overlay">
      <Search width={12} height={12} strokeWidth={2} className="shrink-0 text-ink-4" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Find in conversation"
        className="min-w-0 flex-1 bg-transparent px-1 text-xs text-ink outline-none select-text placeholder:text-ink-4"
      />
      {query && (
        <span className="shrink-0 px-1 text-2xs text-ink-4 tabular-nums">
          {total ? `${current + 1} of ${total}` : "No results"}
        </span>
      )}
      <IconButton
        size="sm"
        aria-label="Previous match"
        disabled={!total}
        onClick={() => onStep(-1)}
        className="size-6 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronUp width={13} height={13} strokeWidth={2} />
      </IconButton>
      <IconButton
        size="sm"
        aria-label="Next match"
        disabled={!total}
        onClick={() => onStep(1)}
        className="size-6 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronDown width={13} height={13} strokeWidth={2} />
      </IconButton>
      <IconButton size="sm" aria-label="Close search" onClick={onClose} className="size-6">
        <X width={12} height={12} strokeWidth={2} />
      </IconButton>
    </div>
  );
}
