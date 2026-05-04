import { memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProjectLabelProps {
  id: string;
  name: string;
  collapsed?: boolean;
  onToggle?: (id: string) => void;
}

function ProjectLabel({
  id,
  name,
  collapsed = false,
  onToggle
}: ProjectLabelProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={() => onToggle?.(id)}
      className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 select-none"
    >
      <Chevron size={12} className="text-text-muted" />
      <span className="truncate text-[12px] font-medium text-text-muted">{name}</span>
    </button>
  );
}

export default memo(ProjectLabel);
