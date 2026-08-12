import { useState } from 'react';
import licenses from '@/assets/licenses.json';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from '@/components/ui/modal';
import LicenseItem from '@/components/settings/license-item';

interface LicensesModalProps {
  open: boolean;
  onClose: () => void;
}

function LicensesModal({ open, onClose }: LicensesModalProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} width={560} onAfterClose={() => setExpanded(null)}>
      <ModalHeader
        title="Open source licenses"
        subtitle={`Nex ships ${licenses.length} open source packages.`}
      />

      <ModalBody>
        <div className="flex flex-col">
          {licenses.map((entry) => (
            <LicenseItem
              key={entry.name}
              name={entry.name}
              version={entry.version}
              license={entry.license}
              text={entry.text}
              expanded={expanded === entry.name}
              onToggle={() => setExpanded(expanded === entry.name ? null : entry.name)}
            />
          ))}
        </div>
      </ModalBody>

      <ModalFooter>
        <ModalButton variant="outline" onClick={onClose}>
          Close
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default LicensesModal;
