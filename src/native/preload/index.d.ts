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
  TerminalType
} from '@native/db/types';
import type { AvailableAgent, InstallAgentResult } from '@native/agents/detect';
import type { WorktreeDiffOptions, WorktreeFileVersionsInput } from '@native/git/git';
import type { GitInfo, CloneProgress, CloneResult } from '@native/git/clone';
import type { GhInfo, GithubOwner, GithubRepo } from '@native/git/github';
import type { UsageGranularity, UsageStats, UsageSummary } from '@native/usage/types';

interface NexAPI {
  getAppInfo: () => Promise<{
    platform: string;
    version: string;
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
  deleteSession: (id: string) => Promise<void>;
  reorderSessions: (orderedIds: string[]) => Promise<void>;
  readSessionNotes: (sessionId: string) => Promise<string>;
  writeSessionNotes: (sessionId: string, content: string) => Promise<void>;

  showWindow: () => Promise<void>;
  detectAgents: () => Promise<AvailableAgent[]>;
  installAgent: (slug: string) => Promise<InstallAgentResult>;
  cloneAgentAccount: (input: CloneAgentAccountInput) => Promise<AgentAccount>;
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
    worktreePath: string
  ) => Promise<Array<{ path: string; type: 'file' | 'folder' }>>;
  getWorktreeDiff: (worktreePath: string, options?: WorktreeDiffOptions) => Promise<string>;
  readWorktreeFileVersions: (
    input: WorktreeFileVersionsInput
  ) => Promise<{ oldContents: string | null; newContents: string | null }>;
  discardWorktreeFile: (worktreePath: string, path: string, prevPath?: string) => Promise<void>;
  watchWorktree: (worktreePath: string, callback: () => void) => () => void;

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

  onPtyData: (terminalId: string, callback: (data: string) => void) => () => void;
  onPtyExit: (
    terminalId: string,
    callback: (info: { exitCode: number; signal?: number }) => void
  ) => () => void;

  onTerminalStatus: (
    callback: (info: { id: string; status: TerminalStatus }) => void
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
        type: 'state' | 'partial' | 'final' | 'error' | 'end' | 'devicesChanged';
        state?: string;
        text?: string;
        confidence?: number;
        timestampMs?: number;
        code?: string;
        message?: string;
      }) => void
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
