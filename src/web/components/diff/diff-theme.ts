import type { DiffsThemeNames, ThemeTypes } from '@pierre/diffs/react';
import { getTheme } from '@/lib/theme';

export interface DiffTheme {
  theme: Record<'dark' | 'light', DiffsThemeNames>;
  themeType: ThemeTypes;
}

// Only syntax tokens come from here; the diff's own colours are driven by the
// `--diffs-*-override` variables in globals.css.
export function resolveDiffTheme(): DiffTheme {
  return {
    theme: { dark: 'ayu-dark', light: 'ayu-light' },
    themeType: getTheme()
  };
}
