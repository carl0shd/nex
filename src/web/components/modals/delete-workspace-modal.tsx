import { useState } from 'react';
import { Folder } from 'lucide-react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';

interface DeleteWorkspaceModalProps {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
}

function DeleteWorkspaceModal({
  open,
  workspaceId,
  onClose
}: DeleteWorkspaceModalProps): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const [deleting, setDeleting] = useState(false);

  const workspace = workspaces.find((ws) => ws.id === workspaceId);
  const wsProjects = projects.filter((p) => p.workspaceId === workspaceId);

  const projectsWithTaskCount = wsProjects.map((p) => ({
    name: p.name,
    taskCount: worktrees.filter((wt) => wt.projectId === p.id).length
  }));

  const handleDelete = (): void => {
    if (deleting) return;
    setDeleting(true);
    onClose();
  };

  const handleAfterClose = (): void => {
    if (deleting) {
      deleteWorkspace(workspaceId);
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={400} onAfterClose={handleAfterClose}>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">Delete workspace?</h2>
        <p className="text-[13px] leading-[1.4] text-text-secondary">
          This action cannot be undone. Deleting the workspace &quot;{workspace?.name}&quot; will
          permanently remove all associated projects and their tasks.
        </p>
      </div>

      {projectsWithTaskCount.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border-soft p-3">
          <span className="text-[9px] font-semibold text-destructive-text">
            {'// the following will be deleted'}
          </span>
          {projectsWithTaskCount.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <Folder size={12} className="shrink-0 text-text-muted" />
              <span className="text-[11px] text-text-secondary">{p.name}</span>
              <span className="flex-1" />
              <span className="text-[9px] font-medium text-text-muted">
                {p.taskCount} {p.taskCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          ))}
        </div>
      )}

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton variant="destructive" onClick={handleDelete} disabled={deleting}>
          delete workspace
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default DeleteWorkspaceModal;
