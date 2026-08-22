import { watch, type FSWatcher } from 'fs';
import { execFile } from 'child_process';

const DEBOUNCE_MS = 250;

// A single `yarn install` or build would otherwise reset the debounce timer
// forever. Cheaper than a full gitignore evaluation.
const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  'out',
  'build',
  'target',
  '.next',
  '.turbo',
  '.venv',
  '.cache',
  '__pycache__'
]);

interface WorktreeWatch {
  watchers: FSWatcher[];
  listeners: Set<() => void>;
  timer: NodeJS.Timeout | null;
}

const watches = new Map<string, WorktreeWatch>();

function isIgnored(relativePath: string | null): boolean {
  if (!relativePath) return false;
  return relativePath.split('/').some((segment) => IGNORED_SEGMENTS.has(segment));
}

function resolveGitDir(worktreePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', ['rev-parse', '--absolute-git-dir'], { cwd: worktreePath }, (err, stdout) => {
      resolve(err ? null : stdout.trim() || null);
    });
  });
}

function notify(entry: WorktreeWatch): void {
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    entry.timer = null;
    for (const listener of entry.listeners) listener();
  }, DEBOUNCE_MS);
}

function addWatcher(entry: WorktreeWatch, path: string, recursive: boolean): void {
  try {
    const watcher = watch(path, { recursive, persistent: false }, (_event, filename) => {
      const name = typeof filename === 'string' ? filename : null;
      if (recursive && isIgnored(name)) return;
      notify(entry);
    });
    watcher.on('error', () => watcher.close());
    entry.watchers.push(watcher);
  } catch {
    /* the path may have been removed underneath us */
  }
}

async function startWatchers(worktreePath: string, entry: WorktreeWatch): Promise<void> {
  addWatcher(entry, worktreePath, true);

  // Commits and staging land in the worktree's git dir, which lives outside the
  // worktree itself for linked worktrees and so is missed by the tree watcher.
  const gitDir = await resolveGitDir(worktreePath);
  if (!gitDir || watches.get(worktreePath) !== entry) return;
  addWatcher(entry, gitDir, false);
}

// Watches are shared per worktree and torn down with the last listener.
export function watchWorktree(worktreePath: string, onChange: () => void): () => void {
  let entry = watches.get(worktreePath);

  if (!entry) {
    entry = { watchers: [], listeners: new Set(), timer: null };
    watches.set(worktreePath, entry);
    void startWatchers(worktreePath, entry);
  }

  entry.listeners.add(onChange);

  return () => {
    const current = watches.get(worktreePath);
    if (!current) return;
    current.listeners.delete(onChange);
    if (current.listeners.size > 0) return;

    watches.delete(worktreePath);
    if (current.timer) clearTimeout(current.timer);
    for (const watcher of current.watchers) watcher.close();
    current.watchers.length = 0;
  };
}
