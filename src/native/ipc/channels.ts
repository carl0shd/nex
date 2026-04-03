export const IPC = {
  APP_GET_INFO: 'app:get-info',
  FULLSCREEN_CHANGE: 'window:fullscreen-change',

  WORKSPACE_GET_ALL: 'workspace:get-all',
  WORKSPACE_GET_BY_ID: 'workspace:get-by-id',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',

  PROJECT_GET_ALL: 'project:get-all',
  PROJECT_GET_BY_WORKSPACE: 'project:get-by-workspace',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',

  WORKTREE_GET_ALL: 'worktree:get-all',
  WORKTREE_GET_BY_PROJECT: 'worktree:get-by-project',
  WORKTREE_CREATE: 'worktree:create',
  WORKTREE_UPDATE: 'worktree:update',
  WORKTREE_DELETE: 'worktree:delete',

  TASK_GET_ALL: 'task:get-all',
  TASK_GET_BY_PROJECT: 'task:get-by-project',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set'
} as const;

export type IPCChannel = (typeof IPC)[keyof typeof IPC];
