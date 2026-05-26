import { spawn, type IPty } from 'node-pty';
import { app } from 'electron';
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IPC } from '@native/ipc/channels';
import { getMainWindow } from '@native/main/app-window';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import type { TerminalStatus, TerminalType } from '@native/db/types';
import type { SessionTrackerHandle } from '@native/agents/resume';
import { whichBinary } from '@native/which';
import { getNexDir } from '@native/paths';

interface ManagedTerminal {
  id: string;
  type: TerminalType;
  pty: IPty;
  buffer: string;
  cols: number;
  rows: number;
  exited: boolean;
  status: TerminalStatus;
  pendingData: string;
  flushHandle: NodeJS.Immediate | null;
  diskDirty: boolean;
  diskFlushTimer: NodeJS.Timeout | null;
  sessionTracker: SessionTrackerHandle | null;
}

const MAX_BUFFER = 1_000_000;
const DISK_FLUSH_INTERVAL_MS = 500;
const RESUME_DIVIDER = '\r\n\x1b[2m─── resumed ───\x1b[0m\r\n';

interface SpawnOptions {
  id: string;
  type: TerminalType;
  command: string | null;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  runCommand?: string | null;
  trackerFactory?: () => SessionTrackerHandle | null;
}

function bufferDir(): string {
  return join(getNexDir(), 'terminals');
}

function bufferPath(id: string): string {
  return join(bufferDir(), `${id}.log`);
}

let bufferDirReady = false;
function ensureBufferDir(): void {
  if (bufferDirReady) return;
  try {
    mkdirSync(bufferDir(), { recursive: true });
    bufferDirReady = true;
  } catch {
    /* */
  }
}

function readBufferFile(id: string): string | null {
  try {
    return readFileSync(bufferPath(id), 'utf8');
  } catch {
    return null;
  }
}

function writeBufferFile(id: string, data: string): void {
  ensureBufferDir();
  try {
    writeFileSync(bufferPath(id), data, 'utf8');
  } catch {
    /* */
  }
}

function unlinkBufferFile(id: string): void {
  try {
    unlinkSync(bufferPath(id));
  } catch {
    /* */
  }
}

function trimBufferAtNewline(buffer: string): string {
  if (buffer.length <= MAX_BUFFER) return buffer;
  const overflow = buffer.length - MAX_BUFFER;
  const newlineIdx = buffer.indexOf('\n', overflow);
  if (newlineIdx === -1) return buffer.slice(overflow);
  return buffer.slice(newlineIdx + 1);
}

function scheduleDiskFlush(term: ManagedTerminal): void {
  if (term.type !== 'shell') return;
  term.diskDirty = true;
  if (term.diskFlushTimer) return;
  term.diskFlushTimer = setTimeout(() => {
    term.diskFlushTimer = null;
    if (!term.diskDirty) return;
    term.diskDirty = false;
    writeBufferFile(term.id, term.buffer);
  }, DISK_FLUSH_INTERVAL_MS);
}

function flushDiskSync(term: ManagedTerminal): void {
  if (term.type !== 'shell') return;
  if (term.diskFlushTimer) {
    clearTimeout(term.diskFlushTimer);
    term.diskFlushTimer = null;
  }
  if (!term.diskDirty) return;
  term.diskDirty = false;
  writeBufferFile(term.id, term.buffer);
}

const terminals = new Map<string, ManagedTerminal>();
const freshTerminalIds = new Set<string>();

export function markTerminalFresh(id: string): void {
  freshTerminalIds.add(id);
}

export function isTerminalFresh(id: string): boolean {
  return freshTerminalIds.has(id);
}

export function unmarkTerminalFresh(id: string): void {
  freshTerminalIds.delete(id);
}

function defaultShell(): string {
  if (process.platform === 'win32') return process.env.COMSPEC || 'cmd.exe';
  return process.env.SHELL || '/bin/bash';
}

function resolveCommand(cmd: string, envPath: string): string {
  return whichBinary(cmd, envPath) ?? cmd;
}

function send(channel: string, payload: unknown): void {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, payload);
}

function flushPending(term: ManagedTerminal): void {
  term.flushHandle = null;
  if (!term.pendingData) return;
  const data = term.pendingData;
  term.pendingData = '';
  send(IPC.PTY_DATA, { id: term.id, data });
}

function setStatus(term: ManagedTerminal, status: TerminalStatus): void {
  if (term.status === status) return;
  term.status = status;
  try {
    terminalRepo.setStatus(term.id, status);
  } catch {
    // db may be closed at shutdown
  }
  send(IPC.TERMINAL_STATUS, { id: term.id, status });
}

