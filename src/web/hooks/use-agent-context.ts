import { useEffect, useState } from "react";
import type { ContextUsage } from "@native/agents/context-usage";

const known = new Map<string, ContextUsage>();

export function useAgentContext(
  sessionId: string,
  enabled: boolean,
  refreshKey: string,
): ContextUsage | null {
  const [usage, setUsage] = useState<ContextUsage | null>(() => known.get(sessionId) ?? null);

  useEffect(() => {
    if (known.has(sessionId)) return;
    let cancelled = false;
    void window.api.lastAgentContext(sessionId).then((last) => {
      if (!last || cancelled || known.has(sessionId)) return;
      known.set(sessionId, last);
      setUsage(last);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void window.api
      .agentContext(sessionId)
      .then((next) => {
        if (!next || cancelled) return;
        known.set(sessionId, next);
        setUsage(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId, enabled, refreshKey]);

  return usage;
}
