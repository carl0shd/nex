import { create } from 'zustand';
import { applyTheme, type ThemeName } from '@/lib/theme';

interface AppPrefs {
  theme: ThemeName;
}

const SETTINGS_KEY = 'app-prefs';

const DEFAULT_PREFS: AppPrefs = {
  theme: 'dark'
};

interface SettingsStore extends AppPrefs {
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemeName) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_PREFS,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const stored = await window.api.getSetting<AppPrefs>(SETTINGS_KEY, DEFAULT_PREFS);
    const prefs = { ...DEFAULT_PREFS, ...stored };
    applyTheme(prefs.theme);
    set({ ...prefs, loaded: true });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    window.api.setSetting(SETTINGS_KEY, { theme });
  }
}));
