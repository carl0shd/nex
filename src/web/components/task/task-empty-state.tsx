import type { ReactNode } from "react";
import { ClaudeTile } from "@/components/atoms/agent-tile";

export function TaskEmptyState({
  branch,
  base,
  children,
}: {
  branch: string;
  base: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-[22px] text-center">
      <ClaudeTile size={36} className="rise-in" />
      <span className="rise-in text-lg font-semibold tracking-[-0.015em] text-ink [animation-delay:50ms]">
        What should Claude do?
      </span>
      <span className="rise-in text-xs text-ink-3 [animation-delay:100ms]">
        Working in <span className="text-ink-2">{branch}</span> · branched from {base}
      </span>
      {children}
    </div>
  );
}
