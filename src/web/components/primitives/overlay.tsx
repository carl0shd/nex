import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const EDGE_PX = 24;

// A dialog sits `offset` from the top while it fits; once taller, the equal spacers shrink and center it.
export function Overlay({
  offset,
  fullWindow = false,
  onClose,
  children,
}: {
  offset?: number;
  fullWindow?: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  const anchored = offset !== undefined;
  const spacer = Math.max(offset ?? 0, EDGE_PX) - EDGE_PX;
  const overlay = (
    <div
      className={cn(
        "inset-0 flex",
        fullWindow ? "fixed z-50" : "absolute z-40",
        anchored ? "flex-col items-center py-6 *:shrink-0" : "items-center justify-center pb-12",
      )}
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="enter-fade absolute inset-0 bg-scrim backdrop-blur-[3px]"
      />
      {anchored && (
        <span aria-hidden className="pointer-events-none" style={{ flex: `0 1 ${spacer}px` }} />
      )}
      {children}
      {anchored && (
        <span aria-hidden className="pointer-events-none" style={{ flex: `1 1 ${spacer}px` }} />
      )}
    </div>
  );
  return fullWindow ? createPortal(overlay, document.body) : overlay;
}
