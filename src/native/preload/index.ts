import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@native/ipc/channels';

const api = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  getWorkspaces: () => ipcRenderer.invoke('workspace:get-all'),
  getWorkspaceById: (id: string) => ipcRenderer.invoke('workspace:get-by-id', id),
  createWorkspace: (input: unknown) => ipcRenderer.invoke('workspace:create', input),
  updateWorkspace: (id: string, input: unknown) =>
    ipcRenderer.invoke('workspace:update', id, input),
  deleteWorkspace: (id: string) => ipcRenderer.invoke('workspace:delete', id),

  getProjects: () => ipcRenderer.invoke('project:get-all'),
  getProjectsByWorkspace: (workspaceId: string) =>
    ipcRenderer.invoke('project:get-by-workspace', workspaceId),
  createProject: (input: unknown) => ipcRenderer.invoke('project:create', input),
  updateProject: (id: string, input: unknown) => ipcRenderer.invoke('project:update', id, input),
  deleteProject: (id: string) => ipcRenderer.invoke('project:delete', id),

  getSetting: (key: string, fallback: unknown) => ipcRenderer.invoke('settings:get', key, fallback),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),

  getAgents: () => ipcRenderer.invoke('agent:get-all'),
  getAgentBySlug: (slug: string) => ipcRenderer.invoke('agent:get-by-slug', slug),
  createAgent: (input: unknown) => ipcRenderer.invoke('agent:create', input),
  updateAgent: (id: string, input: unknown) => ipcRenderer.invoke('agent:update', id, input),
  deleteAgent: (id: string) => ipcRenderer.invoke('agent:delete', id),

  getAgentAccounts: () => ipcRenderer.invoke('agent-account:get-all'),
  getAgentAccountsByAgent: (agentId: string) =>
    ipcRenderer.invoke('agent-account:get-by-agent', agentId),
  createAgentAccount: (input: unknown) => ipcRenderer.invoke('agent-account:create', input),
  updateAgentAccount: (id: string, input: unknown) =>
    ipcRenderer.invoke('agent-account:update', id, input),
  deleteAgentAccount: (id: string) => ipcRenderer.invoke('agent-account:delete', id),

  getSessions: () => ipcRenderer.invoke('session:get-all'),
  getSessionsByProject: (projectId: string) =>
    ipcRenderer.invoke('session:get-by-project', projectId),
  getActiveSessions: () => ipcRenderer.invoke('session:get-active'),
  createSession: (input: unknown) => ipcRenderer.invoke('session:create', input),
  updateSession: (id: string, input: unknown) => ipcRenderer.invoke('session:update', id, input),
  deleteSession: (id: string) => ipcRenderer.invoke('session:delete', id),
  reorderSessions: (orderedIds: string[]) => ipcRenderer.invoke('session:reorder', orderedIds),
  readSessionNotes: (sessionId: string) => ipcRenderer.invoke('session:notes-read', sessionId),
  writeSessionNotes: (sessionId: string, content: string) =>
    ipcRenderer.invoke('session:notes-write', sessionId, content),

  showWindow: () => ipcRenderer.invoke('window:show'),
  detectAgents: () => ipcRenderer.invoke('agents:detect'),
  cloneAgentAccount: (input: unknown) => ipcRenderer.invoke('agent-account:clone', input),
  startWork: (input: unknown) => ipcRenderer.invoke('work:start', input),
  detectBaseBranch: (repoPath: string) => ipcRenderer.invoke('git:detect-base-branch', repoPath),
  isGitRepo: (repoPath: string) => ipcRenderer.invoke('git:is-repo', repoPath),
  listBranches: (repoPath: string) => ipcRenderer.invoke('git:list-branches', repoPath),
  pickImage: () => ipcRenderer.invoke('dialog:pick-image'),
  pickDirectory: () => ipcRenderer.invoke('dialog:pick-directory'),
  saveWorkspaceIcon: (workspaceId: string, dataUrl: string) =>
    ipcRenderer.invoke('workspace:save-icon', workspaceId, dataUrl),
  openInVSCode: (path: string) => ipcRenderer.invoke(IPC.IDE_OPEN_VSCODE, path),

  onFullscreenChange: (callback: (value: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => callback(value);
    ipcRenderer.on('window:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-change', handler);
  },

  getTerminals: () => ipcRenderer.invoke(IPC.TERMINAL_GET_ALL),
  getTerminalsBySession: (sessionId: string) =>
    ipcRenderer.invoke(IPC.TERMINAL_GET_BY_SESSION, sessionId),
  createTerminal: (input: unknown) => ipcRenderer.invoke(IPC.TERMINAL_CREATE, input),
  createSessionTerminal: (input: unknown) =>
    ipcRenderer.invoke(IPC.TERMINAL_CREATE_FOR_SESSION, input),
  deleteTerminal: (id: string) => ipcRenderer.invoke(IPC.TERMINAL_DELETE, id),

  ptyEnsure: (terminalId: string, cols?: number, rows?: number) =>
    ipcRenderer.invoke(IPC.PTY_ENSURE, terminalId, cols, rows),
  ptyWrite: (terminalId: string, data: string) => ipcRenderer.send(IPC.PTY_WRITE, terminalId, data),
  ptyResize: (terminalId: string, cols: number, rows: number) =>
    ipcRenderer.send(IPC.PTY_RESIZE, terminalId, cols, rows),
  ptyKill: (terminalId: string) => ipcRenderer.invoke(IPC.PTY_KILL, terminalId),
  ptyGetSnapshot: (terminalId: string) => ipcRenderer.invoke(IPC.PTY_GET_SNAPSHOT, terminalId),

  onPtyData: (terminalId: string, callback: (data: string) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; data: string }
    ): void => {
      if (payload.id === terminalId) callback(payload.data);
    };
    ipcRenderer.on(IPC.PTY_DATA, handler);
    return () => ipcRenderer.removeListener(IPC.PTY_DATA, handler);
  },

  onPtyExit: (
    terminalId: string,
    callback: (info: { exitCode: number; signal?: number }) => void
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; exitCode: number; signal?: number }
    ): void => {
      if (payload.id === terminalId)
        callback({ exitCode: payload.exitCode, signal: payload.signal });
    };
    ipcRenderer.on(IPC.PTY_EXIT, handler);
    return () => ipcRenderer.removeListener(IPC.PTY_EXIT, handler);
  },

  onTerminalStatus: (callback: (info: { id: string; status: 'idle' | 'running' }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; status: 'idle' | 'running' }
    ): void => callback(payload);
    ipcRenderer.on(IPC.TERMINAL_STATUS, handler);
    return () => ipcRenderer.removeListener(IPC.TERMINAL_STATUS, handler);
  }
};

contextBridge.exposeInMainWorld('api', api);
