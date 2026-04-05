import { contextBridge, ipcRenderer } from 'electron';

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

  getWorktrees: () => ipcRenderer.invoke('worktree:get-all'),
  getWorktreesByProject: (projectId: string) =>
    ipcRenderer.invoke('worktree:get-by-project', projectId),
  createWorktree: (input: unknown) => ipcRenderer.invoke('worktree:create', input),
  updateWorktree: (id: string, input: unknown) => ipcRenderer.invoke('worktree:update', id, input),
  deleteWorktree: (id: string) => ipcRenderer.invoke('worktree:delete', id),

  getTasks: () => ipcRenderer.invoke('task:get-all'),
  getTasksByProject: (projectId: string) => ipcRenderer.invoke('task:get-by-project', projectId),
  createTask: (input: unknown) => ipcRenderer.invoke('task:create', input),
  updateTask: (id: string, input: unknown) => ipcRenderer.invoke('task:update', id, input),
  deleteTask: (id: string) => ipcRenderer.invoke('task:delete', id),

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

  cli: (args: string[], cwd?: string) => ipcRenderer.invoke('cli:exec', args, cwd),

  onFullscreenChange: (callback: (value: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => callback(value);
    ipcRenderer.on('window:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-change', handler);
  }
};

contextBridge.exposeInMainWorld('api', api);
