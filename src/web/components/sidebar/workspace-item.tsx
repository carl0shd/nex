import { memo, useRef } from 'react';
import {
  ChevronDown,
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
import ActionMenu from '@/components/ui/action-menu';
import CollapsibleRows from '@/components/ui/collapsible-rows';
import { cn } from '@/lib/utils';
import type { Workspace, Project } from '@native/db/types';

interface WorkspaceItemProps {
  workspace: Workspace;
  projects?: Project[];
  collapsed?: boolean;
  onSelect?: (id: string) => void;
  onAddProject?: (workspaceId: string) => void;
  onEditWorkspace?: (workspaceId: string) => void;
  onArchiveWorkspace?: (workspaceId: string) => void;
  onDeleteWorkspace?: (workspaceId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

interface ProjectRowProps {
  project: Project;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

const HOVER_REVEAL =
  'flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100';

function ProjectRow({
  project,
  onEditProject,
  onDeleteProject
}: ProjectRowProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={rowRef}
      data-glide-row
      className="sidebar-row group relative mx-2 flex h-7 items-center rounded-control pr-1 pl-9 select-none"
    >
      <span className="sidebar-copy flex min-w-0 flex-1 items-center gap-2">
        <Folder size={12} className="shrink-0 text-ink-4" />
        <span className="truncate text-sm text-ink-2">{project.name}</span>
      </span>
      <span className="sidebar-copy">
        <span className={HOVER_REVEAL}>
          <ActionMenu
            rowRef={rowRef}
            trigger={<IconButton icon={Ellipsis} size={13} className="size-6" />}
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
        </span>
      </span>
    </div>
  );
}

function WorkspaceItem({
  workspace,
  projects = [],
  collapsed = false,
  onSelect,
  onAddProject,
  onEditWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  onEditProject,
  onDeleteProject
}: WorkspaceItemProps): React.JSX.Element {
  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col">
      <div
        ref={headerRef}
        data-glide-row
        title={workspace.name}
        onClick={() => onSelect?.(workspace.id)}
        className="sidebar-row press group relative mx-2 flex h-8 cursor-pointer items-center rounded-control pr-1 pl-2 select-none"
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <WorkspaceBadge
            name={workspace.name}
            color={workspace.color}
            icon={workspace.icon}
            customImage={workspace.customImage}
            size={18}
            rounded="rounded-[5px]"
          />
        </span>
        <span className="sidebar-copy ml-2 flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-ink">{workspace.name}</span>
          <span className="text-2xs text-ink-4 tabular-nums">{projects.length}</span>
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 text-ink-4 transition-transform duration-200 ease-out-strong',
              collapsed && '-rotate-90'
            )}
          />
        </span>
        <span className="sidebar-copy">
          <span className={HOVER_REVEAL}>
            <IconButton
              icon={Plus}
              size={13}
              title="Add project"
              className="size-6"
              onClick={(e) => {
                e.stopPropagation();
                onAddProject?.(workspace.id);
              }}
            />
            <ActionMenu
              rowRef={headerRef}
              trigger={<IconButton icon={Ellipsis} size={14} className="size-6" />}
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
          </span>
        </span>
      </div>

      <CollapsibleRows open={!collapsed && projects.length > 0}>
        <div className="flex flex-col gap-px pt-px">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </div>
      </CollapsibleRows>
    </div>
  );
}

export default memo(WorkspaceItem);
