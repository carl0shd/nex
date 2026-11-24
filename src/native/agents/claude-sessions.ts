import {
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  statSync,
} from "fs";
import { homedir } from "os";
import { basename, dirname, join } from "path";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import * as projectRepo from "@native/db/repositories/project.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import * as terminalRepo from "@native/db/repositories/terminal.repo";
import { claudeSessionTitle } from "@native/agents/claude-session-title";
import { encodeCwd } from "@native/agents/transcript";

export interface ClaudeSessionInfo {
  id: string;
  title: string;
  updatedAt: number;
  path: string;
}

const HEAD_BYTES = 64 * 1024;
const LISTED = 30;
const defaultRoot = () => join(homedir(), ".claude");

function configRoots(): string[] {
  const accounts = agentAccountRepo.getAll().map((account) => account.configDir);
  return [...new Set([defaultRoot(), ...accounts])];
}

function headLines(path: string): string[] {
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(HEAD_BYTES);
    const read = readSync(fd, buffer, 0, HEAD_BYTES, 0);
    return buffer.subarray(0, read).toString("utf8").split("\n").slice(0, -1);
  } finally {
    closeSync(fd);
  }
}

export function listClaudeSessions(projectId: string): ClaudeSessionInfo[] {
  const project = projectRepo.getById(projectId);
  if (!project) return [];
  const claimed = new Set(terminalRepo.getAll().map((terminal) => terminal.agentSessionId));
  const found: ClaudeSessionInfo[] = [];
  for (const root of configRoots()) {
    const dir = join(root, "projects", encodeCwd(project.path));
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".jsonl")) continue;
      const id = basename(name, ".jsonl");
      if (claimed.has(id) || found.some((session) => session.id === id)) continue;
      const path = join(dir, name);
      try {
        const title = claudeSessionTitle(headLines(path));
        if (title) found.push({ id, title, updatedAt: statSync(path).mtimeMs, path });
      } catch {
        /* removed or unreadable */
      }
    }
  }
  return found.toSorted((a, b) => b.updatedAt - a.updatedAt).slice(0, LISTED);
}

export function adoptClaudeSession(terminalId: string, source: ClaudeSessionInfo): void {
  const terminal = terminalRepo.getById(terminalId);
  const session = terminal ? sessionRepo.getById(terminal.sessionId) : null;
  if (!terminal || !session || !existsSync(source.path)) return;
  const account = session.accountId ? agentAccountRepo.getById(session.accountId) : null;
  const dir = join(account?.configDir ?? defaultRoot(), "projects", encodeCwd(terminal.cwd));
  const target = join(dir, `${source.id}.jsonl`);
  mkdirSync(dir, { recursive: true });
  if (target !== source.path) copyFileSync(source.path, target);
  const extras = join(dirname(source.path), source.id);
  if (existsSync(extras) && extras !== join(dir, source.id)) {
    cpSync(extras, join(dir, source.id), { recursive: true, force: false });
  }
  terminalRepo.setAgentSessionId(terminal.id, source.id);
}
