const IPC_PREFIX = /^Error invoking remote method '[^']+': (?:\w*Error: )?/;

export function ipcErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(IPC_PREFIX, "").trim() || "Something went wrong";
}
