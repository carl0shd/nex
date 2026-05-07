import { spawn, type IPty } from 'node-pty';
import { BrowserWindow } from 'electron';
import { IPC } from '@native/ipc/channels';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import type { TerminalStatus } from '@native/db/types';

interface ManagedTerminal {
  id: string;
  pty: IPty;
  buffer: string;
  cols: number;
  rows: number;
  exited: boolean;
  status: TerminalStatus;
}

const MAX_BUFFER = 1_000_000;

interface SpawnOptions {
  id: string;
  command: string | null;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  runCommand?: string | null;
}

const terminals = new Map<string, ManagedTerminal>();

function defaultShell(): string {
  if (process.platform === 'win32') return process.env.COMSPEC || 'cmd.exe';
  return process.env.SHELL || '/bin/bash';
}

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function setStatus(term: ManagedTerminal, status: TerminalStatus): void {
  if (term.status === status) return;
  term.status = status;
  try {
    terminalRepo.setStatus(term.id, status);
  } catch {
    // db may be closed at shutdown
  }
  broadcast(IPC.TERMINAL_STATUS, { id: term.id, status });
}

export function spawnTerminal(opts: SpawnOptions): void {
  if (terminals.has(opts.id)) return;

  const cmd = opts.command || defaultShell();
  const cols = opts.cols ?? 80;
  const rows = opts.rows ?? 24;

  const env = { ...process.env, ...(opts.env ?? {}) } as Record<string, string>;

  const pty = spawn(cmd, opts.args, {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: opts.cwd,
    env
  });

  const term: ManagedTerminal = {
    id: opts.id,
    pty,
    buffer: '',
    cols,
    rows,
    exited: false,
    status: 'idle'
  };
  terminals.set(opts.id, term);

  pty.onData((data) => {
    term.buffer += data;
    if (term.buffer.length > MAX_BUFFER) {
      term.buffer = term.buffer.slice(term.buffer.length - MAX_BUFFER);
    }
    broadcast(IPC.PTY_DATA, { id: opts.id, data });
  });

  pty.onExit(({ exitCode, signal }) => {
    term.exited = true;
    setStatus(term, 'idle');
    broadcast(IPC.PTY_EXIT, { id: opts.id, exitCode, signal });
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
  if (!term) return;
  try {
    if (!term.exited) term.pty.kill();
  } catch {
    // already dead
  }
  terminals.delete(id);
}

export function getSnapshot(id: string): { data: string; alive: boolean } | null {
  const term = terminals.get(id);
  if (!term) return null;
  return { data: term.buffer, alive: !term.exited };
}

export function isAlive(id: string): boolean {
  const term = terminals.get(id);
  return !!term && !term.exited;
}

export function killAllTerminals(): void {
  for (const term of terminals.values()) {
    try {
      if (!term.exited) term.pty.kill();
    } catch {
      // already dead
    }
  }
  terminals.clear();
}
