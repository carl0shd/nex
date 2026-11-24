import { create } from "zustand";

interface OnboardingStore {
  firstTaskStarted: boolean;
  markFirstTaskStarted: (started: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  firstTaskStarted: false,
  markFirstTaskStarted: (started) => set({ firstTaskStarted: started }),
}));
