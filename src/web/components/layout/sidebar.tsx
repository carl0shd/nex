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
import EditProjectModal from '@/components/modals/edit-project-modal';
import DeleteProjectModal from '@/components/modals/delete-project-modal';
import ManageWorkspacesModal from '@/components/modals/manage-workspaces-modal';
import CreateTaskModal from '@/components/modals/create-task-modal';
import CollapsedSidebar from '@/components/layout/collapsed-sidebar';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSessionStore } from '@/stores/session.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function Sidebar(): React.JSX.Element {
  const [simpleBarRef, isScrollable] = useScrollable();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);

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

  const editProjectOpen = useSidebarStore((s) => s.editProjectOpen);
  const editProjectId = useSidebarStore((s) => s.editProjectId);
  const openEditProject = useSidebarStore((s) => s.openEditProject);
  const closeEditProject = useSidebarStore((s) => s.closeEditProject);
  const deleteProjectOpen = useSidebarStore((s) => s.deleteProjectOpen);
  const deleteProjectId = useSidebarStore((s) => s.deleteProjectId);
  const openDeleteProject = useSidebarStore((s) => s.openDeleteProject);
  const closeDeleteProject = useSidebarStore((s) => s.closeDeleteProject);

  const createTaskOpen = useSidebarStore((s) => s.createTaskOpen);
  const createTaskWorkspaceId = useSidebarStore((s) => s.createTaskWorkspaceId);
  const createTaskProjectId = useSidebarStore((s) => s.createTaskProjectId);
  const openCreateTask = useSidebarStore((s) => s.openCreateTask);
  const closeCreateTask = useSidebarStore((s) => s.closeCreateTask);

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
      : () => openCreateTask();

  const workspacesWithTasks = useMemo(
    () =>
      activeWorkspaces.filter((ws) => {
        const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
        return wsProjects.some((p) => activeSessions.some((s) => s.projectId === p.id));
      }),
    [activeWorkspaces, projectsByWorkspace, activeSessions]
  );

  const totalTasks = activeSessions.length;
  const TasksChevron = collapsed.tasks ? ChevronRight : ChevronDown;

  const modals = (
    <>
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
      <EditProjectModal
        open={editProjectOpen}
        projectId={editProjectId}
        onClose={closeEditProject}
      />
      <DeleteProjectModal
        open={deleteProjectOpen}
        projectId={deleteProjectId}
        onClose={closeDeleteProject}
      />
      <ManageWorkspacesModal open={manageWorkspacesOpen} onClose={closeManageWorkspaces} />
      <CreateTaskModal
        open={createTaskOpen}
        workspaceId={createTaskWorkspaceId}
        projectId={createTaskProjectId}
        onClose={closeCreateTask}
      />
    </>
  );

  if (collapsed.full) {
    return (
      <>
        <CollapsedSidebar />
        {modals}
      </>
    );
  }

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
                projects={wsProjects.map((p) => ({
                  name: p.name,
                  onEdit: () => openEditProject(p.id),
                  onDelete: () => openDeleteProject(p.id)
                }))}
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
        <CountBadge count={totalTasks} />
      </div>

      {!collapsed.tasks && (
        <div className="min-h-0 flex-1 pl-4 pr-4 pt-2">
          <SimpleBar ref={simpleBarRef} style={{ maxHeight: '100%' }} autoHide={false}>
            <div className={`flex flex-col gap-2.5 ${isScrollable ? 'pr-3' : ''}`}>
              {workspacesWithTasks.map((ws) => {
                const groupCollapsed = collapsed.groups.includes(ws.id);
                const wsProjects = projectsByWorkspace.get(ws.id) ?? [];
                const projectsWithTasks = wsProjects.filter((p) =>
                  activeSessions.some((s) => s.projectId === p.id)
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
                        {projectsWithTasks.map((project) => {
                          const projectCollapsed = collapsed.projects.includes(project.id);
                          const projectSessions = activeSessions.filter(
                            (s) => s.projectId === project.id
                          );
                          return (
                            <div key={project.id} className="flex flex-col gap-0.5">
                              <ProjectLabel
                                name={project.name}
                                collapsed={projectCollapsed}
                                onToggle={() => toggle('projects', project.id)}
                              />
                              {!projectCollapsed &&
                                projectSessions.map((s) => (
                                  <SidebarTask key={s.id} name={s.name} />
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

      {modals}
    </div>
  );
}

export default Sidebar;
