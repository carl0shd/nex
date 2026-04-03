import { create } from 'zustand';
import type { Worktree, CreateWorktreeInput, UpdateWorktreeInput } from '@native/db/types';

interface WorktreeStore {
  worktrees: Worktree[];
  loadWorktrees: () => Promise<void>;
  createWorktree: (input: CreateWorktreeInput) => Promise<Worktree>;
  updateWorktree: (id: string, input: UpdateWorktreeInput) => Promise<Worktree>;
  deleteWorktree: (id: string) => Promise<void>;
  getByProject: (projectId: string) => Worktree[];
}

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  worktrees: [],

  loadWorktrees: async () => {
    const worktrees = await window.api.getWorktrees();
    set({ worktrees });
  },

  createWorktree: async (input) => {
    const worktree = await window.api.createWorktree(input);
    set((s) => ({ worktrees: [...s.worktrees, worktree] }));
    return worktree;
  },

  updateWorktree: async (id, input) => {
    const worktree = await window.api.updateWorktree(id, input);
    set((s) => ({
      worktrees: s.worktrees.map((w) => (w.id === id ? worktree : w))
    }));
    return worktree;
  },

  deleteWorktree: async (id) => {
    await window.api.deleteWorktree(id);
    set((s) => ({ worktrees: s.worktrees.filter((w) => w.id !== id) }));
  },

  getByProject: (projectId) => {
    return get().worktrees.filter((w) => w.projectId === projectId);
  }
}));
