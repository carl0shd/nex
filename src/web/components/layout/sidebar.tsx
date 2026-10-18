import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Plus, LayoutGrid, Search, SquarePen } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import GlideHighlight from '@/components/ui/glide-highlight';
import CollapsibleRows from '@/components/ui/collapsible-rows';
import { Kbd } from '@/components/ui/kbd';
import SectionHeader from '@/components/ui/section-header';
import SidebarHeader from '@/components/sidebar/sidebar-header';
import SidebarRailButton from '@/components/sidebar/sidebar-rail-button';
import TaskSectionHeader from '@/components/sidebar/task-section-header';
import WorkspaceItem from '@/components/sidebar/workspace-item';
import SidebarTask from '@/components/sidebar/sidebar-task';
import WorkspaceModal from '@/components/modals/workspace-modal';
import CreateProjectModal from '@/components/modals/create-project-modal';
import ImportGithubModal from '@/components/modals/import-github-modal';
import DeleteWorkspaceModal from '@/components/modals/delete-workspace-modal';
import EditProjectModal from '@/components/modals/edit-project-modal';
import DeleteProjectModal from '@/components/modals/delete-project-modal';
import ManageWorkspacesModal from '@/components/modals/manage-workspaces-modal';
import CreateTaskModal from '@/components/modals/create-task-modal';
import CloseSessionModal from '@/components/modals/close-session-modal';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSessionStore } from '@/stores/session.store';
import { useSidebarStore } from '@/stores/sidebar.store';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 52;
const GLIDE_RAIL = 'sidebar-glide-highlight';

