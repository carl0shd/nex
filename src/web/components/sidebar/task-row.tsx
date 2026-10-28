import { Globe } from "iconoir-react";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";
import type { SidebarTask } from "@/components/sidebar/types";

const DOT = { running: "green", waiting: "orange", idle: "idle" } as const;

export function TaskRow({
  task,
  active = false,
  onClick,
}: {
  task: SidebarTask;
  active?: boolean;
  onClick?: () => void;
}) {
  const waiting = task.status === "waiting";
  return (
    <button
      type="button"
      onClick={onClick}
      data-menu-row
      className={cn(
        "interactive press-wide relative flex h-[30px] w-full cursor-pointer items-center gap-[9px] rounded-control px-2 text-left select-none",
        active ? "bg-surface shadow-tab" : waiting && "bg-orange-tint/70",
      )}
    >
      <StatusDot tone={DOT[task.status]} />
      <span
        className={cn(
          "truncate text-sm",
          active ? "text-ink" : task.status === "idle" ? "text-ink-3" : "text-ink-2",
        )}
      >
        {task.title}
      </span>
      {task.env === "starting" && <Orbit size="sm" className="ml-auto" />}
      {task.env === "down" && (
        <Globe width={12} height={12} strokeWidth={2} className="ml-auto shrink-0 text-red" />
      )}
      <span
        className={cn(
          "shrink-0 text-2xs",
          !task.env && "ml-auto",
          waiting ? "text-orange" : "text-ink-4",
        )}
      >
        {task.meta}
      </span>
    </button>
  );
}
