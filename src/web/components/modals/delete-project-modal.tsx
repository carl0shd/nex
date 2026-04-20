import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSessionStore } from '@/stores/session.store';

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
  const sessions = useSessionStore((s) => s.sessions);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const [deleting, setDeleting] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const projectSessions = sessions.filter(
    (s) => s.projectId === projectId && s.status === 'active'
  );

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

      {projectSessions.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border-soft p-3">
          <span className="text-[9px] font-semibold text-destructive-text">
            {'// the following will be deleted'}
          </span>
          {projectSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <GitBranch size={12} className="shrink-0 text-text-muted" />
              <span className="text-[11px] text-text-secondary">{s.name}</span>
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
