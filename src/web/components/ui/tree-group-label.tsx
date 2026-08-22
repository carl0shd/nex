import { memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeGroupLabelProps {
  id: string;
  name: string;
  collapsed?: boolean;
  onToggle?: (id: string) => void;
  className?: string;
}

function TreeGroupLabel({
  id,
  name,
  collapsed = false,
  onToggle,
  className
}: TreeGroupLabelProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={() => onToggle?.(id)}
      title={name}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-left select-none',
        className
      )}
    >
      <Chevron size={12} className="shrink-0 text-text-muted" />
      <span className="truncate text-[12px] font-medium text-text-muted">{name}</span>
    </button>
  );
}

export default memo(TreeGroupLabel);
