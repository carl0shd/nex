import { create } from 'zustand';
import { applyTheme, type ThemeName, type ThemePreference } from '@/lib/theme';

interface AppPrefs {
  theme: ThemePreference;
}

const SETTINGS_KEY = 'app-prefs';

const DEFAULT_PREFS: AppPrefs = {
  theme: 'dark'
};

interface SettingsStore extends AppPrefs {
  resolvedTheme: ThemeName;
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemePreference) => void;
  syncSystemTheme: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_PREFS,
  resolvedTheme: 'dark',
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const stored = await window.api.getSetting<AppPrefs>(SETTINGS_KEY, DEFAULT_PREFS);
    const prefs = { ...DEFAULT_PREFS, ...stored };
    set({ ...prefs, resolvedTheme: applyTheme(prefs.theme), loaded: true });
  },

  setTheme: (theme) => {
    set({ theme, resolvedTheme: applyTheme(theme) });
    window.api.setSetting(SETTINGS_KEY, { theme });
  },

  syncSystemTheme: () => {
    if (get().theme !== 'system') return;
    set({ resolvedTheme: applyTheme('system') });
  }
}));
