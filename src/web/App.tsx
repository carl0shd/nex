import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { useEffect } from "react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import ErrorBoundary from "@/components/error-boundary";
import AppShell from "@/components/layout/app-shell";
import Settings from "@/routes/settings";
import Home from "@/routes/home";
import DesignSystem from "@/routes/design-system";
import { useSystemTheme } from "@/hooks/use-system-theme";
import { usePermissionStore } from "@/stores/permission.store";
import { useApplyPreferences } from "@/hooks/use-apply-preferences";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const routes: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: "settings", element: <Settings /> },
];
if (import.meta.env.DEV) routes.push({ path: "design-system", element: <DesignSystem /> });

const router = createMemoryRouter([{ path: "/", element: <AppShell />, children: routes }]);

function App(): React.JSX.Element {
  useSystemTheme();
  const loadSettings = useSettingsStore((s) => s.load);
  const loadPreferences = usePreferencesStore((s) => s.load);
  useApplyPreferences();
  const loadWorkspaces = useWorkspaceStore((s) => s.load);
  const startPermissions = usePermissionStore((s) => s.start);

  useEffect(() => {
    void Promise.all([loadSettings(), loadPreferences(), loadWorkspaces()]).finally(() =>
      window.api.showWindow(),
    );
    void startPermissions();
  }, [loadSettings, loadPreferences, loadWorkspaces, startPermissions]);

  return (
    <ErrorBoundary>
      <HotkeysProvider>
        <RouterProvider router={router} />
      </HotkeysProvider>
    </ErrorBoundary>
  );
}

export default App;
