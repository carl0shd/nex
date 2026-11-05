import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import GlideMenu from "@/components/primitives/glide-menu";

const ROW_HEIGHT = 34;
const OVERSCAN = 8;

export function VirtualMenu<T>({
  items,
  itemKey,
  renderItem,
  header,
  empty,
  selectedIndex = -1,
  width,
  maxHeight,
}: {
  items: readonly T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  header?: ReactNode;
  empty?: ReactNode;
  selectedIndex?: number;
  width: number;
  maxHeight: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  useLayoutEffect(() => {
    if (selectedIndex >= 0) virtualizer.scrollToIndex(selectedIndex, { align: "center" });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="menu"
      className="enter-pop flex flex-col rounded-menu bg-elevated p-1.5 shadow-overlay"
      style={{ width, transformOrigin: "top" }}
    >
      {header}
      {items.length === 0 ? (
        empty
      ) : (
        <div
          ref={scrollRef}
          className="menu-scroll -mr-1.5 overflow-y-auto pr-1.5"
          style={{ maxHeight }}
        >
          <GlideMenu>
            <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((row) => (
                <div
                  key={itemKey(items[row.index])}
                  className="absolute inset-x-0 top-0 pb-0.5"
                  style={{ height: ROW_HEIGHT, transform: `translateY(${row.start}px)` }}
                >
                  {renderItem(items[row.index])}
                </div>
              ))}
            </div>
          </GlideMenu>
        </div>
      )}
    </div>
  );
}
