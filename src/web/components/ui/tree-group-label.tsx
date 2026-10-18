import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeGroupLabelProps {
  id: string;
  name: string;
  collapsed?: boolean;
  onToggle?: (id: string) => void;
  trailing?: React.ReactNode;
  className?: string;
}

function TreeGroupLabel({
  id,
  name,
  collapsed = false,
  onToggle,
  trailing,
  className
}: TreeGroupLabelProps): React.JSX.Element {
  return (
    <button
      data-glide-row
      onClick={() => onToggle?.(id)}
      title={name}
      className={cn(
        'interactive group relative flex h-7 cursor-pointer items-center gap-1.5 rounded-control px-1.5 text-left outline-none select-none',
        className
      )}
    >
      <ChevronDown
        size={12}
        className={cn(
          'shrink-0 text-ink-4 transition-transform duration-200 ease-out-strong group-hover:text-ink-3',
          collapsed && '-rotate-90'
        )}
      />
      <span className="truncate text-xs font-medium text-ink-3 group-hover:text-ink-2">{name}</span>
      {trailing}
    </button>
  );
}

export default memo(TreeGroupLabel);
