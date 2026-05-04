import { memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import WorkspaceBadge from '@/components/ui/workspace-badge';

interface TaskGroupHeaderProps {
  id: string;
  name: string;
  color: string;
  icon?: string;
  customImage?: string | null;
  collapsed?: boolean;
  onToggle?: (id: string) => void;
}

function TaskGroupHeader({
  id,
  name,
  color,
  icon,
  customImage,
  collapsed = false,
  onToggle
}: TaskGroupHeaderProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={() => onToggle?.(id)}
      className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 select-none"
    >
      <Chevron size={12} className="text-text-muted" />
      <WorkspaceBadge
        name={name}
        color={color}
        icon={icon}
        customImage={customImage}
        size={14}
        fontSize={7}
        rounded="rounded-sm"
      />
      <span className="truncate text-[12px] font-semibold text-text-secondary">{name}</span>
    </button>
  );
}

export default memo(TaskGroupHeader);
