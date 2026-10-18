import { Button } from "@/components/ui/button";

interface OverflowBadgeProps {
  count: number;
  onClick?: () => void;
}

function OverflowBadge({ count, onClick }: OverflowBadgeProps): React.JSX.Element {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="h-5 px-1.5 font-mono text-3xs">
      +{count}
    </Button>
  );
}

export default OverflowBadge;
