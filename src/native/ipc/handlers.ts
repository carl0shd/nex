import { app, ipcMain, dialog, shell, BrowserWindow } from "electron";
import { installedApps, listShells, openWith, playSound } from "@native/main/preferences";
import { spawn } from "child_process";
import {
  statSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
} from "fs";
import { dirname, extname, join } from "path";
import { IPC } from "./channels";
import {
  environmentLogPath,
  getEnvironmentStatus,
  onSetupProgress,
  removeProjectEnvironments,
  repairAddresses,
  restartEnvironments,
  setupEnvironments,
  uninstallEnvironments,
} from "@native/environments/service";
import {
  checkProjectEnvironment,
  stopProjectCheck,
  environmentCheck,
  onCheckProgress,
} from "@native/environments/check";
import { detectEnvironment } from "@native/environments/detect";
import {
  buildCleanBase,
  forgetCleanBase,
  getCleanBase,
  onCleanBaseProgress,
  refreshCleanBases,
  stopCleanBase,
} from "@native/environments/clean-base";
import * as workspaceRepo from "@native/db/repositories/workspace.repo";
import * as projectRepo from "@native/db/repositories/project.repo";
import * as settings from "@native/db/repositories/settings.repo";
import * as agentRepo from "@native/db/repositories/agent.repo";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import * as terminalRepo from "@native/db/repositories/terminal.repo";
import {
  spawnTerminal,
  writeToTerminal,
  resizeTerminal,
  killTerminal,
  getSnapshot,
  getTerminalRuntimes,
  isAlive,
  isTerminalFresh,
  markTerminalFresh,
  unmarkTerminalFresh,
} from "@native/pty/manager";
import { getAgentResumeAdapter } from "@native/agents/resume";
import { backgroundCommands } from "@native/agents/background-tracker";
import { getStatusMarkers } from "@native/agents/status-markers";
import { detectAvailableAgents, installAgent } from "@native/agents/detect";
import { createTerminalForSession } from "@native/agents/agent-terminal";
import { cloneAgentAccount } from "@native/agents/clone-account";
import { readTranscript, watchTranscript, type TranscriptCursor } from "@native/agents/transcript";
import { readAgentSettings, type AgentSettings } from "@native/agents/agent-settings";
import type { McpAddInput } from "@native/agents/mcp-servers";
import {
  agentCommands,
  agentStates,
  configureAgent,
  mcpAdd,
  mcpReconnect,
  mcpRemove,
  agentContext,
  lastAgentContext,
  mcpSignIn,
  mcpStatus,
  mcpToggle,
  warmAgent,
  type AgentMessage,
  interruptAgent,
  sendToAgent,
  stopAgent,
  switchAgentAccount,
} from "@native/agents/agent-runner";
import {
  answerPermission,
  pendingPermissions,
  type PermissionAnswer,
} from "@native/agents/permissions";
import {
  cancelSignIn,
  discardSignIn,
  finishSignIn,
  signInAccount,
  reauthAccount,
} from "@native/agents/sign-in";
import { startWork } from "@native/git/start-work";
import { savedAgentModels } from "@native/agents/agent-models";
import {
  agentCommand,
  getAgentVersion,
  setAgentCommand,
  upgradeAgent,
} from "@native/agents/version";
import { findLocalRepos } from "@native/git/discover";
import { inspectRepo } from "@native/git/inspect";
import { detectGit, cloneRepository } from "@native/git/clone";
import { detectGh, listGithubOwners, listGithubRepos, cloneGithubRepo } from "@native/git/github";
import { getNexDir } from "@native/paths";
import {
  detectBaseBranch,
  isGitRepo,
  listBranches,
  listWorktreeFiles,
  getWorktreeDiff,
  readWorktreeFileVersions,
  discardWorktreeFileChanges,
  removeWorktree,
  deleteBranch,
  type WorktreeDiffOptions,
  type WorktreeFileVersionsInput,
  countUncommitted,
} from "@native/git/git";
import { watchWorktree } from "@native/git/watcher";
import { scanAllTranscripts, watchTranscripts } from "@native/usage/ingest";
import { getUsageStats, getUsageSummary, invalidateLimitsCache } from "@native/usage/service";
import type { UsageGranularity } from "@native/usage/types";
import { showMainWindow } from "@native/main/app-window";
import {
  speechAvailable,
  listSpeechDevices,
  listSpeechLocales,
  requestSpeechAuth,
  startSpeech,
  stopSpeech,
  cancelSpeech,
} from "@native/speech/manager";
import type { CreateProjectInput, ProjectEnvironment, Terminal } from "@native/db/types";
import type { CleanBaseInput, EnvCheckInput } from "@native/environments/types";
import type { AgentResumeAdapter, SessionTrackerHandle } from "@native/agents/resume";

