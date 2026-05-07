import * as agentRepo from '@native/db/repositories/agent.repo';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import * as sessionRepo from '@native/db/repositories/session.repo';
import * as terminalRepo from '@native/db/repositories/terminal.repo';
import { agentDisplayName } from '@native/agents/agent-display';
import type { Terminal, TerminalType } from '@native/db/types';

export interface CreateForSessionInput {
  sessionId: string;
  type: TerminalType;
  isPrimary?: boolean;
  name?: string;
  runCommand?: string;
}

export function createTerminalForSession(input: CreateForSessionInput): Terminal {
  const session = sessionRepo.getById(input.sessionId);
  if (!session) throw new Error(`Session not found: ${input.sessionId}`);

  const existing = terminalRepo.getBySession(input.sessionId);
  const isPrimary = input.isPrimary ?? existing.length === 0;

  if (input.type === 'shell') {
    let name = input.name;
    if (!name) {
      const shellCount = existing.filter((t) => t.type === 'shell').length;
      name = shellCount === 0 ? 'Shell' : `Shell ${shellCount + 1}`;
    }
    return terminalRepo.create({
      sessionId: session.id,
      name,
      command: null,
      args: [],
      cwd: session.worktreePath,
      env: {},
      isPrimary,
      type: 'shell',
      runCommand: input.runCommand ?? null
    });
  }

  const agent = session.agentId ? agentRepo.getById(session.agentId) : null;
  if (!agent) throw new Error('Session has no agent assigned');
  const account = session.accountId ? agentAccountRepo.getById(session.accountId) : null;

  const env: Record<string, string> = {};
  if (account && agent.configEnvVar) env[agent.configEnvVar] = account.configDir;

  return terminalRepo.create({
    sessionId: session.id,
    name: agentDisplayName(agent.slug, agent.name),
    command: agent.command,
    args: agent.args,
    cwd: session.worktreePath,
    env,
    isPrimary,
    type: 'agent'
  });
}
