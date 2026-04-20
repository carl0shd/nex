import {
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Ellipsis,
  Settings,
  Archive,
  Trash2,
  Pencil
} from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import ContextMenu from '@/components/ui/context-menu';
import type { Workspace } from '@native/db/types';

interface ProjectItem {
  name: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface WorkspaceItemProps {
  workspace: Workspace;
  projectCount: number;
  projects?: ProjectItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  onAddProject?: () => void;
  onSettings?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

function WorkspaceItem({
  workspace,
  projectCount,
  projects = [],
  collapsed = false,
  onToggle,
  onAddProject,
  onSettings,
  onArchive,
  onDelete
}: WorkspaceItemProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="flex flex-col gap-0.5">
      <div
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded px-1.5 py-1.25 select-none"
      >
        <Chevron size={12} className="shrink-0 text-text-muted" />
        <WorkspaceBadge
          name={workspace.name}
          color={workspace.color}
          icon={workspace.icon}
          customImage={workspace.customImage}
        />
        <span className="truncate text-[12px] font-semibold text-text">{workspace.name}</span>
        <span className="ml-0.5 text-[12px] text-text-muted">{projectCount}</span>
        <span className="flex-1" />
        <IconButton
          icon={Plus}
          size={13}
          onClick={(e) => {
            e.stopPropagation();
            onAddProject?.();
          }}
        />
        <ContextMenu
          trigger={<IconButton icon={Ellipsis} size={14} onClick={(e) => e.stopPropagation()} />}
          actions={[
            { label: 'Edit workspace', icon: Settings, onClick: () => onSettings?.() },
            { label: 'Archive workspace', icon: Archive, onClick: () => onArchive?.() },
            {
              label: 'Delete workspace',
              icon: Trash2,
              onClick: () => onDelete?.(),
              destructive: true
            }
          ]}
        />
      </div>

      {!collapsed && projects.length > 0 && (
        <div className="flex flex-col gap-px pl-4.5">
          {projects.map((project) => (
            <div
              key={project.name}
              className="group flex h-7.5 w-full items-center gap-2 rounded px-2 select-none hover:bg-bg-mute/50"
            >
              <Folder size={13} className="shrink-0 text-text-muted" />
              <span className="truncate text-[12px] text-text-secondary">{project.name}</span>
              <span className="flex-1" />
              <div className="opacity-0 group-hover:opacity-100">
                <ContextMenu
                  trigger={
                    <IconButton icon={Ellipsis} size={13} onClick={(e) => e.stopPropagation()} />
                  }
                  actions={[
                    {
                      label: 'Edit project',
                      icon: Pencil,
                      onClick: () => project.onEdit?.()
                    },
                    {
                      label: 'Delete project',
                      icon: Trash2,
                      onClick: () => project.onDelete?.(),
                      destructive: true
                    }
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkspaceItem;
