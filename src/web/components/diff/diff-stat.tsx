import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DiffStatProps {
  added: number;
  removed: number;
  size?: 'sm' | 'md';
  variant?: 'text' | 'badge';
  order?: 'added-first' | 'removed-first';
  className?: string;
}

function format(value: number): string {
  return value.toLocaleString('en-US');
}

function DiffStat({
  added,
  removed,
  size = 'sm',
  variant = 'text',
  order = 'added-first',
  className
}: DiffStatProps): React.JSX.Element {
  if (variant === 'badge') {
    const addedBadge = (
      <Badge variant="success" size={size} tone="soft">{`+${format(added)}`}</Badge>
    );
    const removedBadge = (
      <Badge variant="destructive" size={size} tone="soft">{`-${format(removed)}`}</Badge>
    );
    return (
      <span className={cn('flex shrink-0 items-center gap-1.5 font-mono', className)}>
        {order === 'removed-first' ? removedBadge : addedBadge}
        {order === 'removed-first' ? addedBadge : removedBadge}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 font-mono font-medium',
        size === 'md' ? 'text-[11px]' : 'text-[9px]',
        className
      )}
    >
      <span className="text-badge-success-text">+{format(added)}</span>
      <span className={removed > 0 ? 'text-badge-error-text' : 'text-text-muted'}>
        -{format(removed)}
      </span>
    </span>
  );
}

export default DiffStat;
