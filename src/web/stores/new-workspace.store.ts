import { create } from "zustand";

interface NewWorkspaceStore {
  creating: boolean;
  show: () => void;
  hide: () => void;
}

export const useNewWorkspaceStore = create<NewWorkspaceStore>((set) => ({
  creating: false,
  show: () => set({ creating: true }),
  hide: () => set({ creating: false }),
}));
