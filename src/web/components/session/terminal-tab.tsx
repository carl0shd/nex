import { X } from 'lucide-react';
import type { TerminalStatus } from '@native/db/types';
import StatusDot from '@/components/ui/status-dot';

interface TerminalTabProps {
  name: string;
  status: TerminalStatus;
  active?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

function TerminalTab({
  name,
  status,
  active = false,
  onClick,
  onClose
}: TerminalTabProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[5px] px-2 py-1 select-none ${
        active
          ? 'border border-border bg-bg-hover text-text'
          : 'border border-border-soft hover:border-border text-text-secondary hover:text-text'
      }`}
    >
      <StatusDot status={status} />
      <span className={`text-[11px] ${active ? 'font-medium' : 'font-normal'}`}>{name}</span>
      {active && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="cursor-pointer text-text-muted hover:text-text-secondary"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export default TerminalTab;
