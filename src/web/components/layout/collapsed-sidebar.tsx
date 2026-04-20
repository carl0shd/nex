import { useMemo } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import CollapsedWorkspaceItem from '@/components/sidebar/collapsed-workspace-item';
import CollapsedTaskItem from '@/components/sidebar/collapsed-task-item';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function CollapsedSidebar(): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);

  const toggleFull = useSidebarStore((s) => s.toggleFull);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);
  const openEditWorkspace = useSidebarStore((s) => s.openEditWorkspace);
  const openCreateProject = useSidebarStore((s) => s.openCreateProject);
  const openDeleteWorkspace = useSidebarStore((s) => s.openDeleteWorkspace);
  const openEditProject = useSidebarStore((s) => s.openEditProject);
  const openDeleteProject = useSidebarStore((s) => s.openDeleteProject);

  const activeWorkspaces = useMemo(() => workspaces.filter((ws) => !ws.archived), [workspaces]);

  const projectsByWorkspace = useMemo(() => {
    const map = new Map<string, typeof projects>();
    for (const p of projects) {
      const list = map.get(p.workspaceId);
      if (list) list.push(p);
      else map.set(p.workspaceId, [p]);
    }
    return map;
  }, [projects]);

  const projectById = useMemo(() => {
    const map = new Map<string, (typeof projects)[number]>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const workspaceByProject = useMemo(() => {
    const map = new Map<string, (typeof workspaces)[number]>();
    for (const w of workspaces)
      for (const p of projectsByWorkspace.get(w.id) ?? []) map.set(p.id, w);
    return map;
  }, [workspaces, projectsByWorkspace]);

  return (
    <div className="flex h-full w-13 shrink-0 flex-col items-center gap-4 bg-bg px-2 py-4">
      <div className="flex w-full flex-col items-center gap-1.5">
        {activeWorkspaces.map((ws) => {
          const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
          return (
            <CollapsedWorkspaceItem
              key={ws.id}
              workspace={ws}
              projects={wsProjects}
              worktrees={worktrees}
              onAddProject={() => openCreateProject(ws.id)}
              onEditWorkspace={() => openEditWorkspace(ws.id)}
              onArchiveWorkspace={() => updateWorkspace(ws.id, { archived: true })}
              onDeleteWorkspace={() => openDeleteWorkspace(ws.id)}
              onEditProject={(id) => openEditProject(id)}
              onDeleteProject={(id) => openDeleteProject(id)}
            />
          );
        })}
        <button
          onClick={openCreateWorkspace}
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-text-muted select-none hover:bg-bg-mute hover:text-text"
        >
          <Plus size={16} />
        </button>
      </div>

      {activeWorkspaces.length > 0 && worktrees.length > 0 && (
        <div className="h-px w-full shrink-0 bg-border-soft" />
      )}

      <div className="min-h-0 w-full flex-1 overflow-hidden">
        <SimpleBar style={{ maxHeight: '100%' }} autoHide>
          <div className="flex w-full flex-col items-center gap-1">
            {worktrees.map((wt) => {
              const project = projectById.get(wt.projectId);
              const workspace = workspaceByProject.get(wt.projectId);
              if (!project || !workspace) return null;
              return (
                <CollapsedTaskItem
                  key={wt.id}
                  worktree={wt}
                  project={project}
                  workspace={workspace}
                />
              );
            })}
          </div>
        </SimpleBar>
      </div>

      <button
        onClick={toggleFull}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-accent text-text select-none hover:bg-accent-hover"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default CollapsedSidebar;
