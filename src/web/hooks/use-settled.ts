import { useEffect, useState } from "react";

export function useSettled(flag: boolean, delayMs: number): boolean {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!flag) return;
    const timer = setTimeout(() => setSettled(true), delayMs);
    return () => {
      clearTimeout(timer);
      setSettled(false);
    };
  }, [flag, delayMs]);
  return flag && settled;
}
