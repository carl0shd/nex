import { useEffect, useRef, useState, type ReactNode } from "react";
import { STRIP_CARD_MAX, STRIP_PEEK_PX } from "@/lib/agent-strip";
import { cn } from "@/lib/utils";

export interface StripItem {
  id: string;
  name: string;
  waiting?: boolean;
  card: ReactNode;
}

export function StripSummary({
  working,
  waiting,
  idle,
}: {
  working: number;
  waiting: number;
  idle: number;
}) {
  return (
    <span className="text-xs text-ink-3">
      <span className="text-green">{working} working</span>
      {waiting > 0 && (
        <>
          {" · "}
          <span className="text-orange">{waiting} needs you</span>
        </>
      )}
      {idle > 0 && ` · ${idle} idle`}
    </span>
  );
}

function ScrollMap({
  items,
  visible,
  onJump,
}: {
  items: readonly StripItem[];
  visible: ReadonlySet<string>;
  onJump: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Scroll position"
      className="absolute bottom-1 left-1/2 flex h-5 w-[360px] -translate-x-1/2 gap-[3px]"
    >
      {items.map((item) => {
        const shown = visible.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            title={item.name}
            aria-label={`Show ${item.name}`}
            onClick={() => onJump(item.id)}
            className="group/segment flex flex-1 cursor-pointer items-center"
          >
            <span
              className={cn(
                "interactive h-1 w-full rounded-full",
                item.waiting
                  ? shown
                    ? "bg-orange/75"
                    : "bg-orange/40 group-hover/segment:bg-orange/60"
                  : shown
                    ? "bg-ink/35"
                    : "bg-ink/10 group-hover/segment:bg-ink/20",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}

export function AgentStrip({
  items,
  summary,
  initialId,
  trailing,
  onSelect,
}: {
  items: readonly StripItem[];
  summary: ReactNode;
  initialId?: string;
  trailing?: ReactNode;
  onSelect?: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(() =>
      scroller.style.setProperty(STRIP_CARD_MAX, `${scroller.clientWidth - STRIP_PEEK_PX * 2}px`),
    );
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) =>
        setVisible((previous) => {
          const next = new Set(previous);
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.stripId ?? "";
            if (entry.isIntersecting) next.add(id);
            else next.delete(id);
          }
          return next;
        }),
      { root: scroller, threshold: 0.6 },
    );
    scroller.querySelectorAll("[data-strip-id]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  const jump = (id: string, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector<HTMLElement>(`[data-strip-id="${id}"]`);
    if (!scroller || !card) return;
    const left = card.offsetLeft - scroller.offsetLeft;
    const visible =
      left >= scroller.scrollLeft &&
      left + card.offsetWidth <= scroller.scrollLeft + scroller.clientWidth;
    if (!visible) scroller.scrollTo({ left: left - STRIP_PEEK_PX, behavior });
  };

  const jumpedRef = useRef(false);
  useEffect(() => {
    if (!initialId) return;
    jump(initialId, jumpedRef.current ? "smooth" : "instant");
    jumpedRef.current = true;
  }, [initialId]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2.5 px-3">{summary}</div>
      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 scroll-px-[62px] gap-2.5 overflow-x-auto overflow-y-hidden pr-[62px] pl-3 pt-1 pb-8 no-scrollbar"
      >
        {items.map((item) => (
          <div key={item.id} data-strip-id={item.id} className="flex h-full shrink-0">
            {item.card}
          </div>
        ))}
        {trailing && <div className="flex h-full shrink-0">{trailing}</div>}
      </div>
      <ScrollMap
        items={items}
        visible={visible}
        onJump={(id) => {
          jump(id);
          onSelect?.(id);
        }}
      />
    </div>
  );
}
