import type { TerminalStatus } from '@native/db/types';
import { cn } from '@/lib/utils';

const STATUS_CLASS: Record<TerminalStatus, string> = {
  idle: 'bg-ink-4',
  running: 'bg-green shadow-[0_0_0_3px_color-mix(in_srgb,var(--green)_22%,transparent)]',
  waiting: 'animate-breathe bg-orange'
};

const STATUS_LABEL: Record<TerminalStatus, string> = {
  idle: 'Idle',
  running: 'Working',
  waiting: 'Waiting for input'
};

interface StatusDotProps {
  status: TerminalStatus;
  className?: string;
}

function StatusDot({ status, className }: StatusDotProps): React.JSX.Element {
  return (
    <span
      title={STATUS_LABEL[status]}
      className={cn('size-2 shrink-0 rounded-full', STATUS_CLASS[status], className)}
    />
  );
}

export default StatusDot;
