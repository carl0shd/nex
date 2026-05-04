import { useState } from 'react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import { useSessionStore } from '@/stores/session.store';

interface CloseSessionModalProps {
  open: boolean;
  sessionId: string;
  onClose: () => void;
}

function CloseSessionModal({
  open,
  sessionId,
  onClose
}: CloseSessionModalProps): React.JSX.Element {
  const session = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId));
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const [closing, setClosing] = useState(false);

  const handleClose = (): void => {
    if (closing) return;
    setClosing(true);
    onClose();
  };

  const handleAfterClose = (): void => {
    if (closing) {
      deleteSession(sessionId);
      setClosing(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={400} onAfterClose={handleAfterClose}>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">Close task?</h2>
        <p className="text-[13px] leading-[1.4] text-text-secondary">
          This action cannot be undone. Closing the task &quot;{session?.name}&quot; will
          permanently remove its worktree, notes and progress.
        </p>
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton variant="destructive" onClick={handleClose} disabled={closing}>
          close task
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default CloseSessionModal;
