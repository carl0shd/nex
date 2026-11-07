import type { LocalRepos } from "@native/git/discover";
import type { AgentModel } from "@native/agents/agent-models";
import type { ContextUsage } from "@native/agents/context-usage";
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  AgentAccount,
  CreateAgentAccountInput,
  UpdateAgentAccountInput,
  CloneAgentAccountInput,
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  StartWorkInput,
  Terminal,
  CreateTerminalInput,
  TerminalStatus,
  TerminalType,
} from "@native/db/types";
import type { AvailableAgent, InstallAgentResult } from "@native/agents/detect";
import type { WorktreeDiffOptions, WorktreeFileVersionsInput } from "@native/git/git";
import type { GitInfo, CloneProgress, CloneResult } from "@native/git/clone";
import type { RepoInspection } from "@native/git/inspect";
import type { FinishSignInInput, ReauthResult, SignInResult } from "@native/agents/sign-in";
import type { TranscriptChunk, TranscriptCursor } from "@native/agents/transcript";
import type { PermissionAnswer, PermissionRequest } from "@native/agents/permissions";
import type { AgentLiveEvent, AgentMessage, AgentRunState } from "@native/agents/agent-runner";
import type { AgentCommand } from "@native/agents/agent-commands";
import type { BackgroundCommand } from "@native/agents/background-commands";
import type { TerminalRuntime } from "@native/pty/manager";
import type { McpAddInput, McpServer } from "@native/agents/mcp-servers";
import type { AgentCommandChange } from "@native/agents/version";
import type { AgentSettings } from "@native/agents/agent-settings";
import type { GhInfo, GithubOwner, GithubRepo } from "@native/git/github";
import type { UsageGranularity, UsageStats, UsageSummary } from "@native/usage/types";

interface NexAPI {
  getOpenAtLogin: () => Promise<boolean>;
  setOpenAtLogin: (openAtLogin: boolean) => Promise<void>;
  playSound: (name: string) => Promise<void>;
  setDockBadge: (count: number) => Promise<void>;
  listShells: () => Promise<string[]>;
  installedApps: (names: string[]) => Promise<string[]>;
  findLocalRepos: (exclude: string[]) => Promise<LocalRepos>;
  openWith: (appName: string, path: string) => Promise<boolean>;
  setZoomFactor: (factor: number) => void;
  getAppInfo: () => Promise<{
    platform: string;
    version: string;
    dataDir: string;
    versions: { electron: string; chrome: string; node: string };
  }>;

  getWorkspaces: () => Promise<Workspace[]>;
  getWorkspaceById: (id: string) => Promise<Workspace | null>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>;
  updateWorkspace: (id: string, input: UpdateWorkspaceInput) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;

  getProjects: () => Promise<Project[]>;
  getProjectsByWorkspace: (workspaceId: string) => Promise<Project[]>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;

  getSetting: <T>(key: string, fallback: T) => Promise<T>;
  setSetting: (key: string, value: unknown) => Promise<void>;

  getAgents: () => Promise<Agent[]>;
  getAgentBySlug: (slug: string) => Promise<Agent | null>;
  createAgent: (input: CreateAgentInput) => Promise<Agent>;
  updateAgent: (id: string, input: UpdateAgentInput) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;

  getAgentAccounts: () => Promise<AgentAccount[]>;
  getAgentAccountsByAgent: (agentId: string) => Promise<AgentAccount[]>;
  createAgentAccount: (input: CreateAgentAccountInput) => Promise<AgentAccount>;
  updateAgentAccount: (id: string, input: UpdateAgentAccountInput) => Promise<AgentAccount>;
  deleteAgentAccount: (id: string) => Promise<void>;

  getSessions: () => Promise<Session[]>;
  getSessionsByProject: (projectId: string) => Promise<Session[]>;
  getActiveSessions: () => Promise<Session[]>;
  createSession: (input: CreateSessionInput) => Promise<Session>;
  updateSession: (id: string, input: UpdateSessionInput) => Promise<Session>;
  deleteSession: (id: string, keepBranch?: boolean) => Promise<void>;
  reorderSessions: (orderedIds: string[]) => Promise<void>;
  readSessionNotes: (sessionId: string) => Promise<string>;
  writeSessionNotes: (sessionId: string, content: string) => Promise<void>;

