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
    <span className={cn("text-2xs tabular-nums whitespace-nowrap", className)}>
      {(zeros || added > 0) && <span className="text-green">+{added}</span>}
      {(zeros || removed > 0) && <span className="text-red"> −{removed}</span>}
    </span>
  );
}

export function TaskTabBar({
  view,
  onViewChange,
  agentWaiting = false,
  hasAgent = true,
  diff,
  trailing,
}: {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  agentWaiting?: boolean;
  hasAgent?: boolean;
  diff: { added: number; removed: number };
  trailing?: ReactNode;
}) {
  return (
    <div className="flex h-[46px] shrink-0 items-center gap-2 border-b border-line-soft px-2.5">
      <Tabs
        value={view}
        onChange={onViewChange}
        items={[
          hasAgent
            ? {
                value: "agent" as const,
                label: (
                  <>
                    <ClaudeTile size={16} />
                    Agent
                    <StatusDot tone={agentWaiting ? "orange" : "green"} />
                  </>
                ),
              }
            : { value: "shell" as const, label: "Shell" },
          {
            value: "changes" as const,
            label: (
              <>
                Changes <DiffStat {...diff} />
              </>
            ),
          },
          { value: "notes" as const, label: "Notes" },
          ...(hasAgent ? [{ value: "shell" as const, label: "Shell" }] : []),
        ]}
      />
      <div className="ml-auto flex items-center gap-2">{trailing}</div>
    </div>
  );
}
