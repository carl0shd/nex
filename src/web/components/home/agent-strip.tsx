import { useEffect, useRef, useState, type ReactNode } from "react";
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
      className="absolute bottom-3 left-1/2 flex h-1 w-[360px] -translate-x-1/2 gap-[3px]"
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
            className={cn(
              "interactive flex-1 cursor-pointer rounded-full",
              item.waiting
                ? shown
                  ? "bg-orange/75"
                  : "bg-orange/40 hover:bg-orange/60"
                : shown
                  ? "bg-ink/35"
                  : "bg-ink/10 hover:bg-ink/20",
            )}
          />
        );
      })}
    </nav>
  );
}

export function AgentStrip({
  items,
  summary,
  initialId,
}: {
  items: readonly StripItem[];
  summary: ReactNode;
  initialId?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<ReadonlySet<string>>(new Set());

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

  const jump = (id: string, behavior: ScrollBehavior = "smooth") =>
    scrollerRef.current
      ?.querySelector(`[data-strip-id="${id}"]`)
      ?.scrollIntoView({ behavior, inline: "start", block: "nearest" });

  useEffect(() => {
    if (initialId) jump(initialId, "instant");
  }, [initialId]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2.5 px-3">{summary}</div>
      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 snap-x snap-mandatory scroll-px-[62px] gap-2.5 overflow-x-auto overflow-y-hidden px-[62px] pt-1 pb-8 [scrollbar-width:none]"
      >
        {items.map((item) => (
          <div key={item.id} data-strip-id={item.id} className="shrink-0 snap-start">
            {item.card}
          </div>
        ))}
      </div>
      <ScrollMap items={items} visible={visible} onJump={jump} />
    </div>
  );
}
