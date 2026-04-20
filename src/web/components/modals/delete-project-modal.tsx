import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';

interface DeleteProjectModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

function DeleteProjectModal({
  open,
  projectId,
  onClose
}: DeleteProjectModalProps): React.JSX.Element {
  const projects = useWorkspaceStore((s) => s.projects);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const [deleting, setDeleting] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const projectWorktrees = worktrees.filter((wt) => wt.projectId === projectId);

  const handleDelete = (): void => {
    if (deleting) return;
    setDeleting(true);
    onClose();
  };

  const handleAfterClose = (): void => {
    if (deleting) {
      deleteProject(projectId);
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={400} onAfterClose={handleAfterClose}>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">Delete project?</h2>
        <p className="text-[13px] leading-[1.4] text-text-secondary">
          This action cannot be undone. Deleting the project &quot;{project?.name}&quot; will
          permanently remove all associated tasks.
        </p>
      </div>

      {projectWorktrees.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border-soft p-3">
          <span className="text-[9px] font-semibold text-destructive-text">
            {'// the following will be deleted'}
          </span>
          {projectWorktrees.map((wt) => (
            <div key={wt.id} className="flex items-center gap-2">
              <GitBranch size={12} className="shrink-0 text-text-muted" />
              <span className="text-[11px] text-text-secondary">{wt.branch}</span>
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
          delete project
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default DeleteProjectModal;
