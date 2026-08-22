// There is no marker for rest: resting states print no hint at all, so rest is
// read as a status line repainted without `running` on it.
export interface AgentStatusMarkers {
  statusLine: RegExp;
  running: RegExp;
  waiting: RegExp;
}

// Keep these anchorless: a pattern that spans the status line instead of
// marking it costs ~160x, and they run over every byte an agent prints.
const STATUS_MARKERS: Record<string, AgentStatusMarkers> = {
  'claude-code': {
    statusLine: /mode on|\? for shortcuts/,
    running: /esc to interrupt/i,
    waiting: /Do you want to|Would you like to proceed|❯\s*\d+\.\s/
  }
};

export function getStatusMarkers(slug: string | null | undefined): AgentStatusMarkers | null {
  if (!slug) return null;
  return STATUS_MARKERS[slug] ?? null;
}
