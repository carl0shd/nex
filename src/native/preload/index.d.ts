import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Worktree,
  CreateWorktreeInput,
  UpdateWorktreeInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput
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

  getWorktrees: () => Promise<Worktree[]>;
  getWorktreesByProject: (projectId: string) => Promise<Worktree[]>;
  createWorktree: (input: CreateWorktreeInput) => Promise<Worktree>;
  updateWorktree: (id: string, input: UpdateWorktreeInput) => Promise<Worktree>;
  deleteWorktree: (id: string) => Promise<void>;

  getTasks: () => Promise<Task[]>;
  getTasksByProject: (projectId: string) => Promise<Task[]>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  getSetting: <T>(key: string, fallback: T) => Promise<T>;
  setSetting: (key: string, value: unknown) => Promise<void>;

  onFullscreenChange: (callback: (value: boolean) => void) => () => void;
}

declare global {
  interface Window {
    api: NexAPI;
  }
}
