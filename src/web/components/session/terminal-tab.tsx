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
        'interactive group flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 whitespace-nowrap select-none',
        active
          ? 'bg-surface-raised text-ink shadow-btn'
          : 'text-ink-3 hover:bg-hover-2 hover:text-ink',
        dragging ? 'cursor-grabbing bg-surface-raised shadow-overlay' : 'cursor-pointer'
      )}
    >
      {status && <StatusDot status={status} />}
      <span className="text-xs font-medium">{name}</span>
      {active && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="interactive -mr-1 flex size-4 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-hover-2 hover:text-ink"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

export default TerminalTab;
