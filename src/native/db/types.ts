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

export interface ProjectSetup {
  install: { on: boolean; command: string };
  copy: { on: boolean; files: string[] };
  script: { on: boolean; path: string };
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  branchPrefix: string;
  baseBranch: string;
  pullBase: boolean;
  setup: ProjectSetup | null;
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
  baseBranch?: string;
  pullBase?: boolean;
  setup?: ProjectSetup | null;
  quickCommands?: QuickCommand[];
}

export interface UpdateProjectInput {
  name?: string;
  path?: string;
  branchPrefix?: string;
  baseBranch?: string;
  pullBase?: boolean;
  setup?: ProjectSetup | null;
  quickCommands?: QuickCommand[];
  sortOrder?: number;
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
  keychainService: string | null;
  email: string | null;
  color: string | null;
  createdAt: string;
}

export interface CreateAgentAccountInput {
  agentId: string;
  name: string;
  configDir: string;
  isDefault?: boolean;
  email?: string | null;
  color?: string | null;
}

export interface UpdateAgentAccountInput {
  name?: string;
  email?: string | null;
  configDir?: string;
  isDefault?: boolean;
  keychainService?: string | null;
}

export type SessionStatus = "active" | "done" | "pr";

export type PanelLayout = Record<string, number>;

export interface Session {
  id: string;
  projectId: string;
  agentId: string | null;
  accountId: string | null;
  name: string;
  title: string;
  branch: string;
  baseBranch: string;
  worktreePath: string;
  notesPath: string;
  symlinks: string[];
  status: SessionStatus;
  opens: number;
  createdAt: string;
  lastOpened: string;
  diffVisible: boolean;
  notesVisible: boolean;
  verticalLayout: PanelLayout | null;
  horizontalLayout: PanelLayout | null;
  sortOrder: number;
  width: number;
}

export interface CreateSessionInput {
  projectId: string;
  agentId?: string;
  accountId?: string;
  name: string;
  title?: string;
  branch: string;
  baseBranch: string;
  worktreePath: string;
  notesPath?: string;
  symlinks?: string[];
}

export interface UpdateSessionInput {
  title?: string;
  accountId?: string;
  status?: SessionStatus;
  opens?: number;
  lastOpened?: string;
  diffVisible?: boolean;
  notesVisible?: boolean;
  verticalLayout?: PanelLayout | null;
  horizontalLayout?: PanelLayout | null;
  width?: number;
}

export interface StartWorkInput {
  projectId: string;
  name: string;
  title?: string;
  agentId?: string;
  accountId?: string;
  baseBranch?: string;
  prompt?: string;
  agentSettings?: { model: string; effort: string; mode: string };
}

export interface CloneAgentAccountInput {
  agentId: string;
  name: string;
  copyConfig?: boolean;
}

export type TerminalStatus = "idle" | "running" | "waiting";
export type TerminalType = "agent" | "shell";

export interface Terminal {
  id: string;
  sessionId: string;
  name: string;
  command: string | null;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  isPrimary: boolean;
  sortOrder: number;
  status: TerminalStatus | null;
  type: TerminalType;
  runCommand: string | null;
  agentSessionId: string | null;
  createdAt: string;
}

export interface CreateTerminalInput {
  sessionId: string;
  name: string;
  command?: string | null;
  args?: string[];
  cwd: string;
  env?: Record<string, string>;
  isPrimary?: boolean;
  type?: TerminalType;
  runCommand?: string | null;
}

export interface UpdateTerminalInput {
  name?: string;
  sortOrder?: number;
}

export type InterfaceSize = "compact" | "default" | "large";
export type MotionPreference = "system" | "reduce" | "full";
export type TerminalCursor = "block" | "bar" | "underline";

export interface Preferences {
  ide: string;
  terminalApp: string;
  quitWithAgents: "ask" | "quit";
  confirmClose: boolean;
  interfaceSize: InterfaceSize;
  codeFontSize: string;
  reduceTransparency: boolean;
  motion: MotionPreference;
  notifyNeedsYou: boolean;
  notifyFinished: boolean;
  notifyErrors: boolean;
  notifyUsage: boolean;
  sound: string;
  onlyInBackground: boolean;
  dockBadge: boolean;
  shortcuts: Record<string, string>;
  model: string;
  effort: string;
  permissions: string;
  extraArgs: string;
  shell: string;
  cursor: TerminalCursor;
  scrollback: string;
  copyOnSelect: boolean;
  optionAsMeta: boolean;
  diffView: "unified" | "split";
  spellcheck: boolean;
  showUsage: boolean;
  warnAt: string;
  dailyAlert: string;
}
