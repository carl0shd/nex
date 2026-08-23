import type { TerminalStatus } from '@native/db/types';
import { useTerminalStore } from '@/stores/terminal.store';
import { aggregateTerminalStatus } from '@/lib/status';

// Selecting a string rather than the terminal list keeps a row from re-rendering
// when some other session's status moves.
export function useSessionStatus(sessionId: string): TerminalStatus {
  return useTerminalStore((s) =>
    aggregateTerminalStatus(s.terminals.filter((t) => t.sessionId === sessionId))
  );
}

export function useSessionsStatus(sessionIds: string[]): TerminalStatus {
  return useTerminalStore((s) =>
    aggregateTerminalStatus(s.terminals.filter((t) => sessionIds.includes(t.sessionId)))
  );
}
