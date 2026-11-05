import { create } from "zustand";

interface RemoveWorkspaceStore {
  workspaceId: string | null;
  show: (workspaceId: string) => void;
  hide: () => void;
}

export const useRemoveWorkspaceStore = create<RemoveWorkspaceStore>((set) => ({
  workspaceId: null,
  show: (workspaceId) => set({ workspaceId }),
  hide: () => set({ workspaceId: null }),
}));
