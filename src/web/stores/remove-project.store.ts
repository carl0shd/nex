import { create } from "zustand";

interface RemoveProjectStore {
  projectId: string | null;
  show: (projectId: string) => void;
  hide: () => void;
}

export const useRemoveProjectStore = create<RemoveProjectStore>((set) => ({
  projectId: null,
  show: (projectId) => set({ projectId }),
  hide: () => set({ projectId: null }),
}));
