import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  const overlay = (
    <div
      className={cn(
        "inset-0 flex justify-center",
        fullWindow ? "fixed z-50" : "absolute z-40",
        offset === undefined ? "items-center pb-12" : "items-start",
      )}
      style={{ paddingTop: offset, WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="enter-fade absolute inset-0 bg-scrim backdrop-blur-[3px]"
      />
      {children}
    </div>
  );
  return fullWindow ? createPortal(overlay, document.body) : overlay;
}
