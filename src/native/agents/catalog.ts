import { execFile } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { whichBinary } from '@native/which';

export interface SuggestedAccount {
  name: string;
  configDir: string;
}

export interface AgentCatalogEntry {
  slug: string;
  name: string;
  bin: string;
  configDirRel: string;
  configEnvVar: string;
  args?: string[];
  resumeArgs?: string[];
  skipPermissionsArgs?: string[];
  detectAccount?: (command: string, configDir: string) => Promise<SuggestedAccount | null>;
}

function runCommand(cmd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(cmd, args, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      const text = stdout.trim();
      resolve(text || null);
    });
  });
}

async function detectClaudeAccount(
  command: string,
  configDir: string
): Promise<SuggestedAccount | null> {
  const text = await runCommand(command, ['auth', 'status']);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed.loggedIn || !parsed.email) return null;
    return { name: parsed.email, configDir };
  } catch {
    return null;
  }
}

export const AGENT_CATALOG: AgentCatalogEntry[] = [
  {
    slug: 'claude-code',
    name: 'Anthropic Claude Code',
    bin: 'claude',
    configDirRel: '.claude',
    configEnvVar: 'CLAUDE_CONFIG_DIR',
    resumeArgs: ['--resume'],
    skipPermissionsArgs: ['--dangerously-skip-permissions'],
    detectAccount: detectClaudeAccount
  }
];

export function getCatalogEntry(slug: string): AgentCatalogEntry | null {
  return AGENT_CATALOG.find((e) => e.slug === slug) ?? null;
}

export function resolveConfigDir(entry: AgentCatalogEntry): string {
  return join(homedir(), entry.configDirRel);
}

export function findBinaryInPath(bin: string): string | null {
  return whichBinary(bin);
}
