import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SettingsIndexGroup {
  label: string;
  items: readonly { id: string; title: string }[];
}

export function SettingsIndex({
  groups,
  active,
  onSelect,
}: {
  groups: readonly SettingsIndexGroup[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>(`[data-index-item="${active}"]`);
    const marker = markerRef.current;
    if (!marker) return;
    marker.style.opacity = link ? "1" : "0";
    if (!link) return;
    marker.style.top = `${link.offsetTop}px`;
    marker.style.height = `${link.offsetHeight}px`;
  }, [active, groups]);

  return (
    <nav aria-label="On this page" className="flex w-[180px] flex-col gap-5">
      <div ref={listRef} className="relative flex flex-col gap-5">
        <span
          ref={markerRef}
          aria-hidden
          className="absolute left-0 w-0.5 rounded-full bg-accent opacity-0 transition-[top,height] duration-200 ease-out"
        />
        {groups.map((group, index) => (
          <div key={group.label} className="flex flex-col">
            <span className="pb-2 pl-3 text-xs text-ink-4">
              {index === 0 ? "On this page" : group.label}
            </span>
            <div className="flex flex-col border-l border-line">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-index-item={item.id}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "interactive flex h-[30px] cursor-pointer items-center rounded-r-control pl-3 text-left text-sm select-none focus-visible:bg-hover focus-visible:text-ink focus-visible:outline-none",
                    item.id === active ? "text-ink" : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
