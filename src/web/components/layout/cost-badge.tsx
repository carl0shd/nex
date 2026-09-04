import { CircleDollarSign } from 'lucide-react';
import { formatCompactUsd } from '@/lib/usage-format';
import { cn } from '@/lib/utils';

interface CostBadgeProps extends React.ComponentProps<'button'> {
  amount: number;
}

function CostBadge({ amount, className, ...props }: CostBadgeProps): React.JSX.Element {
  return (
    <button
      type="button"
      title="Cost today"
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent/40 px-2 py-0.5 text-[11px] font-medium text-text-secondary/70 select-none hover:bg-accent hover:text-text-secondary',
        className
      )}
      {...props}
    >
      <CircleDollarSign size={11} className="shrink-0" strokeWidth={1.75} />
      <span className="tabular-nums">{formatCompactUsd(amount)}</span>
    </button>
  );
}

export default CostBadge;
