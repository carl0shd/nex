import { create } from 'zustand';

export interface WorktreeEntry {
  path: string;
  type: 'file' | 'folder';
}

interface WorktreeFilesStore {
  cache: Record<string, WorktreeEntry[]>;
  inflight: Record<string, Promise<WorktreeEntry[]>>;
  load: (worktreePath: string) => Promise<WorktreeEntry[]>;
  refresh: (worktreePath: string) => Promise<WorktreeEntry[]>;
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

export const useWorktreeFilesStore = create<WorktreeFilesStore>((set, get) => ({
  cache: {},
  inflight: {},
  load: async (worktreePath) => {
    const cached = get().cache[worktreePath];
    if (cached) return cached;
    const pending = get().inflight[worktreePath];
    if (pending) return pending;
    const promise = window.api
      .listWorktreeFiles(worktreePath)
      .then((entries) => {
        set((s) => ({
          cache: { ...s.cache, [worktreePath]: entries },
          inflight: omit(s.inflight, worktreePath)
        }));
        return entries;
      })
      .catch(() => {
        set((s) => ({ inflight: omit(s.inflight, worktreePath) }));
        return [];
      });
    set((s) => ({ inflight: { ...s.inflight, [worktreePath]: promise } }));
    return promise;
  },
  refresh: async (worktreePath) => {
    const entries = await window.api.listWorktreeFiles(worktreePath);
    set((s) => ({ cache: { ...s.cache, [worktreePath]: entries } }));
    return entries;
  }
}));
