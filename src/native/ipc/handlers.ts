import { ipcMain } from 'electron';
import { IPC } from './channels';
import * as workspaceRepo from '@native/db/repositories/workspace.repo';
import * as projectRepo from '@native/db/repositories/project.repo';
import * as worktreeRepo from '@native/db/repositories/worktree.repo';
import * as taskRepo from '@native/db/repositories/task.repo';
import * as settings from '@native/db/repositories/settings.repo';

export function registerIPCHandlers(): void {
  ipcMain.handle(IPC.APP_GET_INFO, () => ({
    platform: process.platform,
    versions: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    }
  }));

  ipcMain.handle(IPC.WORKSPACE_GET_ALL, () => workspaceRepo.getAll());
  ipcMain.handle(IPC.WORKSPACE_GET_BY_ID, (_, id) => workspaceRepo.getById(id));
  ipcMain.handle(IPC.WORKSPACE_CREATE, (_, input) => workspaceRepo.create(input));
  ipcMain.handle(IPC.WORKSPACE_UPDATE, (_, id, input) => workspaceRepo.update(id, input));
  ipcMain.handle(IPC.WORKSPACE_DELETE, (_, id) => workspaceRepo.remove(id));

  ipcMain.handle(IPC.PROJECT_GET_ALL, () => projectRepo.getAll());
  ipcMain.handle(IPC.PROJECT_GET_BY_WORKSPACE, (_, workspaceId) =>
    projectRepo.getByWorkspace(workspaceId)
  );
  ipcMain.handle(IPC.PROJECT_CREATE, (_, input) => projectRepo.create(input));
  ipcMain.handle(IPC.PROJECT_UPDATE, (_, id, input) => projectRepo.update(id, input));
  ipcMain.handle(IPC.PROJECT_DELETE, (_, id) => projectRepo.remove(id));

  ipcMain.handle(IPC.WORKTREE_GET_ALL, () => worktreeRepo.getAll());
  ipcMain.handle(IPC.WORKTREE_GET_BY_PROJECT, (_, projectId) =>
    worktreeRepo.getByProject(projectId)
  );
  ipcMain.handle(IPC.WORKTREE_CREATE, (_, input) => worktreeRepo.create(input));
  ipcMain.handle(IPC.WORKTREE_UPDATE, (_, id, input) => worktreeRepo.update(id, input));
  ipcMain.handle(IPC.WORKTREE_DELETE, (_, id) => worktreeRepo.remove(id));

  ipcMain.handle(IPC.TASK_GET_ALL, () => taskRepo.getAll());
  ipcMain.handle(IPC.TASK_GET_BY_PROJECT, (_, projectId) => taskRepo.getByProject(projectId));
  ipcMain.handle(IPC.TASK_CREATE, (_, input) => taskRepo.create(input));
  ipcMain.handle(IPC.TASK_UPDATE, (_, id, input) => taskRepo.update(id, input));
  ipcMain.handle(IPC.TASK_DELETE, (_, id) => taskRepo.remove(id));

  ipcMain.handle(IPC.SETTINGS_GET, (_, key, fallback) => settings.get(key, fallback));
  ipcMain.handle(IPC.SETTINGS_SET, (_, key, value) => settings.set(key, value));
}
