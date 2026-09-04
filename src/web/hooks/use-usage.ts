import { useEffect } from 'react';
import { useUsageStore } from '@/stores/usage.store';

// Transcript writes push USAGE_CHANGED; plan limits only move server-side, and
// polling them faster than this trips the endpoint's rate limit.
const LIMITS_POLL_MS = 5 * 60_000;

export function useUsage(): void {
  const loadSummary = useUsageStore((s) => s.loadSummary);
  const invalidate = useUsageStore((s) => s.invalidate);

  useEffect(() => {
    void loadSummary();
    void window.api.usage.watchStart();

    const unsubscribe = window.api.usage.onChanged(() => {
      invalidate();
      void loadSummary();
    });
    const interval = window.setInterval(() => void loadSummary(), LIMITS_POLL_MS);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      void window.api.usage.watchStop();
    };
  }, [loadSummary, invalidate]);
}
