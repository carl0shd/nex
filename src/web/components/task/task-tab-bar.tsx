import type { ReactNode } from "react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { StatusDot } from "@/components/atoms/status-dot";
import { Tabs } from "@/components/atoms/tabs";
import { cn } from "@/lib/utils";

export type TaskView = "agent" | "changes" | "notes" | "shell";

export function DiffStat({
  added,
  removed,
  zeros = true,
  className,
}: {
  added: number;
  removed: number;
  zeros?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-3xs whitespace-nowrap", className)}>
      {(zeros || added > 0) && <span className="text-green">+{added}</span>}
      {(zeros || removed > 0) && <span className="text-red"> −{removed}</span>}
    </span>
  );
}

export function TaskTabBar({
  view,
  onViewChange,
  agentWaiting = false,
  diff,
  trailing,
}: {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  agentWaiting?: boolean;
  diff: { added: number; removed: number };
  trailing?: ReactNode;
}) {
  return (
    <div className="flex h-[46px] shrink-0 items-center gap-2 border-b border-line-soft px-2.5">
      <Tabs
        value={view}
        onChange={onViewChange}
        items={[
          {
            value: "agent",
            label: (
              <>
                <ClaudeTile size={16} />
                Agent
                <StatusDot tone={agentWaiting ? "orange" : "green"} />
              </>
            ),
          },
          {
            value: "changes",
            label: (
              <>
                Changes <DiffStat {...diff} />
              </>
            ),
          },
          { value: "notes", label: "Notes" },
          { value: "shell", label: "Shell" },
        ]}
      />
      <div className="ml-auto flex items-center gap-2">{trailing}</div>
    </div>
  );
}
