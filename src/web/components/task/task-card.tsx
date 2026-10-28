import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TaskCard({
  state = "focused",
  className,
  children,
}: {
  state?: "focused" | "waiting" | "rest";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative flex h-[788px] w-[600px] flex-col overflow-hidden rounded-card bg-surface",
        state === "focused" && "shadow-task-focused",
        state === "waiting" && "shadow-task-waiting",
        state === "rest" && "shadow-task",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Conversation({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden px-[18px] pt-4 pb-2.5 [mask-image:linear-gradient(to_bottom,transparent_0,black_48px)]">
      {children}
    </div>
  );
}
