import { ipcMain, dialog, BrowserWindow } from 'electron';
import { statSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { IPC } from './channels';
import * as workspaceRepo from '@native/db/repositories/workspace.repo';
import * as projectRepo from '@native/db/repositories/project.repo';
import * as worktreeRepo from '@native/db/repositories/worktree.repo';
import * as taskRepo from '@native/db/repositories/task.repo';
import * as settings from '@native/db/repositories/settings.repo';
import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import * as sessionRepo from '@native/db/repositories/session.repo';
import { detectAgents } from '@native/agents/detect';
import { cloneAgentAccount } from '@native/agents/clone-account';
import { startWork } from '@native/git/start-work';
import { showMainWindow } from '@native/main/app-window';

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

  ipcMain.handle(IPC.AGENT_GET_ALL, () => agentRepo.getAll());
  ipcMain.handle(IPC.AGENT_GET_BY_SLUG, (_, slug) => agentRepo.getBySlug(slug));
  ipcMain.handle(IPC.AGENT_CREATE, (_, input) => agentRepo.create(input));
  ipcMain.handle(IPC.AGENT_UPDATE, (_, id, input) => agentRepo.update(id, input));
  ipcMain.handle(IPC.AGENT_DELETE, (_, id) => agentRepo.remove(id));

  ipcMain.handle(IPC.AGENT_ACCOUNT_GET_ALL, () => agentAccountRepo.getAll());
  ipcMain.handle(IPC.AGENT_ACCOUNT_GET_BY_AGENT, (_, agentId) =>
    agentAccountRepo.getByAgent(agentId)
  );
  ipcMain.handle(IPC.AGENT_ACCOUNT_CREATE, (_, input) => agentAccountRepo.create(input));
  ipcMain.handle(IPC.AGENT_ACCOUNT_UPDATE, (_, id, input) => agentAccountRepo.update(id, input));
  ipcMain.handle(IPC.AGENT_ACCOUNT_DELETE, (_, id) => agentAccountRepo.remove(id));

  ipcMain.handle(IPC.SESSION_GET_ALL, () => sessionRepo.getAll());
  ipcMain.handle(IPC.SESSION_GET_BY_PROJECT, (_, projectId) => sessionRepo.getByProject(projectId));
  ipcMain.handle(IPC.SESSION_GET_ACTIVE, () => sessionRepo.getActive());
  ipcMain.handle(IPC.SESSION_CREATE, (_, input) => sessionRepo.create(input));
  ipcMain.handle(IPC.SESSION_UPDATE, (_, id, input) => sessionRepo.update(id, input));
  ipcMain.handle(IPC.SESSION_DELETE, (_, id) => sessionRepo.remove(id));

  ipcMain.handle(IPC.WINDOW_SHOW, () => showMainWindow());
  ipcMain.handle(IPC.DETECT_AGENTS, () => detectAgents());
  ipcMain.handle(IPC.AGENT_ACCOUNT_CLONE, (_, input) => cloneAgentAccount(input));
  ipcMain.handle(IPC.WORK_START, (_, input) => startWork(input));

  ipcMain.handle(IPC.DIALOG_PICK_IMAGE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'ico'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const stats = statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) return null;
    const ext = extname(filePath).toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      gif: 'image/gif',
      ico: 'image/x-icon'
    };
    const mime = mimeMap[ext] || 'image/png';
    const base64 = readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${base64}`;
  });

  ipcMain.handle(IPC.DIALOG_PICK_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    IPC.SAVE_WORKSPACE_ICON,
    (_, workspaceId: string, dataUrl: string): string | null => {
      const match = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!match) return null;

      const mimeType = match[1];
      const ext = mimeType === 'svg+xml' ? 'svg' : mimeType;
      const buffer = Buffer.from(match[2], 'base64');

      const dir = join(process.env.HOME!, '.nex', 'workspace-icons');
      mkdirSync(dir, { recursive: true });

      const filePath = join(dir, `${workspaceId}.${ext}`);
      writeFileSync(filePath, buffer);

      return filePath;
    }
  );
}
