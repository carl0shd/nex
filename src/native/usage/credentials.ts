import { execFile } from 'child_process';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const DEFAULT_KEYCHAIN_SERVICE = 'Claude Code-credentials';
const SERVICE_PATTERN = /"svce"<blob>="(Claude Code-credentials[^"]*)"/g;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface OAuthCredentials {
  accessToken: string;
  subscriptionType: string | null;
  expiresAt: number | null;
}

interface CachedCredentials {
  credentials: OAuthCredentials | null;
  readAt: number;
}

interface RawCredentialsFile {
  claudeAiOauth?: {
    accessToken?: string;
    subscriptionType?: string;
    expiresAt?: number;
  };
}

const cache = new Map<string, CachedCredentials>();

export function defaultConfigDir(): string {
  return join(homedir(), '.claude');
}

function parseCredentials(raw: string): OAuthCredentials | null {
  let parsed: RawCredentialsFile;
  try {
    parsed = JSON.parse(raw) as RawCredentialsFile;
  } catch {
    return null;
  }

  const oauth = parsed.claudeAiOauth;
  if (!oauth?.accessToken) return null;

  return {
    accessToken: oauth.accessToken,
    subscriptionType: oauth.subscriptionType ?? null,
    expiresAt: oauth.expiresAt ?? null
  };
}

export async function readKeychainCredentials(service: string): Promise<OAuthCredentials | null> {
  if (process.platform !== 'darwin') return null;
  try {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password',
      '-s',
      service,
      '-w'
    ]);
    return parseCredentials(stdout);
  } catch {
    return null;
  }
}

// Linux and Windows keep the same payload in a file instead of a keychain.
export function readCredentialsFile(configDir: string): OAuthCredentials | null {
  try {
    return parseCredentials(readFileSync(join(configDir, '.credentials.json'), 'utf8'));
  } catch {
    return null;
  }
}

// `claude auth status` reports the identity of a config dir without unlocking
// the keychain, which is what binds an account to its credential entry.
export async function emailForConfigDir(
  command: string,
  configDir: string
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(command, ['auth', 'status'], {
      env: { ...process.env, CLAUDE_CONFIG_DIR: configDir },
      timeout: 10_000
    });
    const parsed = JSON.parse(stdout.trim()) as { loggedIn?: boolean; email?: string };
    return parsed.loggedIn && parsed.email ? parsed.email : null;
  } catch {
    return null;
  }
}

export async function listKeychainServices(): Promise<string[]> {
  if (process.platform !== 'darwin') return [];
  try {
    const { stdout } = await execFileAsync('security', ['dump-keychain'], {
      maxBuffer: 64 * 1024 * 1024
    });
    return [...new Set([...stdout.matchAll(SERVICE_PATTERN)].map((match) => match[1]))];
  } catch {
    return [];
  }
}

export async function readCredentials(
  service: string | null,
  configDir: string
): Promise<OAuthCredentials | null> {
  const cacheKey = service ?? configDir;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.readAt < CACHE_TTL_MS) return cached.credentials;

  const fromFile = readCredentialsFile(configDir);
  const credentials = fromFile ?? (service ? await readKeychainCredentials(service) : null);

  cache.set(cacheKey, { credentials, readAt: Date.now() });
  return credentials;
}

export function isExpired(credentials: OAuthCredentials): boolean {
  return credentials.expiresAt !== null && credentials.expiresAt <= Date.now();
}

export function forgetCachedCredentials(): void {
  cache.clear();
}
