import type { ReactNode } from "react";

export function SessionStrip({ children, summary }: { children: ReactNode; summary?: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-line px-3">
      {children}
      {summary && <span className="ml-auto text-2xs text-ink-4 tabular-nums">{summary}</span>}
    </div>
  );
}
