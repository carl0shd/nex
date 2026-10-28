import { Code, GitBranch, MoreHoriz, SidebarExpand } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusPill } from "@/components/atoms/status-pill";
import type { TaskStatus } from "@/components/task/task-header";

const PILL = {
  working: { tone: "green", label: "Working" },
  waiting: { tone: "orange", label: "Needs you" },
  idle: { tone: "neutral", label: "Idle" },
} as const;

export function TaskViewHeader({
  title,
  status,
  project,
  branch,
  base,
  dockOpen,
  onToggleDock,
  onOpenInIde,
}: {
  title: string;
  status: TaskStatus;
  project: string;
  branch: string;
  base: string;
  dockOpen: boolean;
  onToggleDock?: () => void;
  onOpenInIde?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line pr-2.5 pl-[18px]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="m-0 truncate text-md font-medium text-ink">{title}</h1>
          <StatusPill tone={PILL[status].tone} className="h-5 px-2">
            {PILL[status].label}
          </StatusPill>
        </div>
        <span className="flex items-center gap-[5px] text-2xs whitespace-nowrap text-ink-4">
          {project}
          <span className="text-ink-6">/</span>
          <GitBranch width={11} height={11} strokeWidth={2.25} />
          <span className="font-mono">{branch}</span>
          <span>← {base}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" onClick={onOpenInIde}>
          <Code width={13} height={13} strokeWidth={2} />
          Open in IDE
        </Button>
        <IconButton aria-label="Panel" pressed={dockOpen} onClick={onToggleDock}>
          <SidebarExpand width={14} height={14} strokeWidth={2} />
        </IconButton>
        <IconButton aria-label="More actions">
          <MoreHoriz width={15} height={15} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}
