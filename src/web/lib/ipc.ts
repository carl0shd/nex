/** Strips Electron's "Error invoking remote method '...'" wrapper from IPC errors. */
export function cleanIpcError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
}
