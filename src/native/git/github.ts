import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { whichBinary } from '@native/which';
import {
  getOriginUrl,
  normalizeUrl,
  spawnClone,
  type CloneProgress,
  type CloneResult
} from '@native/git/clone';

export interface GhInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
  authenticated: boolean;
  login: string | null;
}

export interface GithubOwner {
  login: string;
  type: 'user' | 'org';
}

export interface GithubRepo {
  name: string;
  nameWithOwner: string;
  description: string;
  isPrivate: boolean;
  updatedAt: string;
}

function gh(ghPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(ghPath, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr.trim() || err.message));
      else resolve(stdout.trim());
    });
  });
}

function findGh(): string {
  const path = whichBinary('gh');
  if (!path) throw new Error('GitHub CLI (gh) not found');
  return path;
}

export async function detectGh(): Promise<GhInfo> {
  const path = whichBinary('gh');
  if (!path)
    return { installed: false, path: null, version: null, authenticated: false, login: null };

  const version = await gh(path, ['--version'])
    .then((out) => /gh version (\S+)/.exec(out)?.[1] ?? null)
    .catch(() => null);

  const login = await gh(path, ['api', 'user', '--jq', '.login']).catch(() => null);

  return { installed: true, path, version, authenticated: login !== null, login };
}

export async function listGithubOwners(): Promise<GithubOwner[]> {
  const path = findGh();
  const [login, orgsOut] = await Promise.all([
    gh(path, ['api', 'user', '--jq', '.login']),
    gh(path, ['api', 'user/orgs', '--paginate', '--jq', '.[].login'])
  ]);

  const orgs = orgsOut
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return [
    { login, type: 'user' as const },
    ...orgs.map((org) => ({ login: org, type: 'org' as const }))
  ];
}

export async function listGithubRepos(owner: string): Promise<GithubRepo[]> {
  const path = findGh();
  const out = await gh(path, [
    'repo',
    'list',
    owner,
    '--limit',
    '200',
    '--json',
    'name,nameWithOwner,description,isPrivate,updatedAt'
  ]);
  return JSON.parse(out || '[]') as GithubRepo[];
}

export async function cloneGithubRepo(
  nameWithOwner: string,
  parentDir: string,
  onProgress?: (progress: CloneProgress) => void
): Promise<CloneResult> {
  const path = findGh();
  const name = nameWithOwner.split('/').pop() ?? '';
  if (!name) throw new Error(`Invalid repository: ${nameWithOwner}`);

  const dest = join(parentDir, name);

  if (existsSync(dest)) {
    // Same idempotency as cloneRepository: an already-cloned repo counts as success.
    const origin = await getOriginUrl(dest);
    if (origin && normalizeUrl(origin).toLowerCase().endsWith(nameWithOwner.toLowerCase())) {
      return { path: dest, name };
    }
    throw new Error(`Folder already exists: ${dest}`);
  }

  // gh injects the user's auth, so private repos clone without credential setup.
  return spawnClone(
    path,
    ['repo', 'clone', nameWithOwner, dest, '--', '--progress'],
    { path: dest, name },
    onProgress
  );
}
