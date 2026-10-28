import type { ComponentType } from "react";
import { Database, GitBranch, Globe, Trash } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { ModalCard, StatusIcon } from "@/components/primitives/modal-card";
import { cn } from "@/lib/utils";

type ItemIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export interface CloseTaskSummary {
  title: string;
  branch: string;
  uncommitted: number;
  environment?: { size: string; address: string };
}

function Consequence({
  icon: Icon,
  title,
  detail,
  outcome,
  warn = false,
}: {
  icon: ItemIcon;
  title: string;
  detail: string;
  outcome: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-hover text-ink-3">
        <Icon width={13} height={13} strokeWidth={2} />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-3">{detail}</span>
      </span>
      <span className={cn("text-2xs", warn ? "text-orange" : "text-ink-4")}>{outcome}</span>
    </div>
  );
}

export function CloseTaskDialog({
  task,
  onCommitFirst,
  onCancel,
  onClose,
}: {
  task: CloseTaskSummary;
  onCommitFirst?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}) {
  return (
    <ModalCard
      title={`Close ${task.title}?`}
      description={`The branch ${task.branch} stays in git.`}
      icon={<StatusIcon tone="red" icon={Trash} />}
      onClose={onCancel}
      footer={
        <>
          {task.uncommitted > 0 && (
            <Button variant="quiet" size="sm" onClick={onCommitFirst}>
              Commit first
            </Button>
          )}
          <span className="ml-auto" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onClose}>
            Close task
          </Button>
        </>
      }
    >
      <div className="flex flex-col">
        <Consequence
          icon={GitBranch}
          title="Worktree"
          detail={
            task.uncommitted > 0
              ? `${task.uncommitted} files not committed yet`
              : "Everything is committed"
          }
          outcome={task.uncommitted > 0 ? "Will be lost" : "Removed"}
          warn={task.uncommitted > 0}
        />
        {task.environment && (
          <>
            <Consequence
              icon={Database}
              title="Environment data"
              detail={`Its database copy and uploads · ${task.environment.size}`}
              outcome="Deleted"
            />
            <Consequence
              icon={Globe}
              title={task.environment.address}
              detail="Stops answering"
              outcome="Released"
            />
          </>
        )}
      </div>
    </ModalCard>
  );
}
