import { FolderGit2, GitBranch, ListChecks } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { ModalCard, ModalConsequence, StatusIcon } from "@/components/primitives/modal-card";

export interface RemoveProjectSummary {
  name: string;
  workspace: string;
  tasks: number;
}

export function RemoveProjectDialog({
  project,
  removing = false,
  onCancel,
  onRemove,
}: {
  project: RemoveProjectSummary;
  removing?: boolean;
  onCancel?: () => void;
  onRemove?: () => void;
}) {
  return (
    <ModalCard
      title={`Remove ${project.name} from ${project.workspace}?`}
      description="Nex forgets the project. The folder and its git history stay on your Mac."
      icon={<StatusIcon tone="red" icon={FolderGit2} />}
      onClose={onCancel}
      footer={
        <>
          <span className="ml-auto" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" disabled={removing} onClick={onRemove}>
            {removing ? "Removing…" : "Remove project"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col">
        <ModalConsequence
          icon={ListChecks}
          title="Tasks"
          detail={
            project.tasks > 0
              ? `${project.tasks} open ${project.tasks === 1 ? "task" : "tasks"} and their terminals`
              : "No open tasks"
          }
          outcome={project.tasks > 0 ? "Closed" : "Nothing to close"}
          warn={project.tasks > 0}
        />
        <ModalConsequence
          icon={GitBranch}
          title="Branches and worktrees"
          detail="Task branches and the .worktrees folder stay in the repo"
          outcome="Kept"
        />
      </div>
    </ModalCard>
  );
}
