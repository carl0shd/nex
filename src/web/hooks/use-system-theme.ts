import { useEffect } from 'react';
import { watchSystemTheme } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settings.store';

export function useSystemTheme(): void {
  const syncSystemTheme = useSettingsStore((s) => s.syncSystemTheme);

  useEffect(() => watchSystemTheme(syncSystemTheme), [syncSystemTheme]);
}
