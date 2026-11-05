import * as settingsRepo from "@native/db/repositories/settings.repo";

const key = (sessionId: string) => `agent-history:${sessionId}`;

export function pastClaudeSessions(sessionId: string): string[] {
  return settingsRepo.get<string[]>(key(sessionId), []);
}

export function rememberPastClaudeSession(sessionId: string, claudeSessionId: string): void {
  const past = pastClaudeSessions(sessionId);
  if (!past.includes(claudeSessionId)) settingsRepo.set(key(sessionId), [...past, claudeSessionId]);
}
