import { execFile } from 'child_process';
import { readFileSync, appendFileSync, mkdirSync } from 'fs';
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
