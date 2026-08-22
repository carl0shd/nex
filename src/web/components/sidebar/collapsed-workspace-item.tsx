import { memo, useRef, useState } from 'react';
import { Folder, Plus, Ellipsis, GitBranch, ChevronRight, Settings } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import PopoverMenu from '@/components/ui/popover-menu';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import IconButton from '@/components/ui/icon-button';
import ActionMenu from '@/components/ui/action-menu';
import { Badge } from '@/components/ui/badge';
import type { Workspace, Project, Session } from '@native/db/types';
import { Archive, Trash2 } from 'lucide-react';

interface CollapsedWorkspaceItemProps {
  workspace: Workspace;
  projects: Project[];
  sessions: Session[];
  onAddProject?: () => void;
  onEditWorkspace?: () => void;
  onArchiveWorkspace?: () => void;
  onDeleteWorkspace?: () => void;
  onAddTask?: () => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

function CollapsedWorkspaceItem({
  workspace,
  projects,
  sessions,
  onAddProject,
  onEditWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  onAddTask,
  onEditProject,
  onDeleteProject
}: CollapsedWorkspaceItemProps): React.JSX.Element {
  const projectIds = new Set(projects.map((p) => p.id));
  const workspaceSessions = sessions.filter(
    (s) => s.status === 'active' && projectIds.has(s.projectId)
  );
  const projectById = new Map(projects.map((p) => [p.id, p] as const));

  return (
    <PopoverMenu
      anchor="right start"
      gap={8}
      trigger={(open) => (
        <WorkspaceHoverBadge
          workspace={workspace}
          projectCount={projects.length}
          taskCount={workspaceSessions.length}
          disabled={open}
        />
      )}
    >
      {({ close }) => (
        <CollapsedWorkspaceCard
          workspace={workspace}
          projects={projects}
          workspaceSessions={workspaceSessions}
          projectById={projectById}
          close={close}
          onAddProject={onAddProject}
          onEditWorkspace={onEditWorkspace}
          onArchiveWorkspace={onArchiveWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onAddTask={onAddTask}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
        />
      )}
    </PopoverMenu>
  );
}

interface WorkspaceHoverBadgeProps {
  workspace: Workspace;
  projectCount: number;
  taskCount: number;
  disabled: boolean;
}

function WorkspaceHoverBadge({
  workspace,
  projectCount,
  taskCount,
  disabled
}: WorkspaceHoverBadgeProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open && !disabled} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <div className="flex size-8 items-center justify-center">
          <WorkspaceBadge
            name={workspace.name}
            color={workspace.color}
            icon={workspace.icon}
            customImage={workspace.customImage}
            size={32}
            fontSize={11}
            rounded="rounded-md"
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-44 flex-col gap-1.5 rounded-lg border border-border-menu bg-bg-menu px-3 py-2.5 shadow-[var(--nex-shadow-popover)]">
        <div className="flex items-center gap-2">
          <WorkspaceBadge
            name={workspace.name}
            color={workspace.color}
            icon={workspace.icon}
            customImage={workspace.customImage}
            size={14}
            fontSize={8}
            rounded="rounded-sm"
          />
          <span className="truncate text-[13px] font-semibold text-text">{workspace.name}</span>
          <span className="flex-1" />
          <Badge variant="success" size="sm">
            active
          </Badge>
        </div>
        <span className="text-[11px] text-text-muted">
          {projectCount} project{projectCount === 1 ? '' : 's'} · {taskCount} task
          {taskCount === 1 ? '' : 's'}
        </span>
      </HoverCardContent>
    </HoverCard>
  );
}

