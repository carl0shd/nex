import { CircleDollarSign } from 'lucide-react';

interface CostBadgeProps {
  amount: number;
}

function CostBadge({ amount }: CostBadgeProps): React.JSX.Element {
  return (
    <span className="inline-flex select-none items-center gap-1.5 rounded-full bg-accent/40 px-2 py-0.5 text-[11px] font-medium text-text-secondary/70">
      <CircleDollarSign size={11} className="shrink-0" strokeWidth={1.75} />${amount.toFixed(2)}
    </span>
  );
}

export default CostBadge;
