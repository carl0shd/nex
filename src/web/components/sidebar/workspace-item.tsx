import { memo } from 'react';
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
import type { Workspace, Project } from '@native/db/types';

interface WorkspaceItemProps {
  workspace: Workspace;
  projects?: Project[];
  collapsed?: boolean;
  onToggle?: (id: string) => void;
  onAddProject?: (workspaceId: string) => void;
  onEditWorkspace?: (workspaceId: string) => void;
  onArchiveWorkspace?: (workspaceId: string) => void;
  onDeleteWorkspace?: (workspaceId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

function WorkspaceItem({
  workspace,
  projects = [],
  collapsed = false,
  onToggle,
  onAddProject,
  onEditWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  onEditProject,
  onDeleteProject
}: WorkspaceItemProps): React.JSX.Element {
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="flex flex-col gap-0.5">
      <div
        onClick={() => onToggle?.(workspace.id)}
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
        <span className="ml-0.5 text-[12px] text-text-muted">{projects.length}</span>
        <span className="flex-1" />
        <IconButton
          icon={Plus}
          size={13}
          onClick={(e) => {
            e.stopPropagation();
            onAddProject?.(workspace.id);
          }}
        />
        <ContextMenu
          trigger={<IconButton icon={Ellipsis} size={14} onClick={(e) => e.stopPropagation()} />}
          actions={[
            {
              label: 'Edit workspace',
              icon: Settings,
              onClick: () => onEditWorkspace?.(workspace.id)
            },
            {
              label: 'Archive workspace',
              icon: Archive,
              onClick: () => onArchiveWorkspace?.(workspace.id)
            },
            {
              label: 'Delete workspace',
              icon: Trash2,
              onClick: () => onDeleteWorkspace?.(workspace.id),
              destructive: true
            }
          ]}
        />
      </div>

      {!collapsed && projects.length > 0 && (
        <div className="flex flex-col gap-px pl-4.5">
          {projects.map((project) => (
            <div
              key={project.id}
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
                      onClick: () => onEditProject?.(project.id)
                    },
                    {
                      label: 'Delete project',
                      icon: Trash2,
                      onClick: () => onDeleteProject?.(project.id),
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

export default memo(WorkspaceItem);
