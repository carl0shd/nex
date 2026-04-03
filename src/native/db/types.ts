export interface Workspace {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  collapsed: boolean;
  createdAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  color: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  color?: string;
  sortOrder?: number;
  collapsed?: boolean;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  path: string;
}

export interface UpdateProjectInput {
  name?: string;
  path?: string;
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

export interface QuickCommand {
  label: string;
}
