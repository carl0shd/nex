import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

const GHOSTS: { tone: DotTone; lines: string[]; focused?: boolean }[] = [
  { tone: "idle", lines: ["w-10", "w-12", "w-8"] },
  { tone: "green", lines: ["w-14", "w-11", "w-[52px]", "w-9"], focused: true },
  { tone: "orange", lines: ["w-9", "w-12", "w-10"] },
];

export function StripGlyph({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-2", className)}>
      {GHOSTS.map((ghost, index) => (
        <span
          key={index}
          className={cn(
            "flex w-[84px] flex-col gap-1.5 rounded-control p-2.5",
            ghost.focused ? "h-28 bg-surface-raised shadow-raised" : "h-24 bg-hover opacity-60",
          )}
        >
          <span className="mb-1 flex items-center gap-1.5">
            <StatusDot tone={ghost.tone} size={5} />
            <span className="h-1 w-8 rounded-full bg-ink-5" />
          </span>
          {ghost.lines.map((width) => (
            <span key={width} className={cn("h-1 rounded-full bg-line-strong", width)} />
          ))}
        </span>
      ))}
    </div>
  );
}
