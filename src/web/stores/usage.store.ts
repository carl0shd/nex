import { create } from 'zustand';
import type { UsageGranularity, UsageStats, UsageSummary } from '@native/usage/types';

const GRANULARITIES: UsageGranularity[] = ['day', 'week', 'month'];

type StatsByGranularity = Partial<Record<UsageGranularity, UsageStats>>;

interface UsageStore {
  summary: UsageSummary | null;
  stats: StatsByGranularity;
  summaryLoading: boolean;
  statsLoading: boolean;
  statsVersion: number;

  loadSummary: () => Promise<void>;
  loadStats: () => Promise<void>;
  invalidate: () => void;
  refresh: () => Promise<void>;
}

export const useUsageStore = create<UsageStore>((set, get) => ({
  summary: null,
  stats: {},
  summaryLoading: false,
  statsLoading: false,
  statsVersion: 0,

  loadSummary: async () => {
    set({ summaryLoading: true });
    try {
      set({ summary: await window.api.usage.getSummary() });
    } finally {
      set({ summaryLoading: false });
    }
  },

  // Every granularity is fetched together and swapped in atomically, so
  // switching tabs never waits on IPC and never renders a half-empty panel.
  loadStats: async () => {
    set({ statsLoading: true });
    try {
      const loaded = await Promise.all(
        GRANULARITIES.map((granularity) => window.api.usage.getStats(granularity))
      );
      const stats: StatsByGranularity = {};
      GRANULARITIES.forEach((granularity, index) => {
        stats[granularity] = loaded[index];
      });
      set({ stats });
    } finally {
      set({ statsLoading: false });
    }
  },

  invalidate: () => set({ statsVersion: get().statsVersion + 1 }),

  refresh: async () => {
    await window.api.usage.refresh();
    get().invalidate();
    await get().loadSummary();
  }
}));
