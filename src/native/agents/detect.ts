import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import type { Agent } from '@native/db/types';

function which(bin: string): string | null {
  const paths = (process.env.PATH ?? '').split(':');
  for (const dir of paths) {
    const full = join(dir, bin);
    if (existsSync(full)) return full;
  }
  return null;
}

function getClaudeAuthStatus(claudePath: string): Promise<{ email?: string } | null> {
  return new Promise((resolve) => {
    execFile(claudePath, ['auth', 'status'], (err, stdout, stderr) => {
      const text = (stdout || '').trim() || (stderr || '').trim();
      if (err || !text) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(text);
        if (!parsed.loggedIn) {
          resolve(null);
          return;
        }
        resolve({ email: parsed.email ?? undefined });
      } catch {
        resolve(null);
      }
    });
  });
}

export async function detectAgents(): Promise<Agent[]> {
  const detected: Agent[] = [];

  const claudePath = which('claude');
  if (!claudePath) return detected;

  const claudeDir = join(homedir(), '.claude');
  if (!existsSync(claudeDir)) return detected;

  const existing = agentRepo.getBySlug('claude-code');
  if (existing) return [existing];

  const auth = await getClaudeAuthStatus(claudePath);

  const afterAwait = agentRepo.getBySlug('claude-code');
  if (afterAwait) return [afterAwait];

  const agent = agentRepo.create({
    name: 'Anthropic Claude Code',
    slug: 'claude-code',
    command: 'claude',
    defaultConfigDir: claudeDir,
    configEnvVar: 'CLAUDE_CONFIG_DIR',
    resumeArgs: ['--resume'],
    skipPermissionsArgs: ['--dangerously-skip-permissions']
  });

  detected.push(agent);

  if (auth?.email) {
    agentAccountRepo.create({
      agentId: agent.id,
      name: auth.email,
      configDir: claudeDir,
      isDefault: true
    });
  }

  return detected;
}
