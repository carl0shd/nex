import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TerminalFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-2 mb-2 flex min-h-0 flex-1 rounded-panel bg-page px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
