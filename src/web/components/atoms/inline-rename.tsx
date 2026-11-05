import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export function InlineRename({
  name,
  label,
  onDone,
  className,
}: {
  name: string;
  label: string;
  onDone: (name: string | null) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(name);
  const finish = () => onDone(draft.trim() && draft.trim() !== name ? draft.trim() : null);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") finish();
    if (event.key === "Escape") onDone(null);
  };
  return (
    <input
      autoFocus
      aria-label={label}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={finish}
      onFocus={(event) => event.currentTarget.select()}
      className={cn(
        "h-6 min-w-0 flex-1 rounded-chip bg-hover px-1.5 text-sm font-semibold text-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_50%,transparent)] outline-none select-text",
        className,
      )}
    />
  );
}
