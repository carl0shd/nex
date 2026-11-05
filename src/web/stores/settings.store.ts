import { create } from "zustand";
import { applyTheme, type ThemeName, type ThemePreference } from "@/lib/theme";

interface AppPrefs {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  onboarded: boolean;
  addAgentHint: boolean;
}

const SETTINGS_KEY = "app-prefs";

const DEFAULT_PREFS: AppPrefs = {
  theme: "dark",
  sidebarCollapsed: false,
  onboarded: false,
  addAgentHint: false,
};

interface SettingsStore extends AppPrefs {
  resolvedTheme: ThemeName;
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  finishOnboarding: () => void;
  setAddAgentHint: (shown: boolean) => void;
  syncSystemTheme: () => void;
}

const save = ({ theme, sidebarCollapsed, onboarded, addAgentHint }: AppPrefs) =>
  window.api.setSetting(SETTINGS_KEY, { theme, sidebarCollapsed, onboarded, addAgentHint });

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_PREFS,
  resolvedTheme: "dark",
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const stored = await window.api.getSetting<AppPrefs>(SETTINGS_KEY, DEFAULT_PREFS);
    const prefs: AppPrefs = {
      theme: stored.theme ?? DEFAULT_PREFS.theme,
      sidebarCollapsed: stored.sidebarCollapsed ?? DEFAULT_PREFS.sidebarCollapsed,
      onboarded: stored.onboarded ?? DEFAULT_PREFS.onboarded,
      addAgentHint: stored.addAgentHint ?? DEFAULT_PREFS.addAgentHint,
    };
    set({ ...prefs, resolvedTheme: applyTheme(prefs.theme), loaded: true });
  },

  setTheme: (theme) => {
    set({ theme, resolvedTheme: applyTheme(theme) });
    save(get());
  },

  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
    save(get());
  },

  finishOnboarding: () => {
    set({ onboarded: true });
    save(get());
  },

  setAddAgentHint: (shown) => {
    if (get().addAgentHint === shown) return;
    set({ addAgentHint: shown });
    save(get());
  },

  syncSystemTheme: () => {
    if (get().theme !== "system") return;
    set({ resolvedTheme: applyTheme("system") });
  },
}));