function Sidebar(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const activeSessionStrs = useSessionStore(
    useShallow((s) =>
      s.sessions
        .filter((x) => x.status === 'active')
        .map((x) => `${x.id}\0${x.projectId}\0${x.name}`)
    )
  );
  const activeSessions = useMemo(
    () =>
      activeSessionStrs.map((str) => {
        const [id, projectId, ...rest] = str.split('\0');
        return { id, projectId, name: rest.join('\0') };
      }),
    [activeSessionStrs]
  );

  const focusSession = useSessionStore((s) => s.focusSession);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const workspaceModalOpen = useSidebarStore((s) => s.workspaceModalOpen);
  const workspaceModalId = useSidebarStore((s) => s.workspaceModalId);
  const createProjectOpen = useSidebarStore((s) => s.createProjectOpen);
  const createProjectWorkspaceId = useSidebarStore((s) => s.createProjectWorkspaceId);
  const deleteWorkspaceOpen = useSidebarStore((s) => s.deleteWorkspaceOpen);
  const deleteWorkspaceId = useSidebarStore((s) => s.deleteWorkspaceId);

  const persist = useSidebarStore((s) => s.persist);
  const toggle = useSidebarStore((s) => s.toggle);
  const toggleFull = useSidebarStore((s) => s.toggleFull);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);
  const openEditWorkspace = useSidebarStore((s) => s.openEditWorkspace);
  const closeWorkspaceModal = useSidebarStore((s) => s.closeWorkspaceModal);
  const openCreateProject = useSidebarStore((s) => s.openCreateProject);
  const closeCreateProject = useSidebarStore((s) => s.closeCreateProject);
  const importGithubOpen = useSidebarStore((s) => s.importGithubOpen);
  const openImportGithub = useSidebarStore((s) => s.openImportGithub);
  const closeImportGithub = useSidebarStore((s) => s.closeImportGithub);
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

  const closeSessionOpen = useSidebarStore((s) => s.closeSessionOpen);
  const closeSessionId = useSidebarStore((s) => s.closeSessionId);
  const openCloseSession = useSidebarStore((s) => s.openCloseSession);
  const closeCloseSession = useSidebarStore((s) => s.closeCloseSession);

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
  const cta = !hasWorkspaces
    ? { label: 'New workspace', shortcut: '⌘W' }
    : !hasProjects
      ? { label: 'New project', shortcut: '⌘P' }
      : { label: 'New task', shortcut: '⌘T' };
  const ctaAction = !hasWorkspaces
    ? openCreateWorkspace
    : !hasProjects
      ? () => openCreateProject(activeWorkspaces[0].id)
      : () => openCreateTask();

  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const visibleSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeSessions;
    return activeSessions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (projectNameById.get(s.projectId) ?? '').toLowerCase().includes(q)
    );
  }, [activeSessions, projectNameById, query]);

  const sidebarCollapsed = collapsed.full;

  const selectWorkspace = useCallback(
    (id: string) => {
      if (!sidebarCollapsed) {
        toggle('workspaces', id);
        return;
      }
      toggleFull();
      if (collapsed.workspaces.includes(id)) toggle('workspaces', id);
    },
    [sidebarCollapsed, collapsed.workspaces, toggle, toggleFull]
  );
  const archiveWorkspace = useCallback(
    (id: string) => updateWorkspace(id, { archived: true }),
    [updateWorkspace]
  );

  const sectionActions = useMemo(
    () => [
      { icon: LayoutGrid, label: 'Manage workspaces', onClick: openManageWorkspaces },
      { icon: Plus, label: 'New workspace', onClick: openCreateWorkspace }
    ],
    [openManageWorkspaces, openCreateWorkspace]
  );

  const toggleWorkspacesSection = useCallback(
    () => persist({ ...collapsed, workspacesSection: !collapsed.workspacesSection }),
    [persist, collapsed]
  );

  const collapseSidebar = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    toggleFull();
  }, [toggleFull]);

  const openSearch = useCallback(() => {
    if (sidebarCollapsed) toggleFull();
    setSearchOpen(true);
  }, [sidebarCollapsed, toggleFull]);

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
        onImportFromGithub={openImportGithub}
      />
      <ImportGithubModal open={importGithubOpen} onClose={closeImportGithub} />
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
      <CloseSessionModal
        open={closeSessionOpen}
        sessionId={closeSessionId}
        onClose={closeCloseSession}
      />
    </>
  );

  return (
    <>
      <aside
        data-sidebar
        data-sidebar-collapsed={sidebarCollapsed}
        aria-label="Navigation"
        className="relative h-full shrink-0 overflow-hidden transition-[width] duration-280 ease-glide"
        style={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      >
        <div className="flex h-full flex-col" style={{ width: EXPANDED_WIDTH }}>
          <SidebarHeader
            collapsed={sidebarCollapsed}
            onCollapse={collapseSidebar}
            onExpand={toggleFull}
            onNewWorkspace={openCreateWorkspace}
            onManageWorkspaces={openManageWorkspaces}
            onOpenSettings={() => navigate('/settings')}
          />

          <GlideHighlight highlightClassName={GLIDE_RAIL} className="flex shrink-0 flex-col gap-px">
            <SidebarRailButton
              icon={<SquarePen size={15} className="text-primary-ink" />}
              label={cta.label}
              trailing={<Kbd>{cta.shortcut}</Kbd>}
              onClick={ctaAction}
            />
            <SidebarRailButton
              icon={<Search size={15} />}
              label="Search tasks"
              onClick={openSearch}
            />
          </GlideHighlight>

          <SimpleBar className="mt-4 min-h-0 flex-1" autoHide>
            <div className="flex flex-col gap-4 pb-3">
              <section className="flex flex-col">
                <div className="sidebar-copy mx-2 w-61">
                  <SectionHeader
                    title="Workspaces"
                    collapsed={collapsed.workspacesSection}
                    onToggle={toggleWorkspacesSection}
                    actions={sectionActions}
                  />
                </div>
                <CollapsibleRows open={!collapsed.workspacesSection} railVisible>
                  <GlideHighlight highlightClassName={GLIDE_RAIL} className="flex flex-col gap-px">
                    {activeWorkspaces.map((ws) => (
                      <WorkspaceItem
                        key={ws.id}
                        workspace={ws}
                        projects={projectsByWorkspace.get(ws.id) ?? []}
                        collapsed={collapsed.workspaces.includes(ws.id)}
                        onSelect={selectWorkspace}
                        onAddProject={openCreateProject}
                        onEditWorkspace={openEditWorkspace}
                        onArchiveWorkspace={archiveWorkspace}
                        onDeleteWorkspace={openDeleteWorkspace}
                        onEditProject={openEditProject}
                        onDeleteProject={openDeleteProject}
                      />
                    ))}
                  </GlideHighlight>
                </CollapsibleRows>
              </section>

              <section className="flex flex-col">
                <TaskSectionHeader
                  count={activeSessions.length}
                  searchOpen={searchOpen}
                  query={query}
                  onQueryChange={setQuery}
                  onSearchOpenChange={setSearchOpen}
                />
                <GlideHighlight highlightClassName={GLIDE_RAIL} className="flex flex-col gap-px">
                  {visibleSessions.map((s) => (
                    <SidebarTask
                      key={s.id}
                      id={s.id}
                      name={s.name}
                      projectName={projectNameById.get(s.projectId)}
                      active={s.id === activeSessionId}
                      onClick={() => focusSession(s.id)}
                      onDelete={openCloseSession}
                    />
                  ))}
                </GlideHighlight>
                {visibleSessions.length === 0 && (
                  <p className="sidebar-copy mx-4 py-1.5 text-xs text-ink-4">
                    {query ? 'No tasks match' : 'No active tasks'}
                  </p>
                )}
              </section>
            </div>
          </SimpleBar>
        </div>
      </aside>
      {modals}
    </>
  );
}

export default Sidebar;
