import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  statSync,
  watch,
} from "fs";
import { homedir } from "os";
import { basename, join } from "path";
import { StringDecoder } from "string_decoder";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import * as terminalRepo from "@native/db/repositories/terminal.repo";
import { pastClaudeSessions } from "@native/agents/agent-history";

export interface TranscriptCursor {
  path: string;
  offset: number;
}

export interface TranscriptChunk {
  path: string | null;
  offset: number;
  reset: boolean;
  entries: unknown[];
}

const KEPT_TYPES = new Set(["user", "assistant", "system"]);
const MAX_TEXT = 6_000;
const WATCH_DEBOUNCE_MS = 120;

const encodeCwd = (cwd: string) => cwd.replace(/[^A-Za-z0-9]/g, "-");

function configRoots(terminalId: string): { cwd: string; roots: string[] } | null {
  const terminal = terminalRepo.getById(terminalId);
  const session = terminal ? sessionRepo.getById(terminal.sessionId) : null;
  if (!terminal || !session) return null;
  const account = session.accountId ? agentAccountRepo.getById(session.accountId) : null;
  const defaultRoot = join(homedir(), ".claude");
  const roots = account && account.configDir !== defaultRoot ? [account.configDir] : [];
  return { cwd: terminal.cwd, roots: [...roots, defaultRoot] };
}

function projectDirs(terminalId: string): string[] {
  const context = configRoots(terminalId);
  if (!context) return [];
  return context.roots.map((root) => join(root, "projects", encodeCwd(context.cwd)));
}

function newestTranscript(dirs: string[]): string | null {
  let newest: { path: string; mtime: number } | null = null;
  for (const dir of dirs) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".jsonl")) continue;
      const path = join(dir, entry);
      try {
        const mtime = statSync(path).mtimeMs;
        if (!newest || mtime > newest.mtime) newest = { path, mtime };
      } catch {
        /* removed while scanning */
      }
    }
  }
  return newest?.path ?? null;
}

function sessionFile(dirs: string[], claudeSessionId: string): string | null {
  for (const dir of dirs) {
    const path = join(dir, `${claudeSessionId}.jsonl`);
    try {
      statSync(path);
      return path;
    } catch {
      /* not in this root */
    }
  }
  return null;
}

export function transcriptPath(terminalId: string): string | null {
  const dirs = projectDirs(terminalId);
  const claudeSessionId = terminalRepo.getById(terminalId)?.agentSessionId;
  return (claudeSessionId && sessionFile(dirs, claudeSessionId)) || newestTranscript(dirs);
}

function pastEntries(terminalId: string, currentPath: string): unknown[] {
  const terminal = terminalRepo.getById(terminalId);
  if (!terminal) return [];
  const dirs = projectDirs(terminalId);
  return pastClaudeSessions(terminal.sessionId).flatMap((claudeSessionId) => {
    const path = sessionFile(dirs, claudeSessionId);
    return path && path !== currentPath ? readFrom(path, 0).entries : [];
  });
}

const clip = (text: unknown) =>
  typeof text === "string" && text.length > MAX_TEXT ? text.slice(-MAX_TEXT) : text;

function slim(entry: Record<string, unknown>): Record<string, unknown> {
  const result = entry.toolUseResult;
  if (result && typeof result === "object") {
    const copy = { ...(result as Record<string, unknown>) };
    const file = copy.file as Record<string, unknown> | undefined;
    if (file && typeof file === "object") copy.file = { ...file, content: undefined };
    copy.stdout = clip(copy.stdout);
    copy.stderr = clip(copy.stderr);
    copy.content = clip(copy.content);
    copy.originalFile = undefined;
    entry = { ...entry, toolUseResult: copy };
  }
  const message = entry.message as { content?: unknown } | undefined;
  if (message && Array.isArray(message.content)) {
    entry = {
      ...entry,
      message: {
        ...message,
        content: message.content.map((block: Record<string, unknown>) =>
          block.type === "tool_result" ? { ...block, content: clip(block.content) } : block,
        ),
      },
    };
  }
  return entry;
}

function readFrom(path: string, offset: number): { entries: unknown[]; offset: number } {
  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    return { entries: [], offset };
  }
  if (size <= offset) return { entries: [], offset: Math.min(offset, size) };

  const fd = openSync(path, "r");
  const buffer = Buffer.alloc(size - offset);
  try {
    readSync(fd, buffer, 0, buffer.length, offset);
  } finally {
    closeSync(fd);
  }
  const text = new StringDecoder("utf8").write(buffer);
  const lastBreak = text.lastIndexOf("\n");
  if (lastBreak < 0) return { entries: [], offset };

  const complete = text.slice(0, lastBreak);
  const entries: unknown[] = [];
  for (const line of complete.split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      if (KEPT_TYPES.has(entry.type as string) && !entry.isSidechain) entries.push(slim(entry));
    } catch {
      /* partial or corrupt line */
    }
  }
  return { entries, offset: offset + Buffer.byteLength(text.slice(0, lastBreak + 1)) };
}

export function readTranscript(
  terminalId: string,
  cursor: TranscriptCursor | null,
): TranscriptChunk {
  const path = transcriptPath(terminalId);
  if (!path) return { path: null, offset: 0, reset: cursor !== null, entries: [] };
  const reset = !cursor || cursor.path !== path;
  const { entries, offset } = readFrom(path, reset ? 0 : cursor.offset);
  return {
    path,
    offset,
    reset,
    entries: reset ? [...pastEntries(terminalId, path), ...entries] : entries,
  };
}

export function watchTranscript(terminalId: string, onChange: () => void): () => void {
  let timer: NodeJS.Timeout | null = null;
  const notify = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, WATCH_DEBOUNCE_MS);
  };
  const watchers = projectDirs(terminalId).flatMap((dir) => {
    try {
      mkdirSync(dir, { recursive: true });
      return [watch(dir, notify)];
    } catch {
      return [];
    }
  });
  return () => {
    if (timer) clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  };
}

export function carryTranscript(terminalId: string, toConfigDir: string): void {
  const from = transcriptPath(terminalId);
  const cwd = terminalRepo.getById(terminalId)?.cwd;
  if (!from || !cwd) return;
  const dir = join(toConfigDir, "projects", encodeCwd(cwd));
  const to = join(dir, basename(from));
  if (from === to || existsSync(to)) return;
  mkdirSync(dir, { recursive: true });
  copyFileSync(from, to);
}
