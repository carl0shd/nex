import { useEffect, useState } from "react";
import type { ClaudeSessionInfo } from "@native/agents/claude-sessions";

const found = new Map<string, ClaudeSessionInfo[]>();

export function useClaudeSessions(
  projectId: string | undefined,
): readonly ClaudeSessionInfo[] | undefined {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void window.api
      .listClaudeSessions(projectId)
      .then((sessions) => {
        found.set(projectId, sessions ?? []);
        if (!cancelled) setVersion((version) => version + 1);
      })
      .catch(() => {
        found.set(projectId, found.get(projectId) ?? []);
        if (!cancelled) setVersion((version) => version + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  return projectId ? found.get(projectId) : [];
}
