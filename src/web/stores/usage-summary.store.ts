import { create } from "zustand";
import type { UsageSummary } from "@native/usage/types";

interface UsageSummaryStore {
  summary: UsageSummary | null;
  setSummary: (summary: UsageSummary) => void;
}

export const useUsageSummaryStore = create<UsageSummaryStore>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
}));
