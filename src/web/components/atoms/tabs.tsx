import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSlidingThumb } from "@/hooks/use-sliding-thumb";

export type TabItem<T extends string> = { value: T; label: ReactNode };

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const { containerRef, thumbRef } = useSlidingThumb<HTMLDivElement, HTMLSpanElement>(
    items.findIndex((item) => item.value === value),
  );
  return (
    <div
      ref={containerRef}
      role="tablist"
      className={cn(
        "relative flex shrink-0 gap-0.5 rounded-full bg-elevated p-0.5 shadow-track",
        className,
      )}
    >
      <span
        ref={thumbRef}
        aria-hidden
        className="glide-thumb absolute inset-y-0.5 rounded-full bg-surface-raised opacity-0 shadow-tab"
      />
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-thumb-item
            onClick={() => onChange(item.value)}
            className={cn(
              "interactive press relative flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap select-none",
              active ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
