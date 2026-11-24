import { useCallback, useEffect, useState } from "react";
import type { UsageSummary } from "@native/usage/types";

const RELOAD_MS = 60_000;

export function useUsageSummary({ watch = true }: { watch?: boolean } = {}) {
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
    if (watch) void window.api.usage.watchStart();
    const unsubscribe = window.api.usage.onChanged(reload);
    const timer = setInterval(reload, RELOAD_MS);
    return () => {
      unsubscribe();
      clearInterval(timer);
      if (watch) void window.api.usage.watchStop();
    };
  }, [reload, watch]);

  const refresh = useCallback(async () => {
    await window.api.usage.refresh();
    reload();
  }, [reload]);

  return { summary, reload, refresh };
}
