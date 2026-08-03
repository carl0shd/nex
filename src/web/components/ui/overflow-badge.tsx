import { Button } from '@/components/ui/button';

interface OverflowBadgeProps {
  count: number;
  onClick?: () => void;
}

function OverflowBadge({ count, onClick }: OverflowBadgeProps): React.JSX.Element {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="rounded px-1.5 py-0.75 font-mono text-[10px] hover:bg-bg-hover"
    >
      +{count}
    </Button>
  );
}

export default OverflowBadge;
