import { create } from "zustand";

interface UsagePanelStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useUsagePanelStore = create<UsagePanelStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));
