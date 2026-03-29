export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

export type Status = 'running' | 'idle' | 'done' | 'error';

export const statusToVariant: Record<Status, BadgeVariant> = {
  running: 'success',
  idle: 'default',
  done: 'default',
  error: 'destructive'
};
