import { create } from 'zustand';

interface LinkStore {
  pendingUrl: string | null;
  requestOpen: (url: string) => void;
  dismiss: () => void;
}

export const useLinkStore = create<LinkStore>((set) => ({
  pendingUrl: null,
  requestOpen: (url) => set({ pendingUrl: url }),
  dismiss: () => set({ pendingUrl: null })
}));
