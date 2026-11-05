import { create } from "zustand";

interface OnboardingStore {
  previewing: boolean;
  firstTaskStarted: boolean;
  preview: () => void;
  close: () => void;
  markFirstTaskStarted: (started: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  previewing: false,
  firstTaskStarted: false,
  preview: () => set({ previewing: true }),
  close: () => set({ previewing: false }),
  markFirstTaskStarted: (started) => set({ firstTaskStarted: started }),
}));
