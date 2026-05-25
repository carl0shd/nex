import { existsSync } from 'fs';
import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import type { Agent, AgentAccount } from '@native/db/types';
import {
  AGENT_CATALOG,
  findBinaryInPath,
  getCatalogEntry,
  resolveConfigDir,
  type SuggestedAccount
} from './catalog';

export interface AvailableAgent {
  slug: string;
  name: string;
  command: string | null;
  configDir: string;
  installed: boolean;
  suggestedAccount: SuggestedAccount | null;
}

export interface InstallAgentResult {
  agent: Agent;
  account: AgentAccount | null;
}

export async function detectAvailableAgents(): Promise<AvailableAgent[]> {
  return Promise.all(
    AGENT_CATALOG.map(async (entry) => {
      const command = findBinaryInPath(entry.bin);
      const configDir = resolveConfigDir(entry);
      const installed = command !== null && existsSync(configDir);

      const existing = agentRepo.getBySlug(entry.slug);
      const hasDefaultAccount = existing
        ? agentAccountRepo.getDefault(existing.id) !== null
        : false;
      const suggestedAccount =
        installed && command && entry.detectAccount && !hasDefaultAccount
          ? await entry.detectAccount(command, configDir)
          : null;

      return {
        slug: entry.slug,
        name: entry.name,
        command,
        configDir,
        installed,
        suggestedAccount
      };
    })
  );
}

export async function installAgent(slug: string): Promise<InstallAgentResult> {
  const entry = getCatalogEntry(slug);
  if (!entry) throw new Error(`Unknown agent slug: ${slug}`);

  const command = findBinaryInPath(entry.bin);
  if (!command) throw new Error(`Agent binary not found in PATH: ${entry.bin}`);

  const configDir = resolveConfigDir(entry);
  if (!existsSync(configDir)) throw new Error(`Agent config directory not found: ${configDir}`);

  const existing = agentRepo.getBySlug(entry.slug);
  const agent = existing
    ? agentRepo.update(existing.id, { command })
    : agentRepo.create({
        name: entry.name,
        slug: entry.slug,
        command,
        defaultConfigDir: configDir,
        configEnvVar: entry.configEnvVar,
        args: entry.args,
        resumeArgs: entry.resumeArgs,
        skipPermissionsArgs: entry.skipPermissionsArgs
      });

  let account: AgentAccount | null = agentAccountRepo.getDefault(agent.id);
  if (!account && entry.detectAccount) {
    const suggested = await entry.detectAccount(command, configDir);
    if (suggested) {
      account = agentAccountRepo.create({
        agentId: agent.id,
        name: suggested.name,
        configDir: suggested.configDir,
        isDefault: true
      });
    }
  }

  return { agent, account };
}
