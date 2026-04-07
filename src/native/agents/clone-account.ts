import { existsSync, mkdirSync, copyFileSync, cpSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import type { AgentAccount, CloneAgentAccountInput } from '@native/db/types';

export function cloneAgentAccount(input: CloneAgentAccountInput): AgentAccount {
  const agent = agentRepo.getById(input.agentId);
  if (!agent) throw new Error(`Agent not found: ${input.agentId}`);

  const accountDir = join(homedir(), '.nex', 'accounts', input.name);
  mkdirSync(accountDir, { recursive: true });

  if (input.copyConfig && agent.defaultConfigDir) {
    const src = agent.defaultConfigDir;

    const settingsFile = join(src, 'settings.json');
    if (existsSync(settingsFile)) copyFileSync(settingsFile, join(accountDir, 'settings.json'));

    for (const dir of ['commands', 'skills', 'agents']) {
      const srcDir = join(src, dir);
      try {
        if (statSync(srcDir).isDirectory()) {
          cpSync(srcDir, join(accountDir, dir), { recursive: true });
        }
      } catch {
        /* empty */
      }
    }

    const claudeMd = join(homedir(), 'CLAUDE.md');
    if (existsSync(claudeMd)) copyFileSync(claudeMd, join(accountDir, 'CLAUDE.md'));
  }

  return agentAccountRepo.create({
    agentId: agent.id,
    name: input.name,
    configDir: accountDir,
    isDefault: false
  });
}
