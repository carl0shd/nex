import { create } from "zustand";

interface CloseTaskStore {
  sessionId: string | null;
  show: (sessionId: string) => void;
  hide: () => void;
}

export const useCloseTaskStore = create<CloseTaskStore>((set) => ({
  sessionId: null,
  show: (sessionId) => set({ sessionId }),
  hide: () => set({ sessionId: null }),
}));
