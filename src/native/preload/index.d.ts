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
  StartWorkInput
} from '@native/db/types';

interface NexAPI {
  getAppInfo: () => Promise<{
    platform: string;
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

  showWindow: () => Promise<void>;
  detectAgents: () => Promise<Agent[]>;
  cloneAgentAccount: (input: CloneAgentAccountInput) => Promise<AgentAccount>;
  startWork: (input: StartWorkInput) => Promise<Session>;
  detectBaseBranch: (repoPath: string) => Promise<string>;
  isGitRepo: (repoPath: string) => Promise<boolean>;
  listBranches: (repoPath: string) => Promise<string[]>;

  pickImage: () => Promise<string | null>;
  pickDirectory: () => Promise<string | null>;
  saveWorkspaceIcon: (workspaceId: string, dataUrl: string) => Promise<string | null>;

  onFullscreenChange: (callback: (value: boolean) => void) => () => void;
}

declare global {
  interface Window {
    api: NexAPI;
  }
}
