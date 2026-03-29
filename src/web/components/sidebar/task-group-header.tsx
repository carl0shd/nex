import { ChevronDown, ChevronRight } from 'lucide-react';

interface TaskGroupHeaderProps {
  name: string;
  color: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

function TaskGroupHeader({
  name,
  color,
  collapsed = false,
  onToggle
}: TaskGroupHeaderProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 select-none"
    >
      <Chevron size={12} className="text-text-muted" />
      <span
        className="flex size-3.5 items-center justify-center rounded-sm text-[7px] font-bold text-text"
        style={{ backgroundColor: color }}
      >
        {name[0].toUpperCase()}
      </span>
      <span className="text-[12px] font-semibold text-text-secondary">{name}</span>
    </button>
  );
}

export default TaskGroupHeader;
