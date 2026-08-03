import type { ChangeTypes } from '@pierre/diffs/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const STATUS: Record<ChangeTypes, { label: string; variant: BadgeVariant }> = {
  new: { label: 'added', variant: 'success' },
  deleted: { label: 'deleted', variant: 'destructive' },
  change: { label: 'modified', variant: 'info' },
  'rename-pure': { label: 'renamed', variant: 'warning' },
  'rename-changed': { label: 'renamed', variant: 'warning' }
};

interface DiffStatusBadgeProps {
  type: ChangeTypes;
  className?: string;
}

function DiffStatusBadge({ type, className }: DiffStatusBadgeProps): React.JSX.Element {
  const { label, variant } = STATUS[type];

  return (
    <Badge variant={variant} size="sm" className={cn('rounded-md font-mono lowercase', className)}>
      {label}
    </Badge>
  );
}

export default DiffStatusBadge;
