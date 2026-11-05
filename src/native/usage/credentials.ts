import { execFile } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const DEFAULT_KEYCHAIN_SERVICE = "Claude Code-credentials";
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

interface RawOAuth {
  accessToken?: string;
  refreshToken?: string;
  subscriptionType?: string;
  expiresAt?: number;
  scopes?: string[];
}

interface RawCredentialsFile {
  claudeAiOauth?: RawOAuth;
}

const cache = new Map<string, CachedCredentials>();

export function defaultConfigDir(): string {
  return join(homedir(), ".claude");
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
    expiresAt: oauth.expiresAt ?? null,
  };
}

export async function readKeychainCredentials(service: string): Promise<OAuthCredentials | null> {
  if (process.platform !== "darwin") return null;
  try {
    const { stdout } = await execFileAsync("security", [
      "find-generic-password",
      "-s",
      service,
      "-w",
    ]);
    return parseCredentials(stdout);
  } catch {
    return null;
  }
}

// Linux and Windows keep the same payload in a file instead of a keychain.
export function readCredentialsFile(configDir: string): OAuthCredentials | null {
  try {
    return parseCredentials(readFileSync(join(configDir, ".credentials.json"), "utf8"));
  } catch {
    return null;
  }
}

// `claude auth status` reports the identity of a config dir without unlocking
// the keychain, which is what binds an account to its credential entry.
export async function emailForConfigDir(
  command: string,
  configDir: string,
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(command, ["auth", "status"], {
      env: { ...process.env, CLAUDE_CONFIG_DIR: configDir },
      timeout: 10_000,
    });
    const parsed = JSON.parse(stdout.trim()) as { loggedIn?: boolean; email?: string };
    return parsed.loggedIn && parsed.email ? parsed.email : null;
  } catch {
    return null;
  }
}

export async function listKeychainServices(): Promise<string[]> {
  if (process.platform !== "darwin") return [];
  try {
    const { stdout } = await execFileAsync("security", ["dump-keychain"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return [...new Set([...stdout.matchAll(SERVICE_PATTERN)].map((match) => match[1]))];
  } catch {
    return [];
  }
}

export async function readCredentials(
  service: string | null,
  configDir: string,
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

// Claude Code's own OAuth client; a refresh is the same call it makes when a token runs out.
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const ACCOUNT_ATTRIBUTE = /"acct"<blob>="([^"]*)"/;

interface StoredCredentials {
  raw: RawCredentialsFile;
  save: (raw: RawCredentialsFile) => Promise<void>;
}

async function storedCredentials(
  service: string | null,
  configDir: string,
): Promise<StoredCredentials | null> {
  const file = join(configDir, ".credentials.json");
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as RawCredentialsFile;
    return { raw, save: async (next) => writeFileSync(file, JSON.stringify(next), "utf8") };
  } catch {
    if (!service || process.platform !== "darwin") return null;
  }
  try {
    const [{ stdout: secret }, { stdout: attributes }] = await Promise.all([
      execFileAsync("security", ["find-generic-password", "-s", service, "-w"]),
      execFileAsync("security", ["find-generic-password", "-s", service]),
    ]);
    const account = attributes.match(ACCOUNT_ATTRIBUTE)?.[1];
    if (!account) return null;
    return {
      raw: JSON.parse(secret) as RawCredentialsFile,
      save: (next) => writeKeychain(service, account, JSON.stringify(next)),
    };
  } catch {
    return null;
  }
}

// Through stdin so the token never shows up in the process list.
function writeKeychain(service: string, account: string, secret: string): Promise<void> {
  const hex = Buffer.from(secret, "utf8").toString("hex");
  return new Promise((resolve, reject) => {
    const child = execFile("security", ["-i"], (error) => (error ? reject(error) : resolve()));
    child.stdin?.end(`add-generic-password -U -a "${account}" -s "${service}" -X ${hex}\n`);
  });
}

export async function refreshCredentials(
  service: string | null,
  configDir: string,
): Promise<OAuthCredentials | null> {
  const stored = await storedCredentials(service, configDir);
  const oauth = stored?.raw.claudeAiOauth;
  if (!stored || !oauth?.refreshToken) return null;
  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: oauth.refreshToken,
        client_id: CLIENT_ID,
        ...(oauth.scopes?.length ? { scope: oauth.scopes.join(" ") } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    if (!data.access_token || !data.expires_in) return null;
    const next: RawCredentialsFile = {
      ...stored.raw,
      claudeAiOauth: {
        ...oauth,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? oauth.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
        scopes: data.scope ? data.scope.split(" ") : oauth.scopes,
      },
    };
    await stored.save(next);
    cache.delete(service ?? configDir);
    return parseCredentials(JSON.stringify(next));
  } catch {
    return null;
  }
}