interface AgentSpawnPlan {
  args: string[];
  trackerFactory?: () => SessionTrackerHandle | null;
}

function pickUnclaimedSessionId(terminal: Terminal, adapter: AgentResumeAdapter): string | null {
  const claimed = new Set(
    terminalRepo
      .getBySession(terminal.sessionId)
      .filter((t) => t.id !== terminal.id && t.agentSessionId)
      .map((t) => t.agentSessionId as string),
  );
  const candidates = adapter.listSessionIds(terminal.cwd).filter((id) => !claimed.has(id));
  return candidates.length === 1 ? candidates[0] : null;
}

function makeTrackerFactory(
  terminal: Terminal,
  adapter: AgentResumeAdapter,
): () => SessionTrackerHandle {
  return () =>
    adapter.watchForNewSession(terminal.cwd, (sessionId) => {
      try {
        terminalRepo.setAgentSessionId(terminal.id, sessionId);
      } catch {
        /* db may be closed at shutdown */
      }
    });
}

function agentSlugFor(terminal: Terminal): string | null {
  if (terminal.type !== "agent") return null;
  const session = sessionRepo.getById(terminal.sessionId);
  const agent = session?.agentId ? agentRepo.getById(session.agentId) : null;
  return agent?.slug ?? null;
}

function planAgentSpawn(terminal: Terminal): AgentSpawnPlan | null {
  if (terminal.type !== "agent") return null;
  const session = sessionRepo.getById(terminal.sessionId);
  const agent = session?.agentId ? agentRepo.getById(session.agentId) : null;
  const adapter = getAgentResumeAdapter(agent?.slug);
  if (!agent || !adapter) return null;

  if (isTerminalFresh(terminal.id)) {
    if (terminal.agentSessionId) terminalRepo.setAgentSessionId(terminal.id, null);
    return { args: terminal.args, trackerFactory: makeTrackerFactory(terminal, adapter) };
  }

  if (terminal.agentSessionId && adapter.sessionExists(terminal.cwd, terminal.agentSessionId)) {
    return { args: adapter.buildResumeArgs(agent, terminal.agentSessionId) };
  }

  if (!terminal.agentSessionId) {
    const adopted = pickUnclaimedSessionId(terminal, adapter);
    if (adopted) {
      terminalRepo.setAgentSessionId(terminal.id, adopted);
      return { args: adapter.buildResumeArgs(agent, adopted) };
    }
  }

  if (terminal.agentSessionId) terminalRepo.setAgentSessionId(terminal.id, null);
  return { args: terminal.args, trackerFactory: makeTrackerFactory(terminal, adapter) };
}

function deleteAgentSessionFile(terminal: Terminal): void {
  if (terminal.type !== "agent" || !terminal.agentSessionId) return;
  const session = sessionRepo.getById(terminal.sessionId);
  const agent = session?.agentId ? agentRepo.getById(session.agentId) : null;
  const adapter = getAgentResumeAdapter(agent?.slug);
  adapter?.deleteSession(terminal.cwd, terminal.agentSessionId);
}

