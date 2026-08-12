/**
 * Text an agent paints into its status area to announce what it is doing.
 *
 * Matching happens against a burst of freshly emitted output, never the whole
 * scrollback, so a marker only counts while the agent keeps repainting it.
 *
 * There is deliberately no marker for the resting state. An agent paints its
 * hint line both while working and while idle, so the two can only be told
 * apart by the spinner above it — idle is therefore inferred from `running`
 * going quiet, not from any text of its own.
 */
export interface AgentStatusMarkers {
  running: RegExp;
  waiting: RegExp;
}

const STATUS_MARKERS: Record<string, AgentStatusMarkers> = {
  'claude-code': {
    running: /esc to interrupt/i,
    waiting: /Do you want to|Would you like to proceed|❯\s*\d+\.\s/
  }
};

export function getStatusMarkers(slug: string | null | undefined): AgentStatusMarkers | null {
  if (!slug) return null;
  return STATUS_MARKERS[slug] ?? null;
}