export function spawnTerminal(opts: SpawnOptions): void {
  if (terminals.has(opts.id)) return;

  const useDefaultShell = !opts.command;
  const rawCmd = opts.command || defaultShell();
  const args =
    useDefaultShell && opts.args.length === 0 && process.platform !== 'win32'
      ? ['-l', '-i']
      : opts.args;
  const cols = opts.cols ?? 80;
  const rows = opts.rows ?? 24;

  const env = {
    ...process.env,
    LANG: process.env.LANG || 'en_US.UTF-8',
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    FORCE_COLOR: '3',
    CLICOLOR: '1',
    CLICOLOR_FORCE: '1',
    PAGER: process.env.PAGER || 'less -R',
    TERM_PROGRAM: 'Nex',
    TERM_PROGRAM_VERSION: app.getVersion(),
    ...(opts.env ?? {})
  } as Record<string, string>;

  delete env.PREFIX;
  delete env.npm_config_prefix;

  const cmd = resolveCommand(rawCmd, env.PATH ?? '');

  const pty = spawn(cmd, args, {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: opts.cwd,
    env
  });

  let seededBuffer = '';
  if (opts.type === 'shell') {
    const prev = readBufferFile(opts.id);
    if (prev) seededBuffer = prev + RESUME_DIVIDER;
  }

  const term: ManagedTerminal = {
    id: opts.id,
    type: opts.type,
    pty,
    buffer: seededBuffer,
    cols,
    rows,
    exited: false,
    status: 'idle',
    pendingData: '',
    flushHandle: null,
    diskDirty: false,
    diskFlushTimer: null,
    sessionTracker: null
  };
  terminals.set(opts.id, term);

  pty.onData((data) => {
    term.buffer += data;
    if (term.buffer.length > MAX_BUFFER) {
      term.buffer = trimBufferAtNewline(term.buffer);
    }
    term.pendingData += data;
    if (!term.flushHandle) {
      term.flushHandle = setImmediate(() => flushPending(term));
    }
    scheduleDiskFlush(term);
  });

  pty.onExit(({ exitCode, signal }) => {
    term.exited = true;
    if (term.pendingData) flushPending(term);
    setStatus(term, 'idle');
    send(IPC.PTY_EXIT, { id: opts.id, exitCode, signal });
  });

  if (opts.runCommand) {
    const cmdToRun = opts.runCommand;
    setTimeout(() => {
      if (term.exited) return;
      term.pty.write(`${cmdToRun}\r`);
      try {
        terminalRepo.clearRunCommand(term.id);
      } catch {
        // db may be closed at shutdown
      }
    }, 200);
  }

  if (opts.trackerFactory) {
    term.sessionTracker = opts.trackerFactory();
  }
}

export function writeToTerminal(id: string, data: string): void {
  const term = terminals.get(id);
  if (!term || term.exited) return;
  term.pty.write(data);
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  const term = terminals.get(id);
  if (!term || term.exited) return;
  if (cols < 1 || rows < 1) return;
  if (cols === term.cols && rows === term.rows) return;
  try {
    term.pty.resize(cols, rows);
    term.cols = cols;
    term.rows = rows;
  } catch {
    // pty may have exited mid-call
  }
}

export function killTerminal(id: string): void {
  const term = terminals.get(id);
  if (term) {
    flushDiskSync(term);
    term.sessionTracker?.stop();
    term.sessionTracker = null;
    try {
      if (!term.exited) term.pty.kill();
    } catch {
      // already dead
    }
    terminals.delete(id);
  }
  unlinkBufferFile(id);
}

export function getSnapshot(id: string): { data: string; alive: boolean } | null {
  const term = terminals.get(id);
  if (term) return { data: term.buffer, alive: !term.exited };
  const disk = readBufferFile(id);
  if (disk) return { data: disk, alive: false };
  return null;
}

export function isAlive(id: string): boolean {
  const term = terminals.get(id);
  return !!term && !term.exited;
}

export function killAllTerminals(): void {
  for (const term of terminals.values()) {
    term.sessionTracker?.stop();
    term.sessionTracker = null;
    try {
      if (!term.exited) term.pty.kill();
    } catch {
      // already dead
    }
  }
  terminals.clear();
}

export function flushAllBuffers(): void {
  for (const term of terminals.values()) {
    flushDiskSync(term);
  }
}

export function sweepOrphanBuffers(validIds: Set<string>): void {
  const dir = bufferDir();
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.endsWith('.log')) continue;
    const id = entry.slice(0, -4);
    if (validIds.has(id)) continue;
    try {
      unlinkSync(join(dir, entry));
    } catch {
      /* */
    }
  }
}

export function deleteBufferFile(id: string): void {
  unlinkBufferFile(id);
}
