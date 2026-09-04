export type ThemeName = 'dark' | 'light';
export type ThemePreference = ThemeName | 'system';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

// Only needed by third-party renderers that can't consume CSS variables;
// everything else themes itself through the `--nex-*` tokens.
export function getTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Swaps the whole palette: `globals.css` overrides `--nex-*` per theme. */
export function applyTheme(preference: ThemePreference): ThemeName {
  const theme = resolveTheme(preference);
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
  return theme;
}

export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
