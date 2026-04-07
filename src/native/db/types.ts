export interface Workspace {
  id: string;
  name: string;
  color: string;
  icon: string;
  customImage: string | null;
  sortOrder: number;
  archived: boolean;
  collapsed: boolean;
  createdAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  color: string;
  icon?: string;
  customImage?: string | null;
}

export interface UpdateWorkspaceInput {
  name?: string;
  color?: string;
  icon?: string;
  customImage?: string | null;
  sortOrder?: number;
  archived?: boolean;
  collapsed?: boolean;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  branchPrefix: string;
  quickCommands: QuickCommand[];
  sortOrder: number;
  createdAt: string;
}

export interface QuickCommand {
  name: string;
  command: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  path: string;
  branchPrefix?: string;
  quickCommands?: QuickCommand[];
}

export interface UpdateProjectInput {
  name?: string;
  path?: string;
  branchPrefix?: string;
  quickCommands?: QuickCommand[];
  sortOrder?: number;
}

export interface Worktree {
  id: string;
  projectId: string;
  branch: string;
  path: string;
  dotColor: string;
  active: boolean;
  notes: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreateWorktreeInput {
  projectId: string;
  branch: string;
  path: string;
  dotColor?: string;
}

export interface UpdateWorktreeInput {
  branch?: string;
  path?: string;
  dotColor?: string;
  active?: boolean;
  notes?: string;
  sortOrder?: number;
}

export type TaskStatus = 'running' | 'idle' | 'done' | 'error';

export interface Task {
  id: string;
  projectId: string;
  worktreeId: string | null;
  name: string;
  status: TaskStatus;
  createdAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  worktreeId?: string;
  name: string;
}

export interface UpdateTaskInput {
  name?: string;
  status?: TaskStatus;
  worktreeId?: string | null;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  command: string;
  defaultConfigDir: string;
  configEnvVar: string;
  args: string[];
  resumeArgs: string[];
  skipPermissionsArgs: string[];
  builtin: boolean;
  createdAt: string;
}

export interface CreateAgentInput {
  name: string;
  slug: string;
  command: string;
  defaultConfigDir?: string;
  configEnvVar?: string;
  args?: string[];
  resumeArgs?: string[];
  skipPermissionsArgs?: string[];
}

export interface UpdateAgentInput {
  name?: string;
  command?: string;
  args?: string[];
  resumeArgs?: string[];
  skipPermissionsArgs?: string[];
}

export interface AgentAccount {
  id: string;
  agentId: string;
  name: string;
  configDir: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAgentAccountInput {
  agentId: string;
  name: string;
  configDir: string;
  isDefault?: boolean;
}

export interface UpdateAgentAccountInput {
  name?: string;
  configDir?: string;
  isDefault?: boolean;
}

export type SessionStatus = 'active' | 'done' | 'pr';

export interface Session {
  id: string;
  projectId: string;
  agentId: string | null;
  accountId: string | null;
  name: string;
  branch: string;
  baseBranch: string;
  worktreePath: string;
  notesPath: string;
  symlinks: string[];
  status: SessionStatus;
  opens: number;
  createdAt: string;
  lastOpened: string;
}

export interface CreateSessionInput {
  projectId: string;
  agentId?: string;
  accountId?: string;
  name: string;
  branch: string;
  baseBranch: string;
  worktreePath: string;
  notesPath?: string;
  symlinks?: string[];
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  opens?: number;
  lastOpened?: string;
}

export interface ChangedFile {
  name: string;
  added: number;
  removed: number;
  status: 'modified' | 'added' | 'deleted';
}

export interface WorktreeTab {
  name: string;
  dotColor: string;
  active?: boolean;
}
