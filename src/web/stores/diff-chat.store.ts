import { create } from 'zustand';

export type SnippetSide = 'additions' | 'deletions';

export interface DiffSnippet {
  /** `${file}:${side}:${start}-${end}` — re-adding the same range is a no-op. */
  id: string;
  file: string;
  side: SnippetSide;
  start: number;
  end: number;
  code: string;
}

interface DiffChatStore {
  bySession: Record<string, DiffSnippet[]>;
  add: (sessionId: string, snippet: DiffSnippet) => void;
  remove: (sessionId: string, id: string) => void;
  clear: (sessionId: string) => void;
}

export function snippetId(file: string, side: SnippetSide, start: number, end: number): string {
  return `${file}:${side}:${start}-${end}`;
}

export const useDiffChatStore = create<DiffChatStore>((set) => ({
  bySession: {},

  add: (sessionId, snippet) =>
    set((s) => {
      const current = s.bySession[sessionId] ?? [];
      if (current.some((x) => x.id === snippet.id)) return s;
      return { bySession: { ...s.bySession, [sessionId]: [...current, snippet] } };
    }),

  remove: (sessionId, id) =>
    set((s) => ({
      bySession: {
        ...s.bySession,
        [sessionId]: (s.bySession[sessionId] ?? []).filter((x) => x.id !== id)
      }
    })),

  clear: (sessionId) =>
    set((s) => {
      if (!(sessionId in s.bySession)) return s;
      const bySession = { ...s.bySession };
      delete bySession[sessionId];
      return { bySession };
    })
}));
