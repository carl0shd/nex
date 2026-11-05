import { useCallback, useEffect, useState } from "react";
import type { UsageSummary } from "@native/usage/types";

const RELOAD_MS = 60_000;

export function useUsageSummary() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  const reload = useCallback(
    () =>
      void window.api.usage
        .getSummary()
        .then(setSummary)
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    reload();
    void window.api.usage.watchStart();
    const unsubscribe = window.api.usage.onChanged(reload);
    const timer = setInterval(reload, RELOAD_MS);
    return () => {
      unsubscribe();
      clearInterval(timer);
      void window.api.usage.watchStop();
    };
  }, [reload]);

  const refresh = useCallback(async () => {
    await window.api.usage.refresh();
    reload();
  }, [reload]);

  return { summary, reload, refresh };
}
