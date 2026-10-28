import type { ReactNode } from "react";
import { SelectionMark } from "@/components/atoms/selection-mark";
import { cn } from "@/lib/utils";

export function OptionCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "interactive press-large flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-field px-3 py-2.5 text-left select-none hover:bg-field",
        selected
          ? "shadow-[inset_0_0_0_1px_var(--ring-selected)]"
          : "shadow-[inset_0_0_0_1px_var(--line-strong)]",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{title}</span>
        {description && <span className="text-xs text-ink-3">{description}</span>}
      </span>
      <SelectionMark selected={selected} />
    </button>
  );
}
