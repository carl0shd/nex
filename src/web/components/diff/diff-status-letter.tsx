import type { ChangedFile } from '@/lib/session-view';
import { cn } from '@/lib/utils';

const STATUS: Record<ChangedFile['status'], { letter: string; className: string }> = {
  modified: { letter: 'M', className: 'text-badge-warning-text' },
  added: { letter: 'A', className: 'text-badge-success-text' },
  deleted: { letter: 'D', className: 'text-destructive-text' },
  renamed: { letter: 'R', className: 'text-badge-warning-text' }
};

interface DiffStatusLetterProps {
  status: ChangedFile['status'];
  className?: string;
}

function DiffStatusLetter({ status, className }: DiffStatusLetterProps): React.JSX.Element {
  const { letter, className: tone } = STATUS[status];

  return (
    <span
      className={cn('w-3 shrink-0 text-center font-mono text-[9px] font-semibold', tone, className)}
    >
      {letter}
    </span>
  );
}

export default DiffStatusLetter;
