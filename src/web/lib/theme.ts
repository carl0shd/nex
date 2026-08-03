export type ThemeName = 'dark' | 'light';

/**
 * The active theme, read from `data-theme` on <html> (set in `index.html`).
 * Only needed by third-party renderers that can't consume CSS variables —
 * everything else themes itself through the `--nex-*` tokens in `globals.css`.
 */
export function getTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}
