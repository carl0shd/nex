import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface Action {
  icon: LucideIcon;
  onClick?: () => void;
}

interface SectionHeaderProps {
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
  actions?: Action[];
}

const EMPTY_ACTIONS: Action[] = [];

function SectionHeader({
  title,
  collapsed = false,
  onToggle,
  actions = EMPTY_ACTIONS
}: SectionHeaderProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="flex w-full items-center gap-1 px-1">
      <button onClick={onToggle} className="flex cursor-pointer items-center gap-1 text-text-muted">
        <Chevron size={12} />
        <span className="select-none text-[10px] font-medium">{title}</span>
      </button>
      <div className="flex-1" />
      {actions.map((action, i) => (
        <IconButton key={i} icon={action.icon} size={13} onClick={action.onClick} />
      ))}
    </div>
  );
}

export default SectionHeader;
