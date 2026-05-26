import { useEffect, useState } from 'react';
import { findScrollableAncestor } from '@/lib/scroll';

interface Options {
  rootMargin?: string;
  unmountDelayMs?: number;
}

export function useNearViewport(
  options: Options = {}
): [boolean, (node: HTMLElement | null) => void] {
  const { rootMargin = '0px 628px 0px 628px', unmountDelayMs = 300 } = options;
  const [near, setNear] = useState(true);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!node) return;

    let unmountTimer: number | null = null;
    const root = findScrollableAncestor(node);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (unmountTimer !== null) {
            clearTimeout(unmountTimer);
            unmountTimer = null;
          }
          setNear(true);
        } else {
          if (unmountTimer !== null) clearTimeout(unmountTimer);
          unmountTimer = window.setTimeout(() => {
            unmountTimer = null;
            setNear(false);
          }, unmountDelayMs);
        }
      },
      { root, rootMargin, threshold: 0 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (unmountTimer !== null) clearTimeout(unmountTimer);
    };
  }, [node, rootMargin, unmountDelayMs]);

  return [near, setNode];
}
