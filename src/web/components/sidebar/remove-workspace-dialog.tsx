import { FolderGit2, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { ModalCard, ModalConsequence, StatusIcon } from "@/components/primitives/modal-card";

export interface RemoveWorkspaceSummary {
  name: string;
  projects: number;
  tasks: number;
}

const count = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

export function RemoveWorkspaceDialog({
  workspace,
  removing = false,
  onCancel,
  onRemove,
}: {
  workspace: RemoveWorkspaceSummary;
  removing?: boolean;
  onCancel?: () => void;
  onRemove?: () => void;
}) {
  return (
    <ModalCard
      title={`Remove ${workspace.name}?`}
      description="Nex forgets the workspace and its projects. Their folders stay on your Mac."
      icon={<StatusIcon tone="red" icon={Trash2} />}
      onClose={onCancel}
      footer={
        <>
          <span className="ml-auto" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" disabled={removing} onClick={onRemove}>
            {removing ? "Removing…" : "Remove workspace"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col">
        <ModalConsequence
          icon={FolderGit2}
          title="Projects"
          detail={
            workspace.projects > 0
              ? `${count(workspace.projects, "project", "projects")}, folders untouched`
              : "No projects"
          }
          outcome={workspace.projects > 0 ? "Removed from Nex" : "Nothing to remove"}
        />
        <ModalConsequence
          icon={ListChecks}
          title="Tasks"
          detail={
            workspace.tasks > 0
              ? `${count(workspace.tasks, "open task", "open tasks")} and their terminals`
              : "No open tasks"
          }
          outcome={workspace.tasks > 0 ? "Closed" : "Nothing to close"}
          warn={workspace.tasks > 0}
        />
      </div>
    </ModalCard>
  );
}
