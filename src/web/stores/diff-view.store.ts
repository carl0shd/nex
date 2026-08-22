import { create } from 'zustand';

export type DiffStyle = 'split' | 'unified';

export interface DiffViewPrefs {
  diffStyle: DiffStyle;
  wordDiff: boolean;
  ignoreWhitespace: boolean;
  treeVisible: boolean;
}

const SETTINGS_KEY = 'diff-view-prefs';

const DEFAULT_PREFS: DiffViewPrefs = {
  diffStyle: 'split',
  wordDiff: true,
  ignoreWhitespace: false,
  treeVisible: true
};

interface DiffViewStore {
  prefs: DiffViewPrefs;
  loaded: boolean;
  collapsed: Record<string, string[]>;

  load: () => Promise<void>;
  setPref: <K extends keyof DiffViewPrefs>(key: K, value: DiffViewPrefs[K]) => void;
  toggleCollapsed: (sessionId: string, name: string) => void;
  clearSession: (sessionId: string) => void;
}

export const useDiffViewStore = create<DiffViewStore>((set, get) => ({
  prefs: DEFAULT_PREFS,
  loaded: false,
  collapsed: {},

  load: async () => {
    if (get().loaded) return;
    const stored = await window.api.getSetting<DiffViewPrefs>(SETTINGS_KEY, DEFAULT_PREFS);
    set({ prefs: { ...DEFAULT_PREFS, ...stored }, loaded: true });
  },

  setPref: (key, value) => {
    const prefs = { ...get().prefs, [key]: value };
    set({ prefs });
    window.api.setSetting(SETTINGS_KEY, prefs);
  },

  toggleCollapsed: (sessionId, name) =>
    set((s) => {
      const current = s.collapsed[sessionId] ?? [];
      const next = current.includes(name) ? current.filter((x) => x !== name) : [...current, name];
      return { collapsed: { ...s.collapsed, [sessionId]: next } };
    }),

  clearSession: (sessionId) =>
    set((s) => {
      const collapsed = { ...s.collapsed };
      delete collapsed[sessionId];
      return { collapsed };
    })
}));
