import { useMemo } from 'react';
import EmptyState from '@/components/layout/empty-state';
import SessionView from '@/components/layout/session-view';
import { useSessionStore } from '@/stores/session.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { SessionView as SessionViewModel } from '@/lib/session-view';

function Home(): React.JSX.Element {
  const sessions = useSessionStore((s) => s.sessions);
  const projects = useWorkspaceStore((s) => s.projects);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);

  const sessionViews = useMemo<SessionViewModel[]>(() => {
    return activeSessions.map((s) => {
      const project = projects.find((p) => p.id === s.projectId);
      const workspace = project ? workspaces.find((w) => w.id === project.workspaceId) : undefined;
      return {
        id: s.id,
        branch: s.branch || s.name,
        workspace: workspace?.name ?? '',
        project: project?.name ?? '',
        dotColor: workspace?.color ?? '#636363',
        active: true,
        notes: '',
        inputPlaceholder: 'Ask the agent…',
        files: [],
        totalFiles: 0,
        totalAdded: 0,
        totalRemoved: 0,
        tabs: [{ name: s.name, dotColor: workspace?.color ?? '#636363', active: true }],
        commands: []
      };
    });
  }, [activeSessions, projects, workspaces]);

  if (sessionViews.length === 0) return <EmptyState />;

  return <SessionView sessions={sessionViews} />;
}

export default Home;
