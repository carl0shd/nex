import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlideHighlightProps extends React.ComponentProps<"div"> {
  rowSelector?: string;
  highlightClassName?: string;
}

interface GlideBox {
  top: number;
  height: number;
}

const DEFAULT_ROWS = "[data-glide-row]";

function GlideHighlight({
  rowSelector = DEFAULT_ROWS,
  highlightClassName,
  className,
  children,
  onMouseOver,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  ...props
}: GlideHighlightProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<GlideBox | null>(null);
  const [visible, setVisible] = useState(false);

  const moveTo = (target: EventTarget | null): void => {
    const container = ref.current;
    if (!(target instanceof Element) || !container) return;
    const row = target.closest(rowSelector);
    if (!(row instanceof HTMLElement) || !container.contains(row)) return;
    if (row.matches("[data-disabled], :disabled")) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setBox({ top: rowRect.top - containerRect.top + container.scrollTop, height: rowRect.height });
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      data-slot="glide-highlight"
      className={cn("relative", className)}
      onMouseOver={(e) => {
        moveTo(e.target);
        onMouseOver?.(e);
      }}
      onMouseLeave={(e) => {
        setVisible(false);
        onMouseLeave?.(e);
      }}
      onFocusCapture={(e) => {
        moveTo(e.target);
        onFocusCapture?.(e);
      }}
      onBlurCapture={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setVisible(false);
        onBlurCapture?.(e);
      }}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 rounded-[7px] bg-hover-2",
          highlightClassName,
        )}
        style={{
          top: box?.top ?? 0,
          height: box?.height ?? 0,
          opacity: box && visible ? 1 : 0,
          transition: box
            ? "top 220ms var(--ease-out-strong), height 220ms var(--ease-out-strong), opacity 150ms ease"
            : "opacity 150ms ease",
        }}
      />
      {children}
    </div>
  );
}

export default GlideHighlight;
