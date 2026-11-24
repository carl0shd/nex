import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const FOCUS = "[data-scroll-focus]";

interface Edges {
  start: boolean;
  end: boolean;
}

function EdgeFade({
  side,
  shown,
  solid,
}: {
  side: "start" | "end";
  shown: boolean;
  solid: number;
}) {
  return (
    <span
      aria-hidden
      data-side={side}
      style={{ "--edge-solid": `${solid}px` } as CSSProperties}
      className={cn(
        "edge-fade pointer-events-none absolute inset-y-0 z-10 transition-opacity duration-200 ease-out",
        side === "start" ? "left-0" : "right-0",
        shown ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

export function SideScroll({
  children,
  focusKey,
  startInset = 0,
  endInset = 0,
  className,
}: {
  children: ReactNode;
  focusKey?: string;
  startInset?: number;
  endInset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    const next = { start: node.scrollLeft > 1, end: node.scrollLeft < max - 1 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      const sideways = Math.abs(event.deltaX) >= Math.abs(event.deltaY);
      if (sideways || node.scrollWidth <= node.clientWidth) return;
      node.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    node.addEventListener("scroll", measure, { passive: true });
    node.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      node.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, [measure]);

  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const node = ref.current;
    const target = node?.querySelector<HTMLElement>(FOCUS);
    if (!node || !target) return;
    const center = startInset + (node.clientWidth - startInset - endInset) / 2;
    const left = target.offsetLeft + target.offsetWidth / 2 - center;
    node.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [focusKey, startInset, endInset]);

  return (
    <div className={cn("relative flex min-w-0 items-center self-stretch", className)}>
      <div
        ref={ref}
        className="no-scrollbar relative flex min-w-0 flex-1 items-center self-stretch overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        <span
          className="flex w-max items-center"
          style={{ paddingInlineStart: startInset, paddingInlineEnd: endInset }}
        >
          {children}
        </span>
      </div>
      <EdgeFade side="start" shown={edges.start} solid={startInset} />
      <EdgeFade side="end" shown={edges.end} solid={endInset} />
    </div>
  );
}
