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
  /** Trailing slot, typically a count badge. */
  badge?: React.ReactNode;
}

const EMPTY_ACTIONS: Action[] = [];

function SectionHeader({
  title,
  collapsed = false,
  onToggle,
  actions = EMPTY_ACTIONS,
  badge
}: SectionHeaderProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="flex w-full items-center gap-1 px-1">
      <button
        onClick={onToggle}
        disabled={!onToggle}
        className="flex items-center gap-1 text-text-muted enabled:cursor-pointer"
      >
        {onToggle && <Chevron size={12} />}
        <span className="select-none text-[13px] font-medium">{title}</span>
      </button>
      <div className="flex-1" />
      {actions.map((action, i) => (
        <IconButton key={i} icon={action.icon} size={13} onClick={action.onClick} />
      ))}
      {badge}
    </div>
  );
}

export default SectionHeader;
