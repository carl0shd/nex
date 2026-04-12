import { useMemo } from 'react';
import { Plus, LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import { useScrollable } from '@/hooks/use-scrollable';
import Button from '@/components/ui/button';
import SectionHeader from '@/components/ui/section-header';
import TipBox from '@/components/ui/tip-box';
import ShortcutKey from '@/components/ui/shortcut-key';
import WorkspaceItem from '@/components/sidebar/workspace-item';
import TaskGroupHeader from '@/components/sidebar/task-group-header';
import ProjectLabel from '@/components/sidebar/project-label';
import CountBadge from '@/components/sidebar/count-badge';
import SidebarTask from '@/components/sidebar/sidebar-task';
import WorkspaceModal from '@/components/modals/workspace-modal';
import CreateProjectModal from '@/components/modals/create-project-modal';
import DeleteWorkspaceModal from '@/components/modals/delete-workspace-modal';
import ManageWorkspacesModal from '@/components/modals/manage-workspaces-modal';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function Sidebar(): React.JSX.Element {
  const [simpleBarRef, isScrollable] = useScrollable();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const worktrees = useWorktreeStore((s) => s.worktrees);

  const collapsed = useSidebarStore((s) => s.collapsed);
  const workspaceModalOpen = useSidebarStore((s) => s.workspaceModalOpen);
  const workspaceModalId = useSidebarStore((s) => s.workspaceModalId);
  const createProjectOpen = useSidebarStore((s) => s.createProjectOpen);
  const createProjectWorkspaceId = useSidebarStore((s) => s.createProjectWorkspaceId);
  const deleteWorkspaceOpen = useSidebarStore((s) => s.deleteWorkspaceOpen);
  const deleteWorkspaceId = useSidebarStore((s) => s.deleteWorkspaceId);

  const persist = useSidebarStore((s) => s.persist);
  const toggle = useSidebarStore((s) => s.toggle);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);
  const openEditWorkspace = useSidebarStore((s) => s.openEditWorkspace);
  const closeWorkspaceModal = useSidebarStore((s) => s.closeWorkspaceModal);
  const openCreateProject = useSidebarStore((s) => s.openCreateProject);
  const closeCreateProject = useSidebarStore((s) => s.closeCreateProject);
  const openDeleteWorkspace = useSidebarStore((s) => s.openDeleteWorkspace);
  const closeDeleteWorkspace = useSidebarStore((s) => s.closeDeleteWorkspace);
  const manageWorkspacesOpen = useSidebarStore((s) => s.manageWorkspacesOpen);
  const openManageWorkspaces = useSidebarStore((s) => s.openManageWorkspaces);
  const closeManageWorkspaces = useSidebarStore((s) => s.closeManageWorkspaces);

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

  const hasWorkspaces = workspaces.length > 0;
  const hasProjects = projects.length > 0;
  const ctaLabel = !hasWorkspaces ? 'new workspace' : !hasProjects ? 'new project' : 'new task';
  const ctaAction = !hasWorkspaces
    ? openCreateWorkspace
    : !hasProjects
      ? () => openCreateProject(activeWorkspaces[0].id)
      : undefined;

  const workspacesWithWorktrees = useMemo(
    () =>
      activeWorkspaces.filter((ws) => {
        const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
        return wsProjects.some((p) => worktrees.some((wt) => wt.projectId === p.id));
      }),
    [activeWorkspaces, projectsByWorkspace, worktrees]
  );

  const totalWorktrees = worktrees.length;
  const TasksChevron = collapsed.tasks ? ChevronRight : ChevronDown;

  return (
    <div className="flex h-full w-65 shrink-0 flex-col bg-bg">
      <div className="flex shrink-0 flex-col gap-0.5 p-4 pb-0">
        <SectionHeader
          title="// workspaces"
          collapsed={collapsed.workspacesSection}
          onToggle={() =>
            persist({ ...collapsed, workspacesSection: !collapsed.workspacesSection })
          }
          actions={[
            { icon: LayoutGrid, onClick: openManageWorkspaces },
            { icon: Plus, onClick: openCreateWorkspace }
          ]}
        />

        {!collapsed.workspacesSection &&
          activeWorkspaces.map((ws) => {
            const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
            const wsCollapsed = collapsed.workspaces.includes(ws.id);
            return (
              <WorkspaceItem
                key={ws.id}
                workspace={ws}
                projectCount={wsProjects.length}
                projects={wsProjects.map((p) => ({ name: p.name }))}
                collapsed={wsCollapsed}
                onToggle={() => toggle('workspaces', ws.id)}
                onAddProject={() => openCreateProject(ws.id)}
                onSettings={() => openEditWorkspace(ws.id)}
                onArchive={() => updateWorkspace(ws.id, { archived: true })}
                onDelete={() => openDeleteWorkspace(ws.id)}
              />
            );
          })}
      </div>

      <div className="mx-4 my-4 h-px shrink-0 bg-border-soft" />

      <div className="flex shrink-0 items-center gap-1 px-5">
        <button
          onClick={() => persist({ ...collapsed, tasks: !collapsed.tasks })}
          className="flex cursor-pointer items-center gap-1 text-text-muted"
        >
          <TasksChevron size={12} />
          <span className="select-none text-[13px] font-medium">{'// active tasks'}</span>
        </button>
        <span className="flex-1" />
        <CountBadge count={totalWorktrees} />
      </div>

      {!collapsed.tasks && (
        <div className="min-h-0 flex-1 pl-4 pr-4 pt-2">
          <SimpleBar ref={simpleBarRef} style={{ maxHeight: '100%' }} autoHide={false}>
            <div className={`flex flex-col gap-2.5 ${isScrollable ? 'pr-3' : ''}`}>
              {workspacesWithWorktrees.map((ws) => {
                const groupCollapsed = collapsed.groups.includes(ws.id);
                const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
                const projectsWithWorktrees = wsProjects.filter((p) =>
                  worktrees.some((wt) => wt.projectId === p.id)
                );

                return (
                  <div key={ws.id} className="flex flex-col gap-0.5">
                    <TaskGroupHeader
                      name={ws.name}
                      color={ws.color}
                      collapsed={groupCollapsed}
                      onToggle={() => toggle('groups', ws.id)}
                    />
                    {!groupCollapsed && (
                      <div className="flex flex-col gap-1 pl-4">
                        {projectsWithWorktrees.map((project) => {
                          const projectCollapsed = collapsed.projects.includes(project.id);
                          const projectWorktrees = worktrees.filter(
                            (wt) => wt.projectId === project.id
                          );
                          return (
                            <div key={project.id} className="flex flex-col gap-0.5">
                              <ProjectLabel
                                name={project.name}
                                collapsed={projectCollapsed}
                                onToggle={() => toggle('projects', project.id)}
                              />
                              {!projectCollapsed &&
                                projectWorktrees.map((wt) => (
                                  <SidebarTask key={wt.id} name={wt.branch} />
                                ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SimpleBar>
        </div>
      )}

      {collapsed.tasks && <div className="flex-1" />}

      <div className="shrink-0 px-4 pb-3 pt-3 z-20">
        <Button onClick={ctaAction} className="w-full py-2 text-[12px]">
          &gt; {ctaLabel}
        </Button>
      </div>

      <div className="shrink-0 p-4 pt-0">
        <TipBox>
          <ShortcutKey keys="⌘W" label="new workspace" />
          <ShortcutKey keys="⌘P" label="new project" />
          <ShortcutKey keys="⌘T" label="new task" />
          <ShortcutKey keys="⌘D" label="view diff" />
        </TipBox>
      </div>

      <WorkspaceModal
        open={workspaceModalOpen}
        workspaceId={workspaceModalId || undefined}
        onClose={closeWorkspaceModal}
      />

      <CreateProjectModal
        open={createProjectOpen}
        workspaceId={createProjectWorkspaceId}
        onClose={closeCreateProject}
      />

      <DeleteWorkspaceModal
        open={deleteWorkspaceOpen}
        workspaceId={deleteWorkspaceId}
        onClose={closeDeleteWorkspace}
      />

      <ManageWorkspacesModal open={manageWorkspacesOpen} onClose={closeManageWorkspaces} />
    </div>
  );
}

export default Sidebar;
