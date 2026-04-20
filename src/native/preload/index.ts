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

  onFullscreenChange: (callback: (value: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => callback(value);
    ipcRenderer.on('window:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-change', handler);
  }
};

contextBridge.exposeInMainWorld('api', api);
