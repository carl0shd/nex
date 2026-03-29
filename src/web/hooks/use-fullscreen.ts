import { useEffect, useState } from 'react';

export function useFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const off = window.electron.ipcRenderer.on('window:fullscreen-change', (_, value: boolean) => {
      setIsFullscreen(value);
    });
    return (): void => {
      off();
    };
  }, []);

  return isFullscreen;
}
