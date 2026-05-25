import { spawn, type IPty } from 'node-pty';
import { app } from 'electron';
import { IPC } from '@native/ipc/channels';
import { getMainWindow } from '@native/main/app-window';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import type { TerminalStatus } from '@native/db/types';
import { whichBinary } from '@native/which';

interface ManagedTerminal {
  id: string;
  pty: IPty;
  buffer: string;
  cols: number;
  rows: number;
  exited: boolean;
  status: TerminalStatus;
  pendingData: string;
  flushHandle: NodeJS.Immediate | null;
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

  const term: ManagedTerminal = {
    id: opts.id,
    pty,
    buffer: '',
    cols,
    rows,
    exited: false,
    status: 'idle',
    pendingData: '',
    flushHandle: null
  };
  terminals.set(opts.id, term);

  pty.onData((data) => {
    term.buffer += data;
    if (term.buffer.length > MAX_BUFFER) {
      term.buffer = term.buffer.slice(term.buffer.length - MAX_BUFFER);
    }
    term.pendingData += data;
    if (!term.flushHandle) {
      term.flushHandle = setImmediate(() => flushPending(term));
    }
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
