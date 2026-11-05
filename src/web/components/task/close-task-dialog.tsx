import { Database, GitBranch, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { ModalCard, ModalConsequence, StatusIcon } from "@/components/primitives/modal-card";

export interface CloseTaskSummary {
  title: string;
  branch: string;
  uncommitted: number;
  environment?: { size: string; address: string };
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
      icon={<StatusIcon tone="red" icon={Trash2} />}
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
        <ModalConsequence
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
            <ModalConsequence
              icon={Database}
              title="Environment data"
              detail={`Its database copy and uploads · ${task.environment.size}`}
              outcome="Deleted"
            />
            <ModalConsequence
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
