import { useRef, type ReactNode } from "react";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/utils";

const ALIGN = { start: "left-0", end: "right-0" } as const;
const GAP_PX = 8;
const EDGE_PX = 8;

function placeFixed(
  node: HTMLDivElement | null,
  anchor: HTMLDivElement | null,
  align: "start" | "end",
  side: "top" | "bottom" | "right",
) {
  if (!node || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const height = node.offsetHeight;
  const fitsAbove = rect.top - GAP_PX - height >= EDGE_PX;
  const fitsBelow = rect.bottom + GAP_PX + height <= window.innerHeight - EDGE_PX;
  const above = side === "top" ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
  node.style.top = above ? "" : `${rect.bottom + GAP_PX}px`;
  node.style.bottom = above ? `${window.innerHeight - rect.top + GAP_PX}px` : "";
  if (align === "end") node.style.right = `${window.innerWidth - rect.right}px`;
  else node.style.left = `${rect.left}px`;
}

export function AnchoredPopover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  side = "top",
  strategy = "absolute",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: keyof typeof ALIGN;
  side?: "top" | "bottom" | "right";
  strategy?: "absolute" | "fixed";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => onOpenChange(false));
  return (
    <div ref={ref} className={cn("relative flex", className)}>
      {trigger}
      {open &&
        (strategy === "fixed" ? (
          <div ref={(node) => placeFixed(node, ref.current, align, side)} className="fixed z-50">
            {children}
          </div>
        ) : (
          <div
            className={cn(
              "absolute z-30",
              side === "top" && cn("bottom-full mb-2", ALIGN[align]),
              side === "bottom" && cn("top-full mt-2", ALIGN[align]),
              side === "right" && "bottom-0 left-full ml-3",
            )}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
