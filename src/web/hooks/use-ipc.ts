interface UseIPC {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
  send: (channel: string, ...args: unknown[]) => void;
}

export function useIPC(): UseIPC {
  const invoke = <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return window.electron.ipcRenderer.invoke(channel, ...args) as Promise<T>;
  };

  const send = (channel: string, ...args: unknown[]): void => {
    window.electron.ipcRenderer.send(channel, ...args);
  };

  return { invoke, send };
}
