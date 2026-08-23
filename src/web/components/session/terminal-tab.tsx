import { X } from 'lucide-react';
import type { TerminalStatus } from '@native/db/types';
import StatusDot from '@/components/ui/status-dot';
import { cn } from '@/lib/utils';

interface TerminalTabProps {
  name: string;
  status: TerminalStatus | null;
  active?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

function TerminalTab({
  name,
  status,
  active = false,
  dragging = false,
  onClick,
  onClose
}: TerminalTabProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[5px] border px-2 py-1 select-none',
        active
          ? 'border-border bg-bg-hover text-text'
          : 'border-border-soft text-text-secondary hover:border-border hover:text-text',
        dragging ? 'cursor-grabbing bg-bg-hover shadow-lg' : 'cursor-pointer'
      )}
    >
      {status && <StatusDot status={status} />}
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
