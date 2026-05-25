import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import { statSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { IPC } from './channels';
import * as workspaceRepo from '@native/db/repositories/workspace.repo';
import * as projectRepo from '@native/db/repositories/project.repo';
import * as settings from '@native/db/repositories/settings.repo';
import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import * as sessionRepo from '@native/db/repositories/session.repo';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import {
  spawnTerminal,
  writeToTerminal,
  resizeTerminal,
  killTerminal,
  getSnapshot,
  isAlive
} from '@native/pty/manager';
import { detectAvailableAgents, installAgent } from '@native/agents/detect';
import { createTerminalForSession } from '@native/agents/agent-terminal';
import { cloneAgentAccount } from '@native/agents/clone-account';
import { startWork } from '@native/git/start-work';
import { getNexDir } from '@native/paths';
import {
  detectBaseBranch,
  isGitRepo,
  listBranches,
  listWorktreeFiles,
  removeWorktree,
  deleteBranch
} from '@native/git/git';
import { showMainWindow } from '@native/main/app-window';
import {
  speechAvailable,
  listSpeechDevices,
  listSpeechLocales,
  requestSpeechAuth,
  startSpeech,
  stopSpeech,
  cancelSpeech
} from '@native/speech/manager';

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
  ipcMain.handle(IPC.SESSION_DELETE, async (_, id: string) => {
    const session = sessionRepo.getById(id);
    for (const term of terminalRepo.getBySession(id)) killTerminal(term.id);
    if (session?.branch && session.worktreePath) {
      const project = projectRepo.getById(session.projectId);
      if (project && session.worktreePath !== project.path) {
        await removeWorktree(project.path, session.worktreePath).catch(() => {});
        await deleteBranch(project.path, session.branch).catch(() => {});
      }
    }
    sessionRepo.remove(id);
  });
  ipcMain.handle(IPC.SESSION_REORDER, (_, orderedIds: string[]) => sessionRepo.reorder(orderedIds));

  ipcMain.handle(IPC.SESSION_NOTES_READ, (_, sessionId: string): string => {
    const session = sessionRepo.getById(sessionId);
    if (!session?.notesPath || !existsSync(session.notesPath)) return '';
    return readFileSync(session.notesPath, 'utf8');
  });

  ipcMain.handle(IPC.SESSION_NOTES_WRITE, (_, sessionId: string, content: string): void => {
    const session = sessionRepo.getById(sessionId);
    if (!session?.notesPath) return;
    writeFileSync(session.notesPath, content, 'utf8');
  });

  ipcMain.handle(IPC.TERMINAL_GET_ALL, () => terminalRepo.getAll());
  ipcMain.handle(IPC.TERMINAL_GET_BY_SESSION, (_, sessionId: string) =>
    terminalRepo.getBySession(sessionId)
  );
  ipcMain.handle(IPC.TERMINAL_CREATE, (_, input) => terminalRepo.create(input));
  ipcMain.handle(IPC.TERMINAL_CREATE_FOR_SESSION, (_, input) => createTerminalForSession(input));
  ipcMain.handle(IPC.TERMINAL_DELETE, (_, id: string) => {
    killTerminal(id);
    terminalRepo.remove(id);
  });

  ipcMain.handle(IPC.PTY_ENSURE, (_, terminalId: string, cols?: number, rows?: number): boolean => {
    if (isAlive(terminalId)) return true;
    const terminal = terminalRepo.getById(terminalId);
    if (!terminal) return false;
    spawnTerminal({
      id: terminal.id,
      command: terminal.command,
      args: terminal.args,
      cwd: terminal.cwd,
      env: terminal.env,
      cols,
      rows,
      runCommand: terminal.runCommand
    });
    return true;
  });
  ipcMain.on(IPC.PTY_WRITE, (_, terminalId: string, data: string) => {
    writeToTerminal(terminalId, data);
  });
  ipcMain.on(IPC.PTY_RESIZE, (_, terminalId: string, cols: number, rows: number) => {
    resizeTerminal(terminalId, cols, rows);
  });
  ipcMain.handle(IPC.PTY_KILL, (_, terminalId: string) => {
    killTerminal(terminalId);
  });
  ipcMain.handle(IPC.PTY_GET_SNAPSHOT, (_, terminalId: string) => getSnapshot(terminalId));

  ipcMain.handle(IPC.WINDOW_SHOW, () => showMainWindow());
  ipcMain.handle(IPC.DETECT_AGENTS, () => detectAvailableAgents());
  ipcMain.handle(IPC.AGENT_INSTALL, (_, slug: string) => installAgent(slug));
  ipcMain.handle(IPC.AGENT_ACCOUNT_CLONE, (_, input) => cloneAgentAccount(input));
  ipcMain.handle(IPC.WORK_START, (_, input) => startWork(input));
  ipcMain.handle(IPC.GIT_DETECT_BASE_BRANCH, (_, repoPath) => detectBaseBranch(repoPath));
  ipcMain.handle(IPC.GIT_IS_REPO, (_, repoPath) => isGitRepo(repoPath));
  ipcMain.handle(IPC.GIT_LIST_BRANCHES, (_, repoPath) => listBranches(repoPath));
  ipcMain.handle(IPC.WORKTREE_LIST_FILES, (_, worktreePath: string) =>
    listWorktreeFiles(worktreePath)
  );

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

  ipcMain.handle(IPC.IDE_OPEN_VSCODE, (_, path: string): boolean => {
    if (!path) return false;
    const child = spawn('code', [path], { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return true;
  });

  ipcMain.handle(IPC.SPEECH_AVAILABLE, () => speechAvailable());
  ipcMain.handle(IPC.SPEECH_LIST_DEVICES, () => listSpeechDevices());
  ipcMain.handle(IPC.SPEECH_LIST_LOCALES, () => listSpeechLocales());
  ipcMain.handle(IPC.SPEECH_REQUEST_AUTH, () => requestSpeechAuth());
  ipcMain.handle(
    IPC.SPEECH_START,
    (_, opts: { locale?: string; deviceId?: number; onDevice?: boolean; continuous?: boolean }) =>
      startSpeech(opts)
  );
  ipcMain.handle(IPC.SPEECH_STOP, () => stopSpeech());
  ipcMain.handle(IPC.SPEECH_CANCEL, () => cancelSpeech());

  ipcMain.handle(IPC.EXTERNAL_OPEN_URL, (_, url: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
      void shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(
    IPC.SAVE_WORKSPACE_ICON,
    (_, workspaceId: string, dataUrl: string): string | null => {
      const match = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!match) return null;

      const mimeType = match[1];
      const ext = mimeType === 'svg+xml' ? 'svg' : mimeType;
      const buffer = Buffer.from(match[2], 'base64');

      const dir = join(getNexDir(), 'workspace-icons');
      mkdirSync(dir, { recursive: true });

      const filePath = join(dir, `${workspaceId}.${ext}`);
      writeFileSync(filePath, buffer);

      return filePath;
    }
  );
}
