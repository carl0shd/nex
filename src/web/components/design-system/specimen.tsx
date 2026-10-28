import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={`ds-${id}`} className="flex scroll-mt-6 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        {description && <p className="m-0 text-sm text-ink-3">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function Specimen({
  name,
  children,
  className,
  bare = false,
}: {
  name: string;
  children: ReactNode;
  className?: string;
  bare?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-2xs text-ink-4">{name}</span>
      <div
        className={cn(
          bare ? "" : "rounded-panel bg-surface p-5 shadow-card",
          "flex flex-wrap items-center gap-3",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
