export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'claude-code': 'Claude Code'
};

export function agentDisplayName(slug: string, fallback: string): string {
  return AGENT_DISPLAY_NAMES[slug] ?? fallback;
}
