import { Expand, GitBranch, MoreHoriz } from "iconoir-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusPill } from "@/components/atoms/status-pill";

export type TaskStatus = "working" | "waiting" | "idle";

const PILL = {
  working: { tone: "green", label: "Working" },
  waiting: { tone: "orange", label: "Needs you" },
  idle: { tone: "neutral", label: "Idle" },
} as const;

export function TaskHeader({
  title,
  project,
  branch,
  workspace,
  status,
}: {
  title: string;
  project: string;
  branch: string;
  workspace: { name: string; color: string };
  status: TaskStatus;
}) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line-soft pr-2 pl-4">
      <Monogram size="md" color={workspace.color}>
        {workspace.name[0]}
      </Monogram>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-base font-medium text-ink">{title}</span>
        <span className="flex items-center gap-[5px] text-2xs whitespace-nowrap text-ink-4">
          {project}
          <span className="text-ink-6">/</span>
          <GitBranch width={11} height={11} strokeWidth={2.25} />
          <span className="font-mono">{branch}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        <StatusPill tone={PILL[status].tone}>{PILL[status].label}</StatusPill>
        <span className="w-1.5" />
        <IconButton aria-label="Open in focus">
          <Expand width={14} height={14} strokeWidth={2} />
        </IconButton>
        <IconButton aria-label="More actions">
          <MoreHoriz width={15} height={15} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}
