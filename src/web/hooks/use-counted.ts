import { useEffect, useRef, useState } from "react";

const MIN_COUNT_MS = 400;
const MAX_COUNT_MS = 2000;
const TICK_MS = 33;

export function useCounted(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const lastChange = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const gap = lastChange.current ? start - lastChange.current : MIN_COUNT_MS;
    lastChange.current = start;
    const duration = Math.min(MAX_COUNT_MS, Math.max(MIN_COUNT_MS, gap));
    const from = Math.min(shownRef.current, target);
    const timer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      shownRef.current = Math.round(from + (target - from) * progress);
      setShown(shownRef.current);
      if (progress >= 1) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [target]);

  return Math.min(shown, target);
}