/**
 * Active worktree watchers, keyed by `${webContentsId}:${worktreePath}`.
 * Counted because several views can watch the same worktree at once.
 */
const worktreeWatchers = new Map<string, { stop: () => void; count: number }>();
const transcriptWatchers = new Map<string, { stop: () => void; count: number }>();

function stopTranscriptWatchersFor(senderId: number): void {
  const prefix = `${senderId}:`;
  for (const [key, entry] of transcriptWatchers) {
    if (!key.startsWith(prefix)) continue;
    entry.stop();
    transcriptWatchers.delete(key);
  }
}

const usageWatchers = new Map<number, () => void>();

function stopUsageWatcherFor(senderId: number): void {
  const stop = usageWatchers.get(senderId);
  if (!stop) return;
  stop();
  usageWatchers.delete(senderId);
}

function stopWorktreeWatchersFor(senderId: number): void {
  const prefix = `${senderId}:`;
  for (const [key, entry] of worktreeWatchers) {
    if (!key.startsWith(prefix)) continue;
    entry.stop();
    worktreeWatchers.delete(key);
  }
}

export function registerIPCHandlers(): void {
  ipcMain.handle(IPC.APP_GET_LOGIN_ITEM, () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle(IPC.APP_SET_LOGIN_ITEM, (_, openAtLogin: boolean) =>
    app.setLoginItemSettings({ openAtLogin }),
  );
  ipcMain.handle(IPC.APP_PLAY_SOUND, (_, name: string) => playSound(name));
  ipcMain.handle(IPC.APP_SET_BADGE, (_, count: number) =>
    app.dock?.setBadge(count > 0 ? String(count) : ""),
  );
  ipcMain.handle(IPC.APP_LIST_SHELLS, () => listShells());
  ipcMain.handle(IPC.APP_INSTALLED, (_, names: string[]) => installedApps(names));
  ipcMain.handle(IPC.REPOS_FIND, (_, exclude: string[]) => findLocalRepos(exclude));
  ipcMain.handle(IPC.APP_OPEN_WITH, (_, appName: string, path: string) => openWith(appName, path));
  ipcMain.handle(IPC.APP_GET_INFO, () => ({
    platform: process.platform,
    version: app.getVersion(),
    dataDir: getNexDir(),
    versions: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    },
  }));

  ipcMain.handle(IPC.WORKSPACE_GET_ALL, () => workspaceRepo.getAll());
  ipcMain.handle(IPC.WORKSPACE_GET_BY_ID, (_, id) => workspaceRepo.getById(id));
  ipcMain.handle(IPC.WORKSPACE_CREATE, (_, input) => workspaceRepo.create(input));
  ipcMain.handle(IPC.WORKSPACE_UPDATE, (_, id, input) => workspaceRepo.update(id, input));
  ipcMain.handle(IPC.WORKSPACE_DELETE, (_, id) => workspaceRepo.remove(id));

  ipcMain.handle(IPC.PROJECT_GET_ALL, () => projectRepo.getAll());
  ipcMain.handle(IPC.PROJECT_GET_BY_WORKSPACE, (_, workspaceId) =>
    projectRepo.getByWorkspace(workspaceId),
  );
  ipcMain.handle(IPC.PROJECT_CREATE, async (_, input: CreateProjectInput) =>
    projectRepo.create({
      ...input,
      environment: input.environment ?? (await detectEnvironment(input.path)),
    }),
  );
  ipcMain.handle(IPC.PROJECT_UPDATE, (_, id, input) => projectRepo.update(id, input));
  ipcMain.handle(IPC.PROJECT_DELETE, (_, id) => {
    const project = projectRepo.getById(id);
    projectRepo.remove(id);
    if (!project) return;
    forgetCleanBase(project.path);
    void removeProjectEnvironments(project.path);
  });

  ipcMain.handle(IPC.SETTINGS_GET, (_, key, fallback) => settings.get(key, fallback));
  ipcMain.handle(IPC.SETTINGS_SET, (_, key, value) => settings.set(key, value));

  ipcMain.handle(IPC.AGENT_GET_ALL, () => agentRepo.getAll());
  ipcMain.handle(IPC.AGENT_GET_BY_SLUG, (_, slug) => agentRepo.getBySlug(slug));
  ipcMain.handle(IPC.AGENT_CREATE, (_, input) => agentRepo.create(input));
  ipcMain.handle(IPC.AGENT_UPDATE, (_, id, input) => agentRepo.update(id, input));
  ipcMain.handle(IPC.AGENT_DELETE, (_, id) => agentRepo.remove(id));

  ipcMain.handle(IPC.AGENT_ACCOUNT_GET_ALL, () => agentAccountRepo.getAll());
  ipcMain.handle(IPC.AGENT_ACCOUNT_GET_BY_AGENT, (_, agentId) =>
    agentAccountRepo.getByAgent(agentId),
  );
  ipcMain.handle(IPC.AGENT_ACCOUNT_CREATE, (_, input) => agentAccountRepo.create(input));
  ipcMain.handle(IPC.AGENT_ACCOUNT_UPDATE, (_, id, input) => agentAccountRepo.update(id, input));
  ipcMain.handle(IPC.AGENT_ACCOUNT_DELETE, (_, id) => agentAccountRepo.remove(id));

  ipcMain.handle(IPC.SESSION_GET_ALL, () => sessionRepo.getAll());
  ipcMain.handle(IPC.SESSION_GET_BY_PROJECT, (_, projectId) => sessionRepo.getByProject(projectId));
  ipcMain.handle(IPC.SESSION_GET_ACTIVE, () => sessionRepo.getActive());
  ipcMain.handle(IPC.SESSION_CREATE, (_, input) => sessionRepo.create(input));
  ipcMain.handle(IPC.SESSION_UPDATE, (_, id, input) => sessionRepo.update(id, input));
  ipcMain.handle(IPC.SESSION_DELETE, async (_, id: string, keepBranch = false) => {
    const session = sessionRepo.getById(id);
    stopAgent(id);
    for (const term of terminalRepo.getBySession(id)) {
      if (!keepBranch) deleteAgentSessionFile(term);
      killTerminal(term.id);
      unmarkTerminalFresh(term.id);
    }
    if (session?.branch && session.worktreePath) {
      const project = projectRepo.getById(session.projectId);
      if (project && session.worktreePath !== project.path) {
        await removeWorktree(project.path, session.worktreePath).catch(() => {});
        if (!keepBranch) await deleteBranch(project.path, session.branch).catch(() => {});
      }
    }
    sessionRepo.remove(id);
  });
  ipcMain.handle(IPC.SESSION_REORDER, (_, orderedIds: string[]) => sessionRepo.reorder(orderedIds));

  ipcMain.handle(IPC.SESSION_NOTES_READ, (_, sessionId: string): string => {
    const session = sessionRepo.getById(sessionId);
    if (!session?.notesPath || !existsSync(session.notesPath)) return "";
    return readFileSync(session.notesPath, "utf8");
  });

  ipcMain.handle(IPC.SESSION_NOTES_WRITE, (_, sessionId: string, content: string): void => {
    const session = sessionRepo.getById(sessionId);
    if (!session?.notesPath) return;
    writeFileSync(session.notesPath, content, "utf8");
  });

  ipcMain.handle(IPC.TERMINAL_GET_ALL, () => terminalRepo.getAll());
  ipcMain.handle(IPC.TERMINAL_GET_BY_SESSION, (_, sessionId: string) =>
    terminalRepo.getBySession(sessionId),
  );
  ipcMain.handle(IPC.TERMINAL_CREATE, (_, input) => {
    const terminal = terminalRepo.create(input);
    markTerminalFresh(terminal.id);
    return terminal;
  });
  ipcMain.handle(IPC.TERMINAL_CREATE_FOR_SESSION, (_, input) => createTerminalForSession(input));
  ipcMain.handle(IPC.TERMINAL_DELETE, (_, id: string) => {
    const terminal = terminalRepo.getById(id);
    if (terminal) deleteAgentSessionFile(terminal);
    killTerminal(id);
    unmarkTerminalFresh(id);
    terminalRepo.remove(id);
  });
  ipcMain.handle(IPC.TERMINAL_REORDER, (_, sessionId: string, orderedIds: string[]) =>
    terminalRepo.reorder(sessionId, orderedIds),
  );

  ipcMain.handle(IPC.PTY_ENSURE, (_, terminalId: string, cols?: number, rows?: number): boolean => {
    if (isAlive(terminalId)) return true;
    const terminal = terminalRepo.getById(terminalId);
    if (!terminal) return false;

    const plan = planAgentSpawn(terminal);

    spawnTerminal({
      id: terminal.id,
      type: terminal.type,
      command: terminal.command,
      args: plan?.args ?? terminal.args,
      cwd: terminal.cwd,
      env: terminal.env,
      cols,
      rows,
      runCommand: terminal.runCommand,
      trackerFactory: plan?.trackerFactory,
      statusMarkers: getStatusMarkers(agentSlugFor(terminal)),
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
  ipcMain.handle(IPC.TERMINAL_RUNTIMES, () => getTerminalRuntimes());

  ipcMain.handle(IPC.WINDOW_SHOW, () => showMainWindow());
  ipcMain.handle(IPC.DETECT_AGENTS, () => detectAvailableAgents());
  ipcMain.handle(IPC.AGENT_VERSION, (_, agentId: string) => getAgentVersion(agentId));
  ipcMain.handle(IPC.AGENT_UPGRADE, (_, agentId: string) => upgradeAgent(agentId));
  ipcMain.handle(IPC.AGENT_PICK_COMMAND, async (event, agentId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const current = agentCommand(agentId);
    const result = await dialog.showOpenDialog(win, {
      title: "Choose the claude binary",
      defaultPath: current ? dirname(current) : undefined,
      properties: ["openFile", "showHiddenFiles"],
    });
    const [command] = result.filePaths;
    return result.canceled || !command ? null : setAgentCommand(agentId, command);
  });
  ipcMain.handle(IPC.REPO_INSPECT, (_, path: string) => inspectRepo(path));
  ipcMain.handle(IPC.FINDER_OPEN, async (_, path: string): Promise<boolean> => {
    if (!path) return false;
    return (await shell.openPath(path)) === "";
  });
  ipcMain.handle(IPC.AGENT_INSTALL, (_, slug: string) => installAgent(slug));
  ipcMain.handle(IPC.AGENT_ACCOUNT_CLONE, (_, input) => cloneAgentAccount(input));
  ipcMain.handle(IPC.ACCOUNT_SIGN_IN, () => signInAccount());
  ipcMain.handle(IPC.ACCOUNT_SIGN_IN_CANCEL, () => cancelSignIn());
  ipcMain.handle(IPC.ACCOUNT_REAUTH, (_, accountId: string) => reauthAccount(accountId));
  ipcMain.handle(IPC.ACCOUNT_SIGN_IN_FINISH, (_, input) => finishSignIn(input));
  ipcMain.handle(IPC.ACCOUNT_SIGN_IN_DISCARD, (_, configDir: string) => discardSignIn(configDir));
  ipcMain.handle(IPC.WORK_START, (_, input) => startWork(input));
  ipcMain.handle(IPC.GIT_DETECT, () => detectGit());
  ipcMain.handle(IPC.GIT_CLONE, (event, url: string, parentDir: string) =>
    cloneRepository(url, parentDir, (progress) => {
      if (!event.sender.isDestroyed()) event.sender.send(IPC.GIT_CLONE_PROGRESS, progress);
    }),
  );
  ipcMain.handle(IPC.GH_DETECT, () => detectGh());
  ipcMain.handle(IPC.GH_LIST_OWNERS, () => listGithubOwners());
  ipcMain.handle(IPC.GH_LIST_REPOS, (_, owner: string) => listGithubRepos(owner));
  ipcMain.handle(IPC.GH_CLONE, (event, nameWithOwner: string, parentDir: string) =>
    cloneGithubRepo(nameWithOwner, parentDir, (progress) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC.GIT_CLONE_PROGRESS, { ...progress, repo: nameWithOwner });
      }
    }),
  );
  ipcMain.handle(IPC.GIT_DETECT_BASE_BRANCH, (_, repoPath) => detectBaseBranch(repoPath));
  ipcMain.handle(IPC.GIT_IS_REPO, (_, repoPath) => isGitRepo(repoPath));
  ipcMain.handle(IPC.GIT_LIST_BRANCHES, (_, repoPath) => listBranches(repoPath));
  ipcMain.handle(IPC.WORKTREE_LIST_FILES, (_, worktreePath: string) =>
    listWorktreeFiles(worktreePath),
  );
  ipcMain.handle(
    IPC.GIT_WORKTREE_DIFF,
    (_, worktreePath: string, options: WorktreeDiffOptions = {}) =>
      getWorktreeDiff(worktreePath, options),
  );
  ipcMain.handle(IPC.GIT_WORKTREE_FILE_VERSIONS, (_, input: WorktreeFileVersionsInput) =>
    readWorktreeFileVersions(input),
  );
  ipcMain.handle(IPC.GIT_DISCARD_FILE, (_, worktreePath: string, path: string, prevPath?: string) =>
    discardWorktreeFileChanges(worktreePath, path, prevPath),
  );

  ipcMain.handle(IPC.GIT_WATCH_START, (event, worktreePath: string) => {
    const key = `${event.sender.id}:${worktreePath}`;
    const existing = worktreeWatchers.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    const stop = watchWorktree(worktreePath, () => {
      if (event.sender.isDestroyed()) return;
      event.sender.send(IPC.GIT_WORKTREE_CHANGED, { worktreePath });
    });
    worktreeWatchers.set(key, { stop, count: 1 });
    event.sender.once("destroyed", () => stopWorktreeWatchersFor(event.sender.id));
  });

  ipcMain.handle(IPC.AGENT_SEND, (_, sessionId: string, content: AgentMessage) =>
    sendToAgent(sessionId, content),
  );
  ipcMain.handle(IPC.AGENT_SWITCH_ACCOUNT, (_, sessionId: string, accountId: string) =>
    switchAgentAccount(sessionId, accountId),
  );
  ipcMain.handle(IPC.AGENT_INTERRUPT, (_, sessionId: string) => interruptAgent(sessionId));
  ipcMain.handle(IPC.AGENT_STATES, () => agentStates());
  ipcMain.handle(IPC.AGENT_BACKGROUND_ALL, () => backgroundCommands());
  ipcMain.handle(IPC.AGENT_WARM, (_, sessionId: string) => warmAgent(sessionId));
  ipcMain.handle(IPC.AGENT_MCP_STATUS, (_, sessionId: string) => mcpStatus(sessionId));
  ipcMain.handle(IPC.AGENT_MCP_TOGGLE, (_, sessionId: string, name: string, enabled: boolean) =>
    mcpToggle(sessionId, name, enabled),
  );
  ipcMain.handle(IPC.AGENT_MCP_RECONNECT, (_, sessionId: string, name: string) =>
    mcpReconnect(sessionId, name),
  );
  ipcMain.handle(IPC.AGENT_MCP_SIGN_IN, (_, sessionId: string, name: string) =>
    mcpSignIn(sessionId, name),
  );
  ipcMain.handle(IPC.AGENT_CONTEXT, (_, sessionId: string) => agentContext(sessionId));
  ipcMain.handle(IPC.AGENT_CONTEXT_LAST, (_, sessionId: string) => lastAgentContext(sessionId));
  ipcMain.handle(IPC.AGENT_MCP_REMOVE, (_, sessionId: string, name: string) =>
    mcpRemove(sessionId, name),
  );
  ipcMain.handle(IPC.AGENT_MCP_ADD, (_, sessionId: string, input: McpAddInput) =>
    mcpAdd(sessionId, input),
  );
  ipcMain.handle(IPC.DIALOG_PICK_FILES, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle(IPC.AGENT_COMMANDS_GET, (_, sessionId: string) => agentCommands(sessionId));
  ipcMain.handle(IPC.AGENT_MODELS_GET, () => savedAgentModels());
  ipcMain.handle(IPC.GIT_UNCOMMITTED, (_, worktreePath: string) => countUncommitted(worktreePath));
  ipcMain.handle(IPC.AGENT_SETTINGS_GET, (_, sessionId: string) => readAgentSettings(sessionId));
  ipcMain.handle(IPC.AGENT_CONFIGURE, (_, sessionId: string, settings: AgentSettings) =>
    configureAgent(sessionId, settings),
  );
  ipcMain.handle(IPC.PERMISSION_PENDING, () => pendingPermissions());
  ipcMain.handle(IPC.PERMISSION_ANSWER, (_, id: string, answer: PermissionAnswer) =>
    answerPermission(id, answer),
  );
  ipcMain.handle(IPC.TRANSCRIPT_READ, (_, terminalId: string, cursor: TranscriptCursor | null) =>
    readTranscript(terminalId, cursor),
  );
  ipcMain.handle(IPC.TRANSCRIPT_WATCH_START, (event, terminalId: string) => {
    const key = `${event.sender.id}:${terminalId}`;
    const existing = transcriptWatchers.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    const stop = watchTranscript(terminalId, () => {
      if (event.sender.isDestroyed()) return;
      event.sender.send(IPC.TRANSCRIPT_CHANGED, { terminalId });
    });
    transcriptWatchers.set(key, { stop, count: 1 });
    event.sender.once("destroyed", () => stopTranscriptWatchersFor(event.sender.id));
  });
  ipcMain.handle(IPC.TRANSCRIPT_WATCH_STOP, (event, terminalId: string) => {
    const key = `${event.sender.id}:${terminalId}`;
    const entry = transcriptWatchers.get(key);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count > 0) return;
    entry.stop();
    transcriptWatchers.delete(key);
  });

  ipcMain.handle(IPC.GIT_WATCH_STOP, (event, worktreePath: string) => {
    const key = `${event.sender.id}:${worktreePath}`;
    const entry = worktreeWatchers.get(key);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count > 0) return;
    entry.stop();
    worktreeWatchers.delete(key);
  });

  ipcMain.handle(IPC.DIALOG_PICK_IMAGE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "svg", "gif", "ico"] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const stats = statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) return null;
    const ext = extname(filePath).toLowerCase().replace(".", "");
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      svg: "image/svg+xml",
      gif: "image/gif",
      ico: "image/x-icon",
    };
    const mime = mimeMap[ext] || "image/png";
    const base64 = readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${base64}`;
  });

  ipcMain.handle(IPC.DIALOG_PICK_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.IDE_OPEN_VSCODE, (_, path: string): boolean => {
    if (!path) return false;
    const child = spawn("code", [path], { detached: true, stdio: "ignore" });
    child.on("error", () => {});
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
      startSpeech(opts),
  );
  ipcMain.handle(IPC.SPEECH_STOP, () => stopSpeech());
  ipcMain.handle(IPC.SPEECH_CANCEL, () => cancelSpeech());

  ipcMain.handle(IPC.EXTERNAL_OPEN_URL, (_, url: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
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
      const ext = mimeType === "svg+xml" ? "svg" : mimeType;
      const buffer = Buffer.from(match[2], "base64");

      const dir = join(getNexDir(), "workspace-icons");
      mkdirSync(dir, { recursive: true });
      for (const old of readdirSync(dir)) {
        if (old.startsWith(`${workspaceId}`)) rmSync(join(dir, old), { force: true });
      }

      // A new name per save, so the renderer never shows the cached previous image.
      const filePath = join(dir, `${workspaceId}-${Date.now()}.${ext}`);
      writeFileSync(filePath, buffer);

      return filePath;
    },
  );

  ipcMain.handle(IPC.USAGE_GET_SUMMARY, () => getUsageSummary());

  ipcMain.handle(IPC.USAGE_GET_STATS, (_, granularity: UsageGranularity) =>
    getUsageStats(granularity),
  );

  ipcMain.handle(IPC.USAGE_REFRESH, () => {
    scanAllTranscripts();
    invalidateLimitsCache();
  });

  ipcMain.handle(IPC.USAGE_WATCH_START, (event) => {
    const senderId = event.sender.id;
    if (usageWatchers.has(senderId)) return;

    const stop = watchTranscripts(() => {
      if (event.sender.isDestroyed()) return;
      event.sender.send(IPC.USAGE_CHANGED);
    });
    usageWatchers.set(senderId, stop);
    event.sender.once("destroyed", () => stopUsageWatcherFor(senderId));
  });

  ipcMain.handle(IPC.USAGE_WATCH_STOP, (event) => stopUsageWatcherFor(event.sender.id));

  ipcMain.handle(IPC.ENV_STATUS, () => getEnvironmentStatus());
  ipcMain.handle(IPC.ENV_SETUP, () => setupEnvironments());
  ipcMain.handle(IPC.ENV_RESTART, () => restartEnvironments());
  ipcMain.handle(IPC.ENV_REPAIR_ADDRESSES, () => repairAddresses());
  ipcMain.handle(IPC.ENV_UNINSTALL, () => uninstallEnvironments());
  ipcMain.handle(IPC.ENV_SHOW_LOG, async () => !(await shell.openPath(environmentLogPath())));
  ipcMain.handle(IPC.ENV_DETECT, (_, path: string) => detectEnvironment(path));
  ipcMain.handle(IPC.ENV_DETECT_PROJECT, async (_, projectId: string) => {
    const project = projectRepo.getById(projectId);
    return project ? detectEnvironment(project.path) : null;
  });
  ipcMain.handle(
    IPC.ENV_PROJECT_GET,
    (_, projectId: string) => projectRepo.getById(projectId)?.environment ?? null,
  );
  ipcMain.handle(IPC.ENV_PROJECT_SAVE, (_, projectId: string, environment: ProjectEnvironment) =>
    projectRepo.update(projectId, { environment }),
  );
  ipcMain.handle(IPC.ENV_CHECK, (_, input: EnvCheckInput) => checkProjectEnvironment(input));
  ipcMain.handle(IPC.ENV_CHECK_STATE, (_, projectPath: string) => environmentCheck(projectPath));
  ipcMain.handle(IPC.ENV_CHECK_STOP, (_, projectPath: string) => stopProjectCheck(projectPath));
  ipcMain.handle(IPC.ENV_BASE_GET, (_, projectId: string) => getCleanBase(projectId));
  ipcMain.handle(IPC.ENV_BASE_BUILD, (_, input: CleanBaseInput) =>
    buildCleanBase(input.projectId, input.environment),
  );
  ipcMain.handle(IPC.ENV_BASE_STOP, (_, projectId: string) => stopCleanBase(projectId));
  const broadcast = (channel: string, payload: unknown) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send(channel, payload);
    }
  };
  onSetupProgress((state) => broadcast(IPC.ENV_SETUP_PROGRESS, state));
  onCheckProgress((state) => broadcast(IPC.ENV_CHECK_PROGRESS, state));
  onCleanBaseProgress((state) => broadcast(IPC.ENV_BASE_PROGRESS, state));
  void refreshCleanBases().catch(() => {});
}
