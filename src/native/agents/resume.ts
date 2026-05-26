import type { Agent } from '@native/db/types';

export interface SessionTrackerHandle {
  stop(): void;
}

export interface AgentResumeAdapter {
  slug: string;
  sessionExists(cwd: string, sessionId: string): boolean;
  deleteSession(cwd: string, sessionId: string): void;
  listSessionIds(cwd: string): string[];
  buildResumeArgs(agent: Agent, sessionId: string): string[];
  watchForNewSession(cwd: string, onDiscovered: (sessionId: string) => void): SessionTrackerHandle;
}

import { claudeAdapter } from '@native/agents/adapters/claude';

const adapters: AgentResumeAdapter[] = [claudeAdapter];

export function getAgentResumeAdapter(slug: string | null | undefined): AgentResumeAdapter | null {
  if (!slug) return null;
  return adapters.find((a) => a.slug === slug) ?? null;
}
