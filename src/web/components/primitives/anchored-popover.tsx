import { useRef, type ReactNode } from "react";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/utils";

const ALIGN = { start: "left-0", end: "right-0" } as const;

export function AnchoredPopover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  side = "top",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: keyof typeof ALIGN;
  side?: "top" | "bottom" | "right";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => onOpenChange(false));
  return (
    <div ref={ref} className={cn("relative flex", className)}>
      {trigger}
      {open && (
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
      )}
    </div>
  );
}
