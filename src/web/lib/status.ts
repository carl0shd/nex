import type { TerminalStatus } from '@native/db/types';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

export type Status = 'running' | 'idle' | 'done' | 'error';

export const statusToVariant: Record<Status, BadgeVariant> = {
  running: 'success',
  idle: 'default',
  done: 'default',
  error: 'destructive'
};

// A session with nothing that reports a status has none itself. Among the ones
// that do, waiting on a permission prompt outranks still working.
export function aggregateTerminalStatus(
  terminals: { status: TerminalStatus | null }[]
): TerminalStatus | null {
  let status: TerminalStatus | null = null;
  for (const terminal of terminals) {
    if (terminal.status === null) continue;
    if (terminal.status === 'waiting') return 'waiting';
    if (terminal.status === 'running') status = 'running';
    else status ??= 'idle';
  }
  return status;
}
