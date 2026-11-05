import { useEffect, useState } from "react";

const TICK_MS = 16;
const SMOOTHING_TICKS = 6;

export function useRevealedLength(text: string): number {
  const [revealed, setRevealed] = useState(0);
  const length = text.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setRevealed((current) => {
        if (current >= length) {
          clearInterval(timer);
          return length;
        }
        return Math.min(length, current + Math.ceil((length - current) / SMOOTHING_TICKS));
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [length]);

  return Math.min(revealed, length);
}
