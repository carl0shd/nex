import { useState } from 'react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';

interface DiscardFileModalProps {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DiscardFileModal({
  open,
  fileName,
  onClose,
  onConfirm
}: DiscardFileModalProps): React.JSX.Element {
  const [discarding, setDiscarding] = useState(false);

  const handleDiscard = (): void => {
    if (discarding) return;
    setDiscarding(true);
    onClose();
  };

  const handleAfterClose = (): void => {
    if (!discarding) return;
    onConfirm();
    setDiscarding(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={400} onAfterClose={handleAfterClose}>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">Discard changes?</h2>
        <p className="text-[13px] leading-[1.4] text-text-secondary">
          This restores the file to its last commit and cannot be undone. Commits already made in
          this worktree are kept.
        </p>
      </div>

      <div className="rounded-md border border-border-soft p-3">
        <span className="font-mono text-[11px] break-all text-text-secondary">{fileName}</span>
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="outline" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton variant="destructive" onClick={handleDiscard} disabled={discarding}>
          discard changes
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default DiscardFileModal;
