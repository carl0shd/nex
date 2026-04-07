import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';
import { useTaskStore } from '@/stores/task.store';
import { useAgentStore } from '@/stores/agent.store';
import { useSessionStore } from '@/stores/session.store';
import { useSidebarStore } from '@/stores/sidebar.store';

export function useAppData(): void {
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadProjects = useWorkspaceStore((s) => s.loadProjects);
  const loadWorktrees = useWorktreeStore((s) => s.loadWorktrees);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const loadAccounts = useAgentStore((s) => s.loadAccounts);
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const loadSidebar = useSidebarStore((s) => s.load);

  useEffect(() => {
    Promise.all([
      loadWorkspaces(),
      loadProjects(),
      loadWorktrees(),
      loadTasks(),
      loadAgents(),
      loadAccounts(),
      loadSessions(),
      loadSidebar()
    ]).then(() => window.api.showWindow());
  }, [
    loadWorkspaces,
    loadProjects,
    loadWorktrees,
    loadTasks,
    loadAgents,
    loadAccounts,
    loadSessions,
    loadSidebar
  ]);
}
