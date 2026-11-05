import { useEffect, useState } from "react";
import type { TranscriptCursor } from "@native/agents/transcript";

const loaded = new Map<string, { entries: unknown[]; cursor: TranscriptCursor | null }>();

export function useTranscript(terminalId: string | undefined): unknown[] {
  const [entries, setEntries] = useState<unknown[]>(
    () => (terminalId && loaded.get(terminalId)?.entries) || [],
  );

  useEffect(() => {
    if (!terminalId) return;
    let cancelled = false;
    let cursor = loaded.get(terminalId)?.cursor ?? null;
    let loading = false;
    let again = false;

    const load = async () => {
      if (loading) {
        again = true;
        return;
      }
      loading = true;
      try {
        const chunk = await window.api.readTranscript(terminalId, cursor);
        if (cancelled) return;
        cursor = chunk.path ? { path: chunk.path, offset: chunk.offset } : null;
        const previous = loaded.get(terminalId)?.entries ?? [];
        const next = chunk.reset ? chunk.entries : [...previous, ...chunk.entries];
        loaded.set(terminalId, { entries: next, cursor });
        if (chunk.reset || chunk.entries.length) setEntries(next);
      } finally {
        loading = false;
        if (again && !cancelled) {
          again = false;
          void load();
        }
      }
    };

    void load();
    const unwatch = window.api.watchTranscript(terminalId, () => void load());
    return () => {
      cancelled = true;
      unwatch();
    };
  }, [terminalId]);

  return entries;
}
