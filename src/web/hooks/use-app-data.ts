import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAgentStore } from '@/stores/agent.store';
import { useSessionStore } from '@/stores/session.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useTerminalStore } from '@/stores/terminal.store';
import { useMicStore } from '@/stores/mic.store';
import { useSettingsStore } from '@/stores/settings.store';

export function useAppData(): void {
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadProjects = useWorkspaceStore((s) => s.loadProjects);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const loadAccounts = useAgentStore((s) => s.loadAccounts);
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const loadSidebar = useSidebarStore((s) => s.load);
  const loadTerminals = useTerminalStore((s) => s.loadTerminals);
  const loadMic = useMicStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    Promise.all([
      loadWorkspaces(),
      loadProjects(),
      loadAgents(),
      loadAccounts(),
      loadSessions(),
      loadSidebar(),
      loadTerminals(),
      loadMic(),
      loadSettings()
    ]).then(() => window.api.showWindow());

    const unsubscribe = window.api.onTerminalStatus(({ id, status }) => {
      useTerminalStore.getState().setStatus(id, status);
    });
    return unsubscribe;
  }, [
    loadWorkspaces,
    loadProjects,
    loadAgents,
    loadAccounts,
    loadSessions,
    loadSidebar,
    loadTerminals,
    loadMic,
    loadSettings
  ]);
}
