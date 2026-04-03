import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorktreeStore } from '@/stores/worktree.store';
import { useTaskStore } from '@/stores/task.store';

export function useAppData(): void {
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadProjects = useWorkspaceStore((s) => s.loadProjects);
  const loadWorktrees = useWorktreeStore((s) => s.loadWorktrees);
  const loadTasks = useTaskStore((s) => s.loadTasks);

  useEffect(() => {
    loadWorkspaces();
    loadProjects();
    loadWorktrees();
    loadTasks();
  }, [loadWorkspaces, loadProjects, loadWorktrees, loadTasks]);
}