  showWindow: () => Promise<void>;
  detectAgents: () => Promise<AvailableAgent[]>;
  getAgentVersion: (agentId: string) => Promise<string | null>;
  upgradeAgent: (agentId: string) => Promise<string | null>;
  pickAgentCommand: (agentId: string) => Promise<AgentCommandChange | null>;
  inspectRepo: (path: string) => Promise<RepoInspection>;
  pathForFile: (file: File) => string;
  openInFinder: (path: string) => Promise<boolean>;
  installAgent: (slug: string) => Promise<InstallAgentResult>;
  cloneAgentAccount: (input: CloneAgentAccountInput) => Promise<AgentAccount>;
  signInAccount: () => Promise<SignInResult>;
  reauthAccount: (accountId: string) => Promise<ReauthResult>;
  cancelSignIn: () => Promise<void>;
  finishSignIn: (input: FinishSignInInput) => Promise<AgentAccount>;
  discardSignIn: (configDir: string) => Promise<void>;
  onSignInUrl: (callback: (url: string) => void) => () => void;
  startWork: (input: StartWorkInput) => Promise<Session>;
  detectGit: () => Promise<GitInfo>;
  cloneRepository: (url: string, parentDir: string) => Promise<CloneResult>;
  detectGh: () => Promise<GhInfo>;
  listGithubOwners: () => Promise<GithubOwner[]>;
  listGithubRepos: (owner: string) => Promise<GithubRepo[]>;
  cloneGithubRepo: (nameWithOwner: string, parentDir: string) => Promise<CloneResult>;
  onCloneProgress: (callback: (progress: CloneProgress & { repo?: string }) => void) => () => void;
  detectBaseBranch: (repoPath: string) => Promise<string>;
  isGitRepo: (repoPath: string) => Promise<boolean>;
  listBranches: (repoPath: string) => Promise<string[]>;
  listWorktreeFiles: (
    worktreePath: string,
  ) => Promise<Array<{ path: string; type: "file" | "folder" }>>;
  getWorktreeDiff: (worktreePath: string, options?: WorktreeDiffOptions) => Promise<string>;
  readWorktreeFileVersions: (
    input: WorktreeFileVersionsInput,
  ) => Promise<{ oldContents: string | null; newContents: string | null }>;
  discardWorktreeFile: (worktreePath: string, path: string, prevPath?: string) => Promise<void>;
  watchWorktree: (worktreePath: string, callback: () => void) => () => void;
  agentSend: (sessionId: string, content: AgentMessage) => Promise<void>;
  switchAgentAccount: (sessionId: string, accountId: string) => Promise<void>;
  agentWarm: (sessionId: string) => Promise<void>;
  mcpStatus: (sessionId: string) => Promise<McpServer[]>;
  mcpToggle: (sessionId: string, name: string, enabled: boolean) => Promise<McpServer[]>;
  mcpReconnect: (sessionId: string, name: string) => Promise<McpServer[]>;
  mcpSignIn: (sessionId: string, name: string) => Promise<McpServer[]>;
  mcpRemove: (sessionId: string, name: string) => Promise<McpServer[]>;
  mcpAdd: (sessionId: string, input: McpAddInput) => Promise<McpServer[]>;
  agentContext: (sessionId: string) => Promise<ContextUsage | null>;
  lastAgentContext: (sessionId: string) => Promise<ContextUsage | null>;
  pickFiles: () => Promise<string[]>;
  agentCommands: (sessionId: string) => Promise<AgentCommand[]>;
  agentModels: () => Promise<AgentModel[]>;
  onAgentModels: (callback: () => void) => () => void;
  onAgentCommands: (callback: (info: { sessionId: string }) => void) => () => void;
  countUncommitted: (worktreePath: string) => Promise<number>;
  agentInterrupt: (sessionId: string) => Promise<void>;
  agentStates: () => Promise<Record<string, AgentRunState>>;
  getBackgroundCommands: () => Promise<Record<string, BackgroundCommand[]>>;
  onBackgroundCommands: (
    callback: (info: { sessionId: string; commands: BackgroundCommand[] }) => void,
  ) => () => void;
  getAgentSettings: (sessionId: string) => Promise<AgentSettings>;
  configureAgent: (sessionId: string, settings: AgentSettings) => Promise<void>;
  onAgentState: (
    callback: (info: { sessionId: string; state: AgentRunState }) => void,
  ) => () => void;
  onAgentEvent: (callback: (event: AgentLiveEvent) => void) => () => void;
  getPendingPermissions: () => Promise<PermissionRequest[]>;
  answerPermission: (id: string, answer: PermissionAnswer) => Promise<void>;
  onPermissionRequest: (callback: (request: PermissionRequest) => void) => () => void;
  onPermissionResolved: (callback: (id: string) => void) => () => void;
  readTranscript: (terminalId: string, cursor: TranscriptCursor | null) => Promise<TranscriptChunk>;
  watchTranscript: (terminalId: string, callback: () => void) => () => void;

