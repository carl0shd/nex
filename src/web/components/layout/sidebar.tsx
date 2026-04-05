import { useEffect, useState, useCallback } from 'react';
import { Plus, LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import { useScrollable } from '@/hooks/use-scrollable';
import SectionHeader from '@/components/ui/section-header';
import TipBox from '@/components/ui/tip-box';
import ShortcutKey from '@/components/ui/shortcut-key';
import WorkspaceItem from '@/components/sidebar/workspace-item';
import TaskGroupHeader from '@/components/sidebar/task-group-header';
import ProjectLabel from '@/components/sidebar/project-label';
import CountBadge from '@/components/sidebar/count-badge';
import SidebarTask from '@/components/sidebar/sidebar-task';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';

interface SidebarCollapsed {
  workspacesSection: boolean;
  workspaces: string[];
  tasks: boolean;
  groups: string[];
  projects: string[];
}

const DEFAULT_COLLAPSED: SidebarCollapsed = {
  workspacesSection: false,
  workspaces: [],
  tasks: false,
  groups: [],
  projects: []
};

function Sidebar(): React.JSX.Element {
  const [simpleBarRef, isScrollable] = useScrollable();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const worktrees = useWorktreeStore((s) => s.worktrees);
  const [collapsed, setCollapsed] = useState<SidebarCollapsed>(DEFAULT_COLLAPSED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.api.getSetting<SidebarCollapsed>('sidebar-collapsed', DEFAULT_COLLAPSED).then((val) => {
      setCollapsed(val);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: SidebarCollapsed) => {
    setCollapsed(next);
    window.api.setSetting('sidebar-collapsed', next);
  }, []);

  const toggle = (key: 'workspaces' | 'groups' | 'projects', id: string): void => {
    const list = collapsed[key];
    const next = list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
    persist({ ...collapsed, [key]: next });
  };

  const workspacesWithWorktrees = workspaces.filter((ws) => {
    const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
    return wsProjects.some((p) => worktrees.some((wt) => wt.projectId === p.id));
  });

  const totalWorktrees = worktrees.length;
  const TasksChevron = collapsed.tasks ? ChevronRight : ChevronDown;

  if (!loaded) return <div className="flex h-full w-65 shrink-0 flex-col bg-bg" />;

  return (
    <div className="flex h-full w-65 shrink-0 flex-col bg-bg">
      <div className="flex shrink-0 flex-col gap-0.5 p-4 pb-0">
        <SectionHeader
          title="// workspaces"
          collapsed={collapsed.workspacesSection}
          onToggle={() =>
            persist({ ...collapsed, workspacesSection: !collapsed.workspacesSection })
          }
          actions={[{ icon: LayoutGrid }, { icon: Plus }]}
        />

        {!collapsed.workspacesSection &&
          workspaces.map((ws) => {
            const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
            const wsCollapsed = collapsed.workspaces.includes(ws.id);
            return (
              <WorkspaceItem
                key={ws.id}
                name={ws.name}
                color={ws.color}
                icon={ws.icon}
                customImage={ws.customImage}
                count={wsProjects.length}
                projects={wsProjects.map((p) => ({ name: p.name }))}
                collapsed={wsCollapsed}
                onToggle={() => toggle('workspaces', ws.id)}
              />
            );
          })}
      </div>

      <div className="mx-4 my-4 h-px shrink-0 bg-border" />

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
                const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
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
        <button className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-accent py-2 text-[12px] font-medium text-text select-none hover:bg-accent-hover">
          &gt; new task
        </button>
      </div>

      <div className="shrink-0 p-4 pt-0">
        <TipBox>
          <ShortcutKey keys="⌘W" label="new workspace" />
          <ShortcutKey keys="⌘P" label="new project" />
          <ShortcutKey keys="⌘T" label="new task" />
          <ShortcutKey keys="⌘D" label="view diff" />
        </TipBox>
      </div>
    </div>
  );
}

export default Sidebar;
