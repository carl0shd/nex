import { create } from "zustand";
import type { Preferences } from "@native/db/types";
import { DEFAULT_PREFERENCES, mergePreferences } from "@/lib/preferences";

const PREFERENCES_KEY = "preferences";

interface PreferencesStore {
  prefs: Preferences;
  loaded: boolean;
  load: () => Promise<void>;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  prefs: DEFAULT_PREFERENCES,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const stored = await window.api.getSetting<Partial<Preferences> | null>(PREFERENCES_KEY, null);
    set({ prefs: mergePreferences(stored), loaded: true });
  },

  setPref: (key, value) => {
    const prefs = { ...get().prefs, [key]: value };
    set({ prefs });
    void window.api.setSetting(PREFERENCES_KEY, prefs);
  },
}));
