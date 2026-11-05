import { create } from "zustand";

interface NewTaskStore {
  open: boolean;
  projectId: string | null;
  show: (projectId?: string) => void;
  hide: () => void;
}

export const useNewTaskStore = create<NewTaskStore>((set) => ({
  open: false,
  projectId: null,
  show: (projectId) => set({ open: true, projectId: projectId ?? null }),
  hide: () => set({ open: false, projectId: null }),
}));
