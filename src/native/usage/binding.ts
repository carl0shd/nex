import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import type { AgentAccount } from '@native/db/types';
import { fetchAccountProfile } from '@native/usage/api';
import {
  DEFAULT_KEYCHAIN_SERVICE,
  defaultConfigDir,
  emailForConfigDir,
  listKeychainServices,
  readCredentialsFile,
  readKeychainCredentials
} from '@native/usage/credentials';

const RETRY_AFTER_MS = 10 * 60 * 1000;

const lastAttempt = new Map<string, number>();

function bind(account: AgentAccount, service: string): string {
  agentAccountRepo.update(account.id, { keychainService: service });
  return service;
}

async function discover(account: AgentAccount): Promise<string | null> {
  const agent = agentRepo.getById(account.agentId);
  if (!agent?.command) return null;

  const email = await emailForConfigDir(agent.command, account.configDir);
  if (!email) return null;

  const claimed = new Set(
    agentAccountRepo
      .getAll()
      .map((other) => other.keychainService)
      .filter((service): service is string => service !== null)
  );

  for (const service of await listKeychainServices()) {
    if (claimed.has(service)) continue;

    const credentials = await readKeychainCredentials(service);
    if (!credentials) continue;

    try {
      const profile = await fetchAccountProfile(credentials.accessToken);
      if (profile?.email === email) return bind(account, service);
    } catch {
      /* an expired or revoked entry can't identify itself */
    }
  }

  return null;
}

// Resolves once and is persisted, so the keychain is only enumerated for an
// account whose credential entry has never been located.
export async function resolveKeychainService(account: AgentAccount): Promise<string | null> {
  if (account.keychainService) return account.keychainService;
  if (readCredentialsFile(account.configDir)) return null;
  if (account.configDir === defaultConfigDir()) return bind(account, DEFAULT_KEYCHAIN_SERVICE);

  const attemptedAt = lastAttempt.get(account.id);
  if (attemptedAt !== undefined && Date.now() - attemptedAt < RETRY_AFTER_MS) return null;
  lastAttempt.set(account.id, Date.now());

  return discover(account);
}
