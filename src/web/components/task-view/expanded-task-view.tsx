import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ExpandedTaskView({
  header,
  strip,
  chat,
  dock,
  dockOpen,
  dockExpanded,
  className,
}: {
  header: ReactNode;
  strip: ReactNode;
  chat: ReactNode;
  dock: ReactNode;
  dockOpen: boolean;
  dockExpanded: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="Task"
      className={cn(
        "relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel bg-surface shadow-card",
        className,
      )}
    >
      {header}
      {strip}
      <div className="flex min-h-0 flex-1">
        {!(dockOpen && dockExpanded) && <div className="flex min-w-0 flex-1 flex-col">{chat}</div>}
        {dockOpen && (
          <div
            className={cn(
              "flex min-h-0 flex-col",
              dockExpanded ? "flex-1" : "w-[500px] shrink-0 border-l border-line",
            )}
          >
            {dock}
          </div>
        )}
      </div>
    </section>
  );
}

export function TaskChat({ children, composer }: { children: ReactNode; composer: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center">
      <div className="flex min-h-0 w-full max-w-[580px] flex-1 flex-col justify-end gap-3 overflow-hidden px-[18px] pt-4 pb-3 [mask-image:linear-gradient(to_bottom,transparent_0,black_48px)]">
        {children}
      </div>
      <div className="w-full max-w-[580px] pb-1">{composer}</div>
    </div>
  );
}
