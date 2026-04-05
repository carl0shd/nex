import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import { Plus, Ellipsis } from 'lucide-react';

interface Project {
  name: string;
}

interface WorkspaceItemProps {
  name: string;
  color: string;
  icon?: string;
  customImage?: string | null;
  count: number;
  projects?: Project[];
  collapsed?: boolean;
  active?: boolean;
  onToggle?: () => void;
  onAddProject?: () => void;
}

function WorkspaceItem({
  name,
  color,
  icon,
  customImage,
  count,
  projects = [],
  collapsed = false,
  active = true,
  onToggle,
  onAddProject
}: WorkspaceItemProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  const muted = !active;

  return (
    <div className="flex flex-col gap-0.5">
      <div
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded px-1.5 py-1.25 select-none"
      >
        <Chevron size={12} className="text-text-muted" />
        <WorkspaceBadge name={name} color={color} icon={icon} customImage={customImage} />
        <span className={`text-[12px] font-semibold ${muted ? 'text-text-muted' : 'text-text'}`}>
          {name}
        </span>
        <span className={`text-[12px] ${muted ? 'text-text-muted/50' : 'text-text-muted'}`}>
          {count}
        </span>
        <span className="flex-1" />
        <IconButton
          icon={Plus}
          size={13}
          onClick={(e) => {
            e.stopPropagation();
            onAddProject?.();
          }}
          className={muted ? 'opacity-40' : ''}
        />
        <IconButton
          icon={Ellipsis}
          size={14}
          onClick={(e) => e.stopPropagation()}
          className={muted ? 'opacity-40' : ''}
        />
      </div>

      {!collapsed && projects.length > 0 && (
        <div className="flex flex-col gap-px pl-4.5">
          {projects.map((project) => (
            <button
              key={project.name}
              className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left select-none hover:bg-bg-mute/50"
            >
              <Folder size={13} className="shrink-0 text-text-muted" />
              <span className="truncate text-[12px] text-text-secondary">{project.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkspaceItem;
