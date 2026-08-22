import { execFile } from 'child_process';
import { readFileSync, appendFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr.trim() || err.message));
      else resolve(stdout.trim());
    });
  });
}

function gitSilent(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (_err, stdout) => {
      resolve((stdout || '').trim());
    });
  });
}

// Returns stdout regardless of exit code or trimming. Used for `git diff`,
// where `--no-index` exits non-zero by design and trailing newlines matter.
function gitDiffRaw(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (_err, stdout) => {
      resolve(stdout || '');
    });
  });
}

// Trailing newlines are preserved: they are part of the file contents.
function gitReadRaw(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      resolve(err ? null : stdout);
    });
  });
}

function gitOk(cwd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (err) => resolve(err == null));
  });
}

/** Reads a NUL-separated path list, which is the only form safe for odd filenames. */
async function listPaths(cwd: string, args: string[]): Promise<string[]> {
  const output = await gitDiffRaw(cwd, args);
  return output.split('\0').filter(Boolean);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function isGitRepo(path: string): Promise<boolean> {
  try {
    await git(path, ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

export async function detectBaseBranch(repo: string): Promise<string> {
  try {
    const ref = await git(repo, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
    const branch = ref.replace('refs/remotes/origin/', '');
    if (branch) return branch;
  } catch {
    await gitSilent(repo, ['remote', 'set-head', 'origin', '--auto']);
  }

  try {
    const ref = await git(repo, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
    const branch = ref.replace('refs/remotes/origin/', '');
    if (branch) return branch;
  } catch {
    /* empty */
  }

  return 'main';
}

export async function fetchOrigin(repo: string): Promise<void> {
  await gitSilent(repo, ['fetch', 'origin', '--quiet']);
}

export async function listBranches(repo: string): Promise<string[]> {
  const output = await gitSilent(repo, [
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/heads/',
    'refs/remotes/'
  ]);
  if (!output) return [];
  const seen = new Set<string>();
  const branches: string[] = [];
  for (const raw of output.split('\n')) {
    const name = raw.replace(/^origin\//, '').trim();
    if (!name || name === 'HEAD' || seen.has(name)) continue;
    seen.add(name);
    branches.push(name);
  }
  return branches.sort((a, b) => a.localeCompare(b));
}

export async function createWorktree(
  repo: string,
  branch: string,
  path: string,
  base: string
): Promise<void> {
  await git(repo, ['worktree', 'add', '-b', branch, path, base, '--quiet']);
}

export async function removeWorktree(repo: string, path: string): Promise<void> {
  await gitSilent(repo, ['worktree', 'remove', path, '--force']);
  await gitSilent(repo, ['worktree', 'prune']);
}

export async function deleteBranch(repo: string, branch: string): Promise<void> {
  await gitSilent(repo, ['branch', '-D', branch]);
}

export interface WorktreeEntry {
  path: string;
  type: 'file' | 'folder';
}

export async function listWorktreeFiles(repo: string): Promise<WorktreeEntry[]> {
  const output = await gitSilent(repo, ['ls-files', '--cached', '--others', '--exclude-standard']);
  if (!output) return [];

  const files = output.split('\n').filter(Boolean);
  const folders = new Set<string>();
  for (const file of files) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) {
      folders.add(parts.slice(0, i).join('/'));
    }
  }

  const entries: WorktreeEntry[] = [];
  for (const folder of folders) entries.push({ path: folder, type: 'folder' });
  for (const file of files) entries.push({ path: file, type: 'file' });
  return entries;
}

export interface WorktreeDiffOptions {
  baseBranch?: string;
  ignoreWhitespace?: boolean;
}

// Anything bigger is almost always a build artifact that escaped .gitignore,
// and rendering it would stall the viewer for no benefit.
const MAX_UNTRACKED_BYTES = 2 * 1024 * 1024;
const UNTRACKED_CONCURRENCY = 8;

// The merge base, so the diff covers commits made in the worktree as well as
// uncommitted work. HEAD alone would hide the commits.
async function resolveDiffBase(worktreePath: string, baseBranch?: string): Promise<string> {
  if (!baseBranch) return 'HEAD';
  for (const ref of [`origin/${baseBranch}`, baseBranch]) {
    const mergeBase = await gitSilent(worktreePath, ['merge-base', ref, 'HEAD']);
    if (mergeBase) return mergeBase;
  }
  return 'HEAD';
}

// One patch covering commits, staged, unstaged and untracked work. The renderer
// parses it once to derive both the file list and the rendered diff.
export async function getWorktreeDiff(
  worktreePath: string,
  options: WorktreeDiffOptions = {}
): Promise<string> {
  const base = await resolveDiffBase(worktreePath, options.baseBranch);
  const whitespace = options.ignoreWhitespace ? ['-w'] : [];

  const tracked = await gitDiffRaw(worktreePath, [
    '-c',
    'core.quotepath=false',
    'diff',
    ...whitespace,
    base
  ]);

  // A path staged as deleted and then recreated shows up in both passes; the
  // renderer keys files by path, so it has to appear exactly once.
  const changed = new Set(
    await listPaths(worktreePath, ['-c', 'core.quotepath=false', 'diff', '--name-only', '-z', base])
  );
  const untracked = await listPaths(worktreePath, [
    '-c',
    'core.quotepath=false',
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z'
  ]);
  const files = untracked.filter((file) => !changed.has(file));

  const patches = await mapWithConcurrency(files, UNTRACKED_CONCURRENCY, async (file) => {
    try {
      if (statSync(join(worktreePath, file)).size > MAX_UNTRACKED_BYTES) return '';
    } catch {
      return '';
    }
    return gitDiffRaw(worktreePath, [
      '-c',
      'core.quotepath=false',
      'diff',
      ...whitespace,
      '--no-index',
      '--',
      '/dev/null',
      file
    ]);
  });

  let result = tracked;
  for (const patch of patches) {
    if (!patch) continue;
    if (result && !result.endsWith('\n')) result += '\n';
    result += patch;
  }

  return result;
}

export interface WorktreeFileVersionsInput {
  worktreePath: string;
  path: string;
  prevPath?: string;
  baseBranch?: string;
}

export interface WorktreeFileVersions {
  oldContents: string | null;
  newContents: string | null;
}

/**
 * Reads both sides of a file in full so the viewer can expand the unchanged
 * context around a hunk, which a patch alone does not carry.
 */
export async function readWorktreeFileVersions(
  input: WorktreeFileVersionsInput
): Promise<WorktreeFileVersions> {
  const { worktreePath, path, prevPath, baseBranch } = input;
  const base = await resolveDiffBase(worktreePath, baseBranch);

  const oldContents = await gitReadRaw(worktreePath, ['show', `${base}:${prevPath ?? path}`]);

  let newContents: string | null = null;
  try {
    newContents = readFileSync(join(worktreePath, path), 'utf-8');
  } catch {
    newContents = null;
  }

  return { oldContents, newContents };
}

// Only uncommitted work is discarded: commits already made in the worktree are
// left alone, so this can never throw away more than the tree shows as pending.
export async function discardWorktreeFileChanges(
  worktreePath: string,
  path: string,
  prevPath?: string
): Promise<void> {
  const paths = prevPath && prevPath !== path ? [path, prevPath] : [path];

  for (const target of paths) {
    const existsInHead = await gitOk(worktreePath, ['cat-file', '-e', `HEAD:${target}`]);
    if (existsInHead) {
      await gitSilent(worktreePath, [
        'restore',
        '--staged',
        '--worktree',
        '--source=HEAD',
        '--',
        target
      ]);
      continue;
    }

    await gitSilent(worktreePath, ['rm', '-f', '--cached', '--ignore-unmatch', '--', target]);
    try {
      rmSync(join(worktreePath, target), { force: true });
    } catch {
      /* already gone */
    }
  }
}

export function setupGitExclude(repo: string): void {
  const gitDir = join(repo, '.git');
  let realGitDir = gitDir;

  try {
    const content = readFileSync(gitDir, 'utf-8');
    const target = content.trim().replace('gitdir: ', '');
    if (target) realGitDir = join(repo, target);
  } catch {
    // .git is a directory, not a file — use as-is
  }

  const excludeDir = join(realGitDir, 'info');
  mkdirSync(excludeDir, { recursive: true });

  const excludePath = join(excludeDir, 'exclude');
  let existing = '';
  try {
    existing = readFileSync(excludePath, 'utf-8');
  } catch {
    /* empty */
  }
  const lines = existing.split('\n');

  const patterns = ['.worktrees', 'TASK_NOTES.md', 'SHARED_CONTEXT.md'];
  const additions = patterns.filter((p) => !lines.some((l) => l.trim() === p));

  if (additions.length > 0) {
    appendFileSync(excludePath, additions.join('\n') + '\n');
  }
}
