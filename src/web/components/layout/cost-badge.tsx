import { CircleDollarSign } from 'lucide-react';
import PillButton from '@/components/ui/pill-button';
import { formatCompactUsd } from '@/lib/usage-format';
import { cn } from '@/lib/utils';

interface CostBadgeProps extends React.ComponentProps<'button'> {
  amount: number;
}

function CostBadge({ amount, className, ...props }: CostBadgeProps): React.JSX.Element {
  return (
    <PillButton
      title="Cost today"
      className={cn('text-ink-2 hover:text-ink', className)}
      {...props}
    >
      <CircleDollarSign size={11} className="shrink-0" strokeWidth={1.75} />
      <span className="tabular-nums">{formatCompactUsd(amount)}</span>
    </PillButton>
  );
}

export default CostBadge;
