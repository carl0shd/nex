import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ResizeHandle({
  width,
  min,
  measure,
  onResize,
  onCommit,
  className,
}: {
  width: number;
  min: number;
  measure: () => { width: number; max: number };
  onResize: (width: number) => void;
  onCommit: (width: number) => void;
  className?: string;
}) {
  const drag = useRef<{ x: number; width: number; max: number; current: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (value: number, upper: number) =>
    Math.round(Math.min(Math.max(value, min), Math.max(min, upper)));

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize"
      aria-valuenow={width}
      aria-valuemin={min}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const start = measure();
        drag.current = { x: event.clientX, ...start, current: start.width };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start) return;
        start.current = clamp(start.width + event.clientX - start.x, start.max);
        onResize(start.current);
      }}
      onPointerUp={() => {
        const end = drag.current;
        if (!end) return;
        drag.current = null;
        setDragging(false);
        if (end.current !== end.width) onCommit(end.current);
      }}
      onLostPointerCapture={() => {
        const end = drag.current;
        if (!end) return;
        drag.current = null;
        setDragging(false);
        if (end.current !== end.width) onCommit(end.current);
      }}
      onDoubleClick={() => {
        onResize(min);
        onCommit(min);
      }}
      className={cn("group/resize flex cursor-col-resize justify-center select-none", className)}
    >
      <span
        className={cn(
          "w-0.5 rounded-full bg-line-focus transition-opacity duration-150 ease-out",
          dragging ? "opacity-100" : "opacity-0 group-hover/resize:opacity-100",
        )}
      />
    </div>
  );
}
