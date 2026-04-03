import { useEffect, useState } from 'react';

export function useFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    return window.api.onFullscreenChange(setIsFullscreen);
  }, []);

  return isFullscreen;
}
