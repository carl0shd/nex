import { useCallback, useEffect } from "react";
import { useUsageSummaryStore } from "@/stores/usage-summary.store";

const RELOAD_MS = 60_000;

export function useUsageSummary({ watch = true }: { watch?: boolean } = {}) {
  const summary = useUsageSummaryStore((s) => s.summary);
  const setSummary = useUsageSummaryStore((s) => s.setSummary);

  const reload = useCallback(
    () =>
      void window.api.usage
        .getSummary()
        .then(setSummary)
        .catch(() => {}),
    [setSummary],
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

export const useTaskCost = (sessionId: string): number | null =>
  useUsageSummaryStore(
    (s) => s.summary?.sessions.find((item) => item.sessionId === sessionId)?.totals.costUsd ?? null,
  );
