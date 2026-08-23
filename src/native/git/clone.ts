import { execFile, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { whichBinary } from '@native/which';

export interface GitInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
}

export interface CloneProgress {
  phase: string;
  percent: number | null;
}

export interface CloneResult {
  path: string;
  name: string;
}

export async function detectGit(): Promise<GitInfo> {
  const path = whichBinary('git');
  if (!path) return { installed: false, path: null, version: null };

  const version = await new Promise<string | null>((resolve) => {
    execFile(path, ['--version'], (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim().replace(/^git version\s*/, '') || null);
    });
  });

  return { installed: version !== null, path, version };
}

export function repoNameFromUrl(url: string): string {
  const cleaned = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  // Handles both https://host/user/repo and scp-like git@host:user/repo forms.
  const segment = cleaned.split(/[/:]/).pop() ?? '';
  return segment;
}

export function normalizeUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
}

export function getOriginUrl(repoPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', ['-C', repoPath, 'remote', 'get-url', 'origin'], (err, stdout) => {
      resolve(err ? null : stdout.trim());
    });
  });
}

export function spawnClone(
  command: string,
  args: string[],
  result: CloneResult,
  onProgress?: (progress: CloneProgress) => void
): Promise<CloneResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      // Fail fast instead of hanging on an interactive credential prompt.
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });

    let stderrTail = '';
    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4096);
      const match =
        /(Counting objects|Compressing objects|Receiving objects|Resolving deltas|Updating files):\s+(\d+)%/.exec(
          text
        );
      if (match) onProgress?.({ phase: match[1], percent: Number(match[2]) });
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(result);
        return;
      }
      const lines = stderrTail
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !/%/.test(l));
      reject(new Error(lines.pop() ?? `${command} clone failed with exit code ${code}`));
    });
  });
}

export async function cloneRepository(
  url: string,
  parentDir: string,
  onProgress?: (progress: CloneProgress) => void
): Promise<CloneResult> {
  const name = repoNameFromUrl(url);
  if (!name) throw new Error('Could not determine repository name from URL');

  const dest = join(parentDir, name);

  if (existsSync(dest)) {
    // Re-running after a completed clone (e.g. navigating back through onboarding)
    // should succeed instead of failing on the existing folder.
    const origin = await getOriginUrl(dest);
    if (origin && normalizeUrl(origin) === normalizeUrl(url)) return { path: dest, name };
    throw new Error(`Folder already exists: ${dest}`);
  }

  return spawnClone(
    'git',
    ['clone', '--progress', url.trim(), dest],
    { path: dest, name },
    onProgress
  );
}
