import { useEffect, useState, type RefObject } from 'react';

interface Options {
  rootMargin?: string;
  unmountDelayMs?: number;
}

export function useNearViewport(
  ref: RefObject<HTMLElement | null>,
  options: Options = {}
): boolean {
  const { rootMargin = '0px 600px 0px 600px', unmountDelayMs = 500 } = options;
  const [near, setNear] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let unmountTimer: number | null = null;

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
      { rootMargin, threshold: 0 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (unmountTimer !== null) clearTimeout(unmountTimer);
    };
  }, [ref, rootMargin, unmountDelayMs]);

  return near;
}
