import { useEffect, useState } from "react";
import type { ClaudeSessionInfo } from "@native/agents/claude-sessions";

const NONE: readonly ClaudeSessionInfo[] = [];

export function useClaudeSessions(projectId: string | undefined): readonly ClaudeSessionInfo[] {
  const [found, setFound] = useState<{ projectId: string; sessions: ClaudeSessionInfo[] }>();
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void window.api
      .listClaudeSessions(projectId)
      .then((sessions) => {
        if (!cancelled) setFound({ projectId, sessions });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  return found && found.projectId === projectId ? found.sessions : NONE;
}