interface CollapsedWorkspaceCardProps {
  workspace: Workspace;
  projects: Project[];
  workspaceSessions: Session[];
  projectById: Map<string, Project>;
  close: () => void;
  onAddProject?: () => void;
  onEditWorkspace?: () => void;
  onArchiveWorkspace?: () => void;
  onDeleteWorkspace?: () => void;
  onAddTask?: () => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

function CollapsedWorkspaceCard({
  workspace,
  projects,
  workspaceSessions,
  projectById,
  close,
  onAddProject,
  onEditWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  onAddTask,
  onEditProject,
  onDeleteProject
}: CollapsedWorkspaceCardProps): React.JSX.Element {
  const headerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-56 flex-col overflow-hidden rounded-lg border border-border-menu bg-bg-menu shadow-[var(--nex-shadow-popover)]">
      <div ref={headerRef} className="flex items-center gap-1.5 px-2.5 py-2">
        <WorkspaceBadge
          name={workspace.name}
          color={workspace.color}
          icon={workspace.icon}
          customImage={workspace.customImage}
          size={18}
          fontSize={9}
          rounded="rounded"
        />
        <span className="truncate text-[12px] font-semibold text-text">{workspace.name}</span>
        <span className="text-[11px] text-text-muted">{projects.length}</span>
        <span className="flex-1" />
        <IconButton
          icon={Plus}
          size={13}
          onClick={() => {
            close();
            onAddProject?.();
          }}
        />
        <ActionMenu
          rowRef={headerRef}
          trigger={<IconButton icon={Ellipsis} size={14} />}
          actions={[
            {
              label: 'Edit workspace',
              icon: Settings,
              onClick: () => {
                close();
                onEditWorkspace?.();
              }
            },
            {
              label: 'Archive workspace',
              icon: Archive,
              onClick: () => {
                close();
                onArchiveWorkspace?.();
              }
            },
            {
              label: 'Delete workspace',
              icon: Trash2,
              onClick: () => {
                close();
                onDeleteWorkspace?.();
              },
              destructive: true
            }
          ]}
        />
      </div>

      <div className="h-px bg-border-soft" />

      <div className="flex flex-col gap-px px-2 py-1.5">
        <span className="px-2 py-1 text-[10px] font-medium text-text-muted">{'// projects'}</span>
        {projects.length === 0 && (
          <span className="px-2 py-1 text-[11px] text-text-placeholder">No projects yet</span>
        )}
        {projects.map((project) => (
          <CollapsedProjectRow
            key={project.id}
            project={project}
            close={close}
            onEditProject={onEditProject}
            onDeleteProject={onDeleteProject}
          />
        ))}
      </div>

      {workspaceSessions.length > 0 && (
        <>
          <div className="h-px bg-border-soft" />
          <div className="flex flex-col gap-px px-2 py-1.5">
            <span className="px-2 py-1 text-[10px] font-medium text-text-muted">
              {'// active tasks'}
            </span>
            {workspaceSessions.map((s) => {
              const project = projectById.get(s.projectId);
              return (
                <div
                  key={s.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 select-none hover:bg-bg-mute/50"
                >
                  <GitBranch size={12} className="shrink-0 text-text-muted" />
                  <span className="truncate text-[11px] text-text">{s.name}</span>
                  <span className="flex-1" />
                  <Badge variant="success" size="sm">
                    active
                  </Badge>
                  {project && (
                    <span className="truncate text-[10px] text-text-muted">{project.name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="h-px bg-border-soft" />

      <div className="flex flex-col gap-px px-2 py-1.5">
        <button
          onClick={() => {
            close();
            onAddTask?.();
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-left select-none hover:bg-bg-mute/50"
        >
          <ChevronRight size={12} className="text-badge-success-text" />
          <span className="text-[11px] font-medium text-badge-success-text">New task</span>
        </button>
        <button
          onClick={() => {
            close();
            onEditWorkspace?.();
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-left select-none hover:bg-bg-mute/50"
        >
          <Settings size={12} className="text-text-muted" />
          <span className="text-[11px] font-medium text-text-secondary">Workspace settings</span>
        </button>
      </div>
    </div>
  );
}

interface CollapsedProjectRowProps {
  project: Project;
  close: () => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

function CollapsedProjectRow({
  project,
  close,
  onEditProject,
  onDeleteProject
}: CollapsedProjectRowProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={rowRef}
      className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1 select-none hover:bg-bg-mute/50"
    >
      <Folder size={13} className="shrink-0 text-text-muted" />
      <span className="truncate text-[11px] text-text-secondary">{project.name}</span>
      <span className="flex-1" />
      <div className="opacity-0 group-hover:opacity-100">
        <ActionMenu
          rowRef={rowRef}
          trigger={<IconButton icon={Ellipsis} size={12} />}
          actions={[
            {
              label: 'Edit project',
              icon: Settings,
              onClick: () => {
                close();
                onEditProject?.(project.id);
              }
            },
            {
              label: 'Delete project',
              icon: Trash2,
              onClick: () => {
                close();
                onDeleteProject?.(project.id);
              },
              destructive: true
            }
          ]}
        />
      </div>
    </div>
  );
}

export default memo(CollapsedWorkspaceItem);
