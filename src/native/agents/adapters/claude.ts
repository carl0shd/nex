import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  watch,
  type FSWatcher
} from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Agent } from '@native/db/types';
import type { AgentResumeAdapter, SessionTrackerHandle } from '@native/agents/resume';

const SETTLE_INSPECT_DELAY_MS = 1_000;
const WATCH_DEBOUNCE_MS = 100;

function encodeCwd(cwd: string): string {
  return cwd.replace(/[^A-Za-z0-9]/g, '-');
}

function projectDir(cwd: string): string {
  return join(homedir(), '.claude', 'projects', encodeCwd(cwd));
}

function sessionFile(cwd: string, sessionId: string): string {
  return join(projectDir(cwd), `${sessionId}.jsonl`);
}

function listSessionIds(dir: string): Set<string> {
  const out = new Set<string>();
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.endsWith('.jsonl')) out.add(entry.slice(0, -6));
    }
  } catch {
    /* dir doesn't exist yet */
  }
  return out;
}

function watchForNewSession(
  cwd: string,
  onDiscovered: (sessionId: string) => void
): SessionTrackerHandle {
  const dir = projectDir(cwd);
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    return { stop: () => {} };
  }

  const known = listSessionIds(dir);
  let resolved = false;
  let watcher: FSWatcher | null = null;
  let settleTimer: NodeJS.Timeout | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;

  const finish = (sessionId: string | null): void => {
    if (resolved) return;
    resolved = true;
    if (settleTimer) clearTimeout(settleTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    if (watcher) {
      try {
        watcher.close();
      } catch {
        /* */
      }
    }
    if (sessionId) onDiscovered(sessionId);
  };

  const inspect = (): void => {
    const current = listSessionIds(dir);
    let newest: { id: string; mtime: number } | null = null;
    for (const id of current) {
      if (known.has(id)) continue;
      try {
        const mtime = statSync(join(dir, `${id}.jsonl`)).mtimeMs;
        if (!newest || mtime > newest.mtime) newest = { id, mtime };
      } catch {
        /* file disappeared mid-scan */
      }
    }
    if (newest) finish(newest.id);
  };

  const scheduleInspect = (): void => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      inspect();
    }, WATCH_DEBOUNCE_MS);
  };

  try {
    watcher = watch(dir, scheduleInspect);
  } catch {
    /* fs.watch unsupported on this platform */
  }

  settleTimer = setTimeout(() => {
    settleTimer = null;
    inspect();
  }, SETTLE_INSPECT_DELAY_MS);

  return {
    stop(): void {
      finish(null);
    }
  };
}

export const claudeAdapter: AgentResumeAdapter = {
  slug: 'claude-code',
  sessionExists(cwd, sessionId) {
    return existsSync(sessionFile(cwd, sessionId));
  },
  deleteSession(cwd, sessionId) {
    try {
      unlinkSync(sessionFile(cwd, sessionId));
    } catch {
      /* */
    }
  },
  listSessionIds(cwd) {
    return Array.from(listSessionIds(projectDir(cwd)));
  },
  buildResumeArgs(agent: Agent, sessionId: string) {
    return [...agent.resumeArgs, sessionId];
  },
  watchForNewSession
};
