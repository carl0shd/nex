import { Folder, Plus, Ellipsis, GitBranch, ChevronRight, Settings } from 'lucide-react';
import HoverCard from '@/components/ui/hover-card';
import Popover from '@/components/ui/popover';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import IconButton from '@/components/ui/icon-button';
import ContextMenu from '@/components/ui/context-menu';
import type { Workspace, Project, Worktree } from '@native/db/types';
import { Archive, Trash2 } from 'lucide-react';

interface CollapsedWorkspaceItemProps {
  workspace: Workspace;
  projects: Project[];
  worktrees: Worktree[];
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
  worktrees,
  onAddProject,
  onEditWorkspace,
  onArchiveWorkspace,
  onDeleteWorkspace,
  onAddTask,
  onEditProject,
  onDeleteProject
}: CollapsedWorkspaceItemProps): React.JSX.Element {
  const projectIds = new Set(projects.map((p) => p.id));
  const activeWorktrees = worktrees.filter((wt) => projectIds.has(wt.projectId));
  const projectById = new Map(projects.map((p) => [p.id, p] as const));

  const hoverCard = (
    <div className="flex w-44 flex-col gap-1.5 rounded-lg border border-border-menu bg-bg-menu px-3 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
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
        <span className="shrink-0 rounded-xl bg-badge-success-bg px-1.5 py-px text-[9px] font-semibold text-badge-success-text">
          active
        </span>
      </div>
      <span className="text-[11px] text-text-muted">
        {projects.length} project{projects.length === 1 ? '' : 's'} · {activeWorktrees.length}{' '}
        branch{activeWorktrees.length === 1 ? '' : 'es'}
      </span>
    </div>
  );

  return (
    <Popover
      anchor="right start"
      gap={8}
      trigger={(open) => (
        <HoverCard disabled={open} content={hoverCard}>
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
        </HoverCard>
      )}
      className=""
    >
      {({ close }) => (
        <div className="flex w-56 flex-col overflow-hidden rounded-lg border border-border-menu bg-bg-menu shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-1.5 px-2.5 py-2">
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
            <ContextMenu
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
            <span className="px-2 py-1 text-[10px] font-medium text-text-muted">
              {'// projects'}
            </span>
            {projects.length === 0 && (
              <span className="px-2 py-1 text-[11px] text-text-placeholder">No projects yet</span>
            )}
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1 select-none hover:bg-bg-mute/50"
              >
                <Folder size={13} className="shrink-0 text-text-muted" />
                <span className="truncate text-[11px] text-text-secondary">{project.name}</span>
                <span className="flex-1" />
                <div className="opacity-0 group-hover:opacity-100">
                  <ContextMenu
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
            ))}
          </div>

          {activeWorktrees.length > 0 && (
            <>
              <div className="h-px bg-border-soft" />
              <div className="flex flex-col gap-px px-2 py-1.5">
                <span className="px-2 py-1 text-[10px] font-medium text-text-muted">
                  {'// active tasks'}
                </span>
                {activeWorktrees.map((wt) => {
                  const project = projectById.get(wt.projectId);
                  return (
                    <div
                      key={wt.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 select-none hover:bg-bg-mute/50"
                    >
                      <GitBranch size={12} className="shrink-0 text-text-muted" />
                      <span
                        className={`truncate text-[11px] ${wt.active ? 'text-text' : 'text-text-secondary'}`}
                      >
                        {wt.branch}
                      </span>
                      <span className="flex-1" />
                      {wt.active && (
                        <span className="shrink-0 rounded-xl bg-badge-success-bg px-1.5 py-px text-[9px] font-semibold text-badge-success-text">
                          active
                        </span>
                      )}
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
              <span className="text-[11px] font-medium text-text-secondary">
                Workspace settings
              </span>
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

export default CollapsedWorkspaceItem;
