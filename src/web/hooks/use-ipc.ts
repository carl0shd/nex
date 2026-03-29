export function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return window.electron.ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

export function send(channel: string, ...args: unknown[]): void {
  window.electron.ipcRenderer.send(channel, ...args);
}
