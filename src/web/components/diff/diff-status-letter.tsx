import type { ChangedFile } from '@/lib/session-view';
import { cn } from '@/lib/utils';

const STATUS: Record<ChangedFile['status'], { letter: string; className: string }> = {
  modified: { letter: 'M', className: 'text-orange' },
  added: { letter: 'A', className: 'text-green' },
  deleted: { letter: 'D', className: 'text-red' },
  renamed: { letter: 'R', className: 'text-orange' }
};

interface DiffStatusLetterProps {
  status: ChangedFile['status'];
  className?: string;
}

function DiffStatusLetter({ status, className }: DiffStatusLetterProps): React.JSX.Element {
  const { letter, className: tone } = STATUS[status];

  return (
    <span
      className={cn('w-3 shrink-0 text-center font-mono text-3xs font-semibold', tone, className)}
    >
      {letter}
    </span>
  );
}

export default DiffStatusLetter;
