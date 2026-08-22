export type ThemeName = 'dark' | 'light';

// Only needed by third-party renderers that can't consume CSS variables;
// everything else themes itself through the `--nex-*` tokens.
export function getTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Swaps the whole palette: `globals.css` overrides `--nex-*` per theme. */
export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}
