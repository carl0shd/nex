import { useEffect, useState } from "react";
import { IDE_APPS, TERMINAL_APPS } from "@/components/settings/settings-values";
import { usePreferencesStore } from "@/stores/preferences.store";

interface InstalledApps {
  editors: string[];
  terminals: string[];
}

let installed: InstalledApps | null = null;
let loading: Promise<InstalledApps> | null = null;

export function loadInstalledApps(): Promise<InstalledApps> {
  loading ??= Promise.all([
    window.api.installedApps(IDE_APPS),
    window.api.installedApps(TERMINAL_APPS),
  ]).then(([editors, terminals]) => {
    installed = { editors: editors ?? [], terminals: terminals ?? [] };
    return installed;
  });
  return loading;
}

export const pickApp = (preferred: string, apps: readonly string[]): string | null =>
  apps.includes(preferred) ? preferred : (apps[0] ?? null);

export function useOpenWithApps(): { editor: string | null; terminal: string | null } {
  const ide = usePreferencesStore((s) => s.prefs.ide);
  const terminalApp = usePreferencesStore((s) => s.prefs.terminalApp);
  const [apps, setApps] = useState(installed);
  useEffect(() => {
    if (apps) return;
    let cancelled = false;
    void loadInstalledApps().then((found) => !cancelled && setApps(found));
    return () => {
      cancelled = true;
    };
  }, [apps]);
  if (!apps) return { editor: null, terminal: null };
  return { editor: pickApp(ide, apps.editors), terminal: pickApp(terminalApp, apps.terminals) };
}
