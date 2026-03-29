import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProjectLabelProps {
  name: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

function ProjectLabel({ name, collapsed = false, onToggle }: ProjectLabelProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 select-none"
    >
      <Chevron size={12} className="text-text-muted" />
      <span className="text-[12px] font-medium text-text-muted">{name}</span>
    </button>
  );
}

export default ProjectLabel;
