import { contextBridge, ipcRenderer, webFrame, webUtils } from "electron";
import { IPC } from "@native/ipc/channels";
import type { TerminalStatus } from "@native/db/types";
import type {
  CleanBaseInput,
  CleanBaseState,
  EnvCheckInput,
  EnvCheckState,
  EnvSetupState,
} from "@native/environments/types";
import type { ProjectEnvironment } from "@native/db/types";

type SpeechEvent = {
  type: "state" | "partial" | "final" | "error" | "end" | "devicesChanged";
  state?: string;
  text?: string;
  confidence?: number;
  timestampMs?: number;
  code?: string;
  message?: string;
};
type SpeechCallback = (event: SpeechEvent) => void;

const speechSubscribers = new Set<SpeechCallback>();
ipcRenderer.on(IPC.SPEECH_EVENT, (_e, payload: SpeechEvent) => {
  for (const cb of speechSubscribers) cb(payload);
});

const usageSubscribers = new Set<() => void>();
ipcRenderer.on(IPC.USAGE_CHANGED, () => {
  for (const cb of usageSubscribers) cb();
});

const api = {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getOpenAtLogin: () => ipcRenderer.invoke(IPC.APP_GET_LOGIN_ITEM),
  setOpenAtLogin: (openAtLogin: boolean) => ipcRenderer.invoke(IPC.APP_SET_LOGIN_ITEM, openAtLogin),
  playSound: (name: string) => ipcRenderer.invoke(IPC.APP_PLAY_SOUND, name),
  setDockBadge: (count: number) => ipcRenderer.invoke(IPC.APP_SET_BADGE, count),
  listShells: () => ipcRenderer.invoke(IPC.APP_LIST_SHELLS),
  installedApps: (names: string[]) => ipcRenderer.invoke(IPC.APP_INSTALLED, names),
  findLocalRepos: (exclude: string[]) => ipcRenderer.invoke(IPC.REPOS_FIND, exclude),
  openWith: (appName: string, path: string) => ipcRenderer.invoke(IPC.APP_OPEN_WITH, appName, path),
  setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),

  getWorkspaces: () => ipcRenderer.invoke("workspace:get-all"),
  getWorkspaceById: (id: string) => ipcRenderer.invoke("workspace:get-by-id", id),
  createWorkspace: (input: unknown) => ipcRenderer.invoke("workspace:create", input),
  updateWorkspace: (id: string, input: unknown) =>
    ipcRenderer.invoke("workspace:update", id, input),
  deleteWorkspace: (id: string) => ipcRenderer.invoke("workspace:delete", id),

  getProjects: () => ipcRenderer.invoke("project:get-all"),
  getProjectsByWorkspace: (workspaceId: string) =>
    ipcRenderer.invoke("project:get-by-workspace", workspaceId),
  createProject: (input: unknown) => ipcRenderer.invoke("project:create", input),
  updateProject: (id: string, input: unknown) => ipcRenderer.invoke("project:update", id, input),
  deleteProject: (id: string) => ipcRenderer.invoke("project:delete", id),

  getSetting: (key: string, fallback: unknown) => ipcRenderer.invoke("settings:get", key, fallback),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke("settings:set", key, value),

  getAgents: () => ipcRenderer.invoke("agent:get-all"),
  getAgentBySlug: (slug: string) => ipcRenderer.invoke("agent:get-by-slug", slug),
  createAgent: (input: unknown) => ipcRenderer.invoke("agent:create", input),
  updateAgent: (id: string, input: unknown) => ipcRenderer.invoke("agent:update", id, input),
  deleteAgent: (id: string) => ipcRenderer.invoke("agent:delete", id),

  getAgentAccounts: () => ipcRenderer.invoke("agent-account:get-all"),
  getAgentAccountsByAgent: (agentId: string) =>
    ipcRenderer.invoke("agent-account:get-by-agent", agentId),
  createAgentAccount: (input: unknown) => ipcRenderer.invoke("agent-account:create", input),
  updateAgentAccount: (id: string, input: unknown) =>
    ipcRenderer.invoke("agent-account:update", id, input),
  deleteAgentAccount: (id: string) => ipcRenderer.invoke("agent-account:delete", id),

  getSessions: () => ipcRenderer.invoke("session:get-all"),
  getSessionsByProject: (projectId: string) =>
    ipcRenderer.invoke("session:get-by-project", projectId),
  getActiveSessions: () => ipcRenderer.invoke("session:get-active"),
  createSession: (input: unknown) => ipcRenderer.invoke("session:create", input),
  updateSession: (id: string, input: unknown) => ipcRenderer.invoke("session:update", id, input),
  deleteSession: (id: string, keepBranch?: boolean) =>
    ipcRenderer.invoke("session:delete", id, keepBranch),
  reorderSessions: (orderedIds: string[]) => ipcRenderer.invoke("session:reorder", orderedIds),
  readSessionNotes: (sessionId: string) => ipcRenderer.invoke("session:notes-read", sessionId),
  writeSessionNotes: (sessionId: string, content: string) =>
    ipcRenderer.invoke("session:notes-write", sessionId, content),

  showWindow: () => ipcRenderer.invoke("window:show"),
  detectAgents: () => ipcRenderer.invoke("agents:detect"),
  getAgentVersion: (agentId: string) => ipcRenderer.invoke("agents:version", agentId),
  upgradeAgent: (agentId: string) => ipcRenderer.invoke(IPC.AGENT_UPGRADE, agentId),
  pickAgentCommand: (agentId: string) => ipcRenderer.invoke(IPC.AGENT_PICK_COMMAND, agentId),
  inspectRepo: (path: string) => ipcRenderer.invoke("repo:inspect", path),
  pathForFile: (file: File) => webUtils.getPathForFile(file),
  openInFinder: (path: string) => ipcRenderer.invoke("finder:open", path),
  installAgent: (slug: string) => ipcRenderer.invoke("agents:install", slug),
  cloneAgentAccount: (input: unknown) => ipcRenderer.invoke("agent-account:clone", input),
  signInAccount: () => ipcRenderer.invoke(IPC.ACCOUNT_SIGN_IN),
  reauthAccount: (accountId: string) => ipcRenderer.invoke(IPC.ACCOUNT_REAUTH, accountId),
  cancelSignIn: () => ipcRenderer.invoke(IPC.ACCOUNT_SIGN_IN_CANCEL),
  finishSignIn: (input: unknown) => ipcRenderer.invoke(IPC.ACCOUNT_SIGN_IN_FINISH, input),
  discardSignIn: (configDir: string) => ipcRenderer.invoke(IPC.ACCOUNT_SIGN_IN_DISCARD, configDir),
  onSignInUrl: (callback: (url: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string): void => callback(url);
    ipcRenderer.on(IPC.ACCOUNT_SIGN_IN_URL, handler);
    return () => ipcRenderer.removeListener(IPC.ACCOUNT_SIGN_IN_URL, handler);
  },
  startWork: (input: unknown) => ipcRenderer.invoke("work:start", input),
  detectGit: () => ipcRenderer.invoke("git:detect"),
  cloneRepository: (url: string, parentDir: string) =>
    ipcRenderer.invoke("git:clone", url, parentDir),
  detectGh: () => ipcRenderer.invoke("gh:detect"),
  listGithubOwners: () => ipcRenderer.invoke("gh:list-owners"),
  listGithubRepos: (owner: string) => ipcRenderer.invoke("gh:list-repos", owner),
  cloneGithubRepo: (nameWithOwner: string, parentDir: string) =>
    ipcRenderer.invoke("gh:clone", nameWithOwner, parentDir),
  onCloneProgress: (
    callback: (progress: { phase: string; percent: number | null; repo?: string }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      progress: { phase: string; percent: number | null; repo?: string },
    ): void => {
      callback(progress);
    };
    ipcRenderer.on(IPC.GIT_CLONE_PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IPC.GIT_CLONE_PROGRESS, handler);
    };
  },
  detectBaseBranch: (repoPath: string) => ipcRenderer.invoke("git:detect-base-branch", repoPath),
  isGitRepo: (repoPath: string) => ipcRenderer.invoke("git:is-repo", repoPath),
  listBranches: (repoPath: string) => ipcRenderer.invoke("git:list-branches", repoPath),
  listWorktreeFiles: (worktreePath: string) =>
    ipcRenderer.invoke(IPC.WORKTREE_LIST_FILES, worktreePath),
  getWorktreeDiff: (worktreePath: string, options?: unknown) =>
    ipcRenderer.invoke(IPC.GIT_WORKTREE_DIFF, worktreePath, options),
  readWorktreeFileVersions: (input: unknown) =>
    ipcRenderer.invoke(IPC.GIT_WORKTREE_FILE_VERSIONS, input),
  discardWorktreeFile: (worktreePath: string, path: string, prevPath?: string) =>
    ipcRenderer.invoke(IPC.GIT_DISCARD_FILE, worktreePath, path, prevPath),

  watchWorktree: (worktreePath: string, callback: () => void) => {
    void ipcRenderer.invoke(IPC.GIT_WATCH_START, worktreePath);
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { worktreePath: string },
    ): void => {
      if (payload.worktreePath === worktreePath) callback();
    };
    ipcRenderer.on(IPC.GIT_WORKTREE_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC.GIT_WORKTREE_CHANGED, handler);
      void ipcRenderer.invoke(IPC.GIT_WATCH_STOP, worktreePath);
    };
  },
  agentSend: (sessionId: string, content: unknown) =>
    ipcRenderer.invoke(IPC.AGENT_SEND, sessionId, content),
  switchAgentAccount: (sessionId: string, accountId: string) =>
    ipcRenderer.invoke(IPC.AGENT_SWITCH_ACCOUNT, sessionId, accountId),
  agentWarm: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_WARM, sessionId),
  mcpStatus: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_MCP_STATUS, sessionId),
  mcpToggle: (sessionId: string, name: string, enabled: boolean) =>
    ipcRenderer.invoke(IPC.AGENT_MCP_TOGGLE, sessionId, name, enabled),
  mcpReconnect: (sessionId: string, name: string) =>
    ipcRenderer.invoke(IPC.AGENT_MCP_RECONNECT, sessionId, name),
  mcpSignIn: (sessionId: string, name: string) =>
    ipcRenderer.invoke(IPC.AGENT_MCP_SIGN_IN, sessionId, name),
  agentContext: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_CONTEXT, sessionId),
  lastAgentContext: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_CONTEXT_LAST, sessionId),
  mcpRemove: (sessionId: string, name: string) =>
    ipcRenderer.invoke(IPC.AGENT_MCP_REMOVE, sessionId, name),
  mcpAdd: (sessionId: string, input: unknown) =>
    ipcRenderer.invoke(IPC.AGENT_MCP_ADD, sessionId, input),
  pickFiles: () => ipcRenderer.invoke(IPC.DIALOG_PICK_FILES),
  agentCommands: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_COMMANDS_GET, sessionId),
  agentModels: () => ipcRenderer.invoke(IPC.AGENT_MODELS_GET),
  onAgentModels: (callback: () => void) => {
    const handler = (): void => callback();
    ipcRenderer.on(IPC.AGENT_MODELS, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_MODELS, handler);
  },
  onAgentCommands: (callback: (info: { sessionId: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: { sessionId: string }): void =>
      callback(info);
    ipcRenderer.on(IPC.AGENT_COMMANDS, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_COMMANDS, handler);
  },
  countUncommitted: (worktreePath: string) => ipcRenderer.invoke(IPC.GIT_UNCOMMITTED, worktreePath),
  agentInterrupt: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_INTERRUPT, sessionId),
  agentStates: () => ipcRenderer.invoke(IPC.AGENT_STATES),
  getBackgroundCommands: () => ipcRenderer.invoke(IPC.AGENT_BACKGROUND_ALL),
  onBackgroundCommands: (callback: (info: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
      callback(payload);
    ipcRenderer.on(IPC.AGENT_BACKGROUND, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_BACKGROUND, handler);
  },
  getAgentSettings: (sessionId: string) => ipcRenderer.invoke(IPC.AGENT_SETTINGS_GET, sessionId),
  configureAgent: (sessionId: string, settings: unknown) =>
    ipcRenderer.invoke(IPC.AGENT_CONFIGURE, sessionId, settings),
  onAgentState: (callback: (info: { sessionId: string; state: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      info: { sessionId: string; state: string },
    ): void => callback(info);
    ipcRenderer.on(IPC.AGENT_STATE, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_STATE, handler);
  },
  onAgentEvent: (callback: (event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
      callback(payload);
    ipcRenderer.on(IPC.AGENT_EVENT, handler);
    return () => ipcRenderer.removeListener(IPC.AGENT_EVENT, handler);
  },
  getPendingPermissions: () => ipcRenderer.invoke(IPC.PERMISSION_PENDING),
  answerPermission: (id: string, answer: unknown) =>
    ipcRenderer.invoke(IPC.PERMISSION_ANSWER, id, answer),
  onPermissionRequest: (callback: (request: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, request: unknown): void =>
      callback(request);
    ipcRenderer.on(IPC.PERMISSION_REQUEST, handler);
    return () => ipcRenderer.removeListener(IPC.PERMISSION_REQUEST, handler);
  },
  onPermissionResolved: (callback: (id: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string): void => callback(id);
    ipcRenderer.on(IPC.PERMISSION_RESOLVED, handler);
    return () => ipcRenderer.removeListener(IPC.PERMISSION_RESOLVED, handler);
  },
  readTranscript: (terminalId: string, cursor: unknown) =>
    ipcRenderer.invoke(IPC.TRANSCRIPT_READ, terminalId, cursor),
  watchTranscript: (terminalId: string, callback: () => void) => {
    void ipcRenderer.invoke(IPC.TRANSCRIPT_WATCH_START, terminalId);
    const handler = (_event: Electron.IpcRendererEvent, payload: { terminalId: string }): void => {
      if (payload.terminalId === terminalId) callback();
    };
    ipcRenderer.on(IPC.TRANSCRIPT_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC.TRANSCRIPT_CHANGED, handler);
      void ipcRenderer.invoke(IPC.TRANSCRIPT_WATCH_STOP, terminalId);
    };
  },
  pickImage: () => ipcRenderer.invoke("dialog:pick-image"),
  pickDirectory: () => ipcRenderer.invoke("dialog:pick-directory"),
  saveWorkspaceIcon: (workspaceId: string, dataUrl: string) =>
    ipcRenderer.invoke("workspace:save-icon", workspaceId, dataUrl),
  openInVSCode: (path: string) => ipcRenderer.invoke(IPC.IDE_OPEN_VSCODE, path),
  openExternalUrl: (url: string) => ipcRenderer.invoke(IPC.EXTERNAL_OPEN_URL, url),

  onFullscreenChange: (callback: (value: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => callback(value);
    ipcRenderer.on("window:fullscreen-change", handler);
    return () => ipcRenderer.removeListener("window:fullscreen-change", handler);
  },

  getTerminals: () => ipcRenderer.invoke(IPC.TERMINAL_GET_ALL),
  getTerminalsBySession: (sessionId: string) =>
    ipcRenderer.invoke(IPC.TERMINAL_GET_BY_SESSION, sessionId),
  createTerminal: (input: unknown) => ipcRenderer.invoke(IPC.TERMINAL_CREATE, input),
  createSessionTerminal: (input: unknown) =>
    ipcRenderer.invoke(IPC.TERMINAL_CREATE_FOR_SESSION, input),
  deleteTerminal: (id: string) => ipcRenderer.invoke(IPC.TERMINAL_DELETE, id),
  reorderTerminals: (sessionId: string, orderedIds: string[]) =>
    ipcRenderer.invoke(IPC.TERMINAL_REORDER, sessionId, orderedIds),

  ptyEnsure: (terminalId: string, cols?: number, rows?: number) =>
    ipcRenderer.invoke(IPC.PTY_ENSURE, terminalId, cols, rows),
  ptyWrite: (terminalId: string, data: string) => ipcRenderer.send(IPC.PTY_WRITE, terminalId, data),
  ptyResize: (terminalId: string, cols: number, rows: number) =>
    ipcRenderer.send(IPC.PTY_RESIZE, terminalId, cols, rows),
  ptyKill: (terminalId: string) => ipcRenderer.invoke(IPC.PTY_KILL, terminalId),
  ptyGetSnapshot: (terminalId: string) => ipcRenderer.invoke(IPC.PTY_GET_SNAPSHOT, terminalId),
  getTerminalRuntimes: () => ipcRenderer.invoke(IPC.TERMINAL_RUNTIMES),
  onTerminalRuntime: (callback: (info: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
      callback(payload);
    ipcRenderer.on(IPC.TERMINAL_RUNTIME, handler);
    return () => ipcRenderer.removeListener(IPC.TERMINAL_RUNTIME, handler);
  },

  onPtyData: (terminalId: string, callback: (data: string) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; data: string },
    ): void => {
      if (payload.id === terminalId) callback(payload.data);
    };
    ipcRenderer.on(IPC.PTY_DATA, handler);
    return () => ipcRenderer.removeListener(IPC.PTY_DATA, handler);
  },

  onPtyExit: (
    terminalId: string,
    callback: (info: { exitCode: number; signal?: number }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; exitCode: number; signal?: number },
    ): void => {
      if (payload.id === terminalId)
        callback({ exitCode: payload.exitCode, signal: payload.signal });
    };
    ipcRenderer.on(IPC.PTY_EXIT, handler);
    return () => ipcRenderer.removeListener(IPC.PTY_EXIT, handler);
  },

  onTerminalStatus: (callback: (info: { id: string; status: TerminalStatus }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; status: TerminalStatus },
    ): void => callback(payload);
    ipcRenderer.on(IPC.TERMINAL_STATUS, handler);
    return () => ipcRenderer.removeListener(IPC.TERMINAL_STATUS, handler);
  },

  speech: {
    available: () => ipcRenderer.invoke(IPC.SPEECH_AVAILABLE),
    listDevices: () => ipcRenderer.invoke(IPC.SPEECH_LIST_DEVICES),
    listLocales: () => ipcRenderer.invoke(IPC.SPEECH_LIST_LOCALES),
    requestAuth: () => ipcRenderer.invoke(IPC.SPEECH_REQUEST_AUTH),
    start: (opts: {
      locale?: string;
      deviceId?: number;
      onDevice?: boolean;
      continuous?: boolean;
    }) => ipcRenderer.invoke(IPC.SPEECH_START, opts),
    stop: () => ipcRenderer.invoke(IPC.SPEECH_STOP),
    cancel: () => ipcRenderer.invoke(IPC.SPEECH_CANCEL),
    onEvent: (callback: SpeechCallback) => {
      speechSubscribers.add(callback);
      return () => {
        speechSubscribers.delete(callback);
      };
    },
  },

  getEnvironmentStatus: () => ipcRenderer.invoke(IPC.ENV_STATUS),
  setupEnvironments: () => ipcRenderer.invoke(IPC.ENV_SETUP),
  restartEnvironments: () => ipcRenderer.invoke(IPC.ENV_RESTART),
  repairEnvironmentAddresses: () => ipcRenderer.invoke(IPC.ENV_REPAIR_ADDRESSES),
  uninstallEnvironments: () => ipcRenderer.invoke(IPC.ENV_UNINSTALL),
  showEnvironmentLog: () => ipcRenderer.invoke(IPC.ENV_SHOW_LOG),
  onEnvironmentSetup: (callback: (state: EnvSetupState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: EnvSetupState): void =>
      callback(state);
    ipcRenderer.on(IPC.ENV_SETUP_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.ENV_SETUP_PROGRESS, handler);
  },
  detectEnvironment: (path: string) => ipcRenderer.invoke(IPC.ENV_DETECT, path),
  detectProjectEnvironment: (projectId: string) =>
    ipcRenderer.invoke(IPC.ENV_DETECT_PROJECT, projectId),
  getProjectEnvironment: (projectId: string) => ipcRenderer.invoke(IPC.ENV_PROJECT_GET, projectId),
  saveProjectEnvironment: (projectId: string, environment: ProjectEnvironment) =>
    ipcRenderer.invoke(IPC.ENV_PROJECT_SAVE, projectId, environment),
  checkEnvironment: (input: EnvCheckInput) => ipcRenderer.invoke(IPC.ENV_CHECK, input),
  stopEnvironmentCheck: (projectPath: string) =>
    ipcRenderer.invoke(IPC.ENV_CHECK_STOP, projectPath),
  getEnvironmentCheck: (projectPath: string) =>
    ipcRenderer.invoke(IPC.ENV_CHECK_STATE, projectPath),
  onEnvironmentCheck: (callback: (state: EnvCheckState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: EnvCheckState): void =>
      callback(state);
    ipcRenderer.on(IPC.ENV_CHECK_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.ENV_CHECK_PROGRESS, handler);
  },
  getCleanBase: (projectId: string) => ipcRenderer.invoke(IPC.ENV_BASE_GET, projectId),
  buildCleanBase: (input: CleanBaseInput) => ipcRenderer.invoke(IPC.ENV_BASE_BUILD, input),
  stopCleanBase: (projectId: string) => ipcRenderer.invoke(IPC.ENV_BASE_STOP, projectId),
  onCleanBase: (callback: (state: CleanBaseState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: CleanBaseState): void =>
      callback(state);
    ipcRenderer.on(IPC.ENV_BASE_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.ENV_BASE_PROGRESS, handler);
  },

  usage: {
    getSummary: () => ipcRenderer.invoke(IPC.USAGE_GET_SUMMARY),
    getStats: (granularity: string) => ipcRenderer.invoke(IPC.USAGE_GET_STATS, granularity),
    refresh: () => ipcRenderer.invoke(IPC.USAGE_REFRESH),
    watchStart: () => ipcRenderer.invoke(IPC.USAGE_WATCH_START),
    watchStop: () => ipcRenderer.invoke(IPC.USAGE_WATCH_STOP),
    onChanged: (callback: () => void) => {
      usageSubscribers.add(callback);
      return () => {
        usageSubscribers.delete(callback);
      };
    },
  },
};

contextBridge.exposeInMainWorld("api", api);