  pickImage: () => Promise<string | null>;
  pickDirectory: () => Promise<string | null>;
  saveWorkspaceIcon: (workspaceId: string, dataUrl: string) => Promise<string | null>;
  openInVSCode: (path: string) => Promise<boolean>;
  openExternalUrl: (url: string) => Promise<boolean>;

  onFullscreenChange: (callback: (value: boolean) => void) => () => void;

  getTerminals: () => Promise<Terminal[]>;
  getTerminalsBySession: (sessionId: string) => Promise<Terminal[]>;
  createTerminal: (input: CreateTerminalInput) => Promise<Terminal>;
  createSessionTerminal: (input: {
    sessionId: string;
    type: TerminalType;
    name?: string;
    runCommand?: string;
  }) => Promise<Terminal>;
  deleteTerminal: (id: string) => Promise<void>;
  reorderTerminals: (sessionId: string, orderedIds: string[]) => Promise<void>;

  ptyEnsure: (terminalId: string, cols?: number, rows?: number) => Promise<boolean>;
  ptyWrite: (terminalId: string, data: string) => void;
  ptyResize: (terminalId: string, cols: number, rows: number) => void;
  ptyKill: (terminalId: string) => Promise<void>;
  ptyGetSnapshot: (terminalId: string) => Promise<{ data: string; alive: boolean } | null>;
  getTerminalRuntimes: () => Promise<Record<string, TerminalRuntime>>;
  onTerminalRuntime: (
    callback: (info: { id: string; runtime: TerminalRuntime | null }) => void,
  ) => () => void;

  onPtyData: (terminalId: string, callback: (data: string) => void) => () => void;
  onPtyExit: (
    terminalId: string,
    callback: (info: { exitCode: number; signal?: number }) => void,
  ) => () => void;

  onTerminalStatus: (
    callback: (info: { id: string; status: TerminalStatus }) => void,
  ) => () => void;

  speech: {
    available: () => Promise<{
      available: boolean;
      reason?: string;
      authStatus?: string;
      micStatus?: string;
      recognizerLocale?: string;
      supportsOnDevice?: boolean;
    }>;
    listDevices: () => Promise<
      Array<{ id: number; name: string; isDefault: boolean; isBuiltIn: boolean }>
    >;
    listLocales: () => Promise<
      Array<{ identifier: string; displayName: string; supportsOnDevice: boolean }>
    >;
    requestAuth: () => Promise<{ authorized: boolean; status: string }>;
    start: (opts: {
      locale?: string;
      deviceId?: number;
      onDevice?: boolean;
      continuous?: boolean;
    }) => Promise<void>;
    stop: () => Promise<void>;
    cancel: () => Promise<void>;
    onEvent: (
      callback: (event: {
        type: "state" | "partial" | "final" | "error" | "end" | "devicesChanged" | "level";
        state?: string;
        level?: number;
        text?: string;
        confidence?: number;
        timestampMs?: number;
        code?: string;
        message?: string;
      }) => void,
    ) => () => void;
  };

  usage: {
    getSummary: () => Promise<UsageSummary>;
    getStats: (granularity: UsageGranularity) => Promise<UsageStats>;
    refresh: () => Promise<void>;
    watchStart: () => Promise<void>;
    watchStop: () => Promise<void>;
    onChanged: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    api: NexAPI;
  }
}
