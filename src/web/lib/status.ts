import type { TerminalStatus } from '@native/db/types';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

export type Status = 'running' | 'idle' | 'done' | 'error';

export const statusToVariant: Record<Status, BadgeVariant> = {
  running: 'success',
  idle: 'default',
  done: 'default',
  error: 'destructive'
};

/**
 * A session reports the state of the tab that most needs the user: one waiting
 * on a permission prompt outranks one that is still working on its own.
 */
export function aggregateTerminalStatus(terminals: { status: TerminalStatus }[]): TerminalStatus {
  let running = false;
  for (const terminal of terminals) {
    if (terminal.status === 'waiting') return 'waiting';
    if (terminal.status === 'running') running = true;
  }
  return running ? 'running' : 'idle';
}
