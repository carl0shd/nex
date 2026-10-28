import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OnboardingPanel({
  title,
  meta,
  footer,
  children,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "overflow-hidden rounded-sheet bg-surface shadow-[0_0_0_1px_var(--line),0_2px_4px_rgb(0_0_0/22%),0_24px_48px_-20px_rgb(0_0_0/60%)]",
        className,
      )}
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-line px-[18px] text-sm font-medium text-ink">
        {title}
        {meta && <span className="ml-auto text-2xs font-normal text-ink-4">{meta}</span>}
      </div>
      {children}
      {footer && (
        <div className="flex items-center gap-2 border-t border-line px-[18px] py-3 text-xs text-ink-3">
          {footer}
        </div>
      )}
    </aside>
  );
}
