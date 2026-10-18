import { useEffect } from "react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import ErrorBoundary from "@/components/error-boundary";
import AppShell from "@/components/layout/app-shell";
import Home from "@/routes/home";
import DesignSystem from "@/routes/design-system";
import { useSystemTheme } from "@/hooks/use-system-theme";
import { useSettingsStore } from "@/stores/settings.store";

const routes: RouteObject[] = [{ index: true, element: <Home /> }];
if (import.meta.env.DEV) routes.push({ path: "design-system", element: <DesignSystem /> });

const router = createMemoryRouter([{ path: "/", element: <AppShell />, children: routes }]);

function App(): React.JSX.Element {
  useSystemTheme();
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    void loadSettings().then(() => window.api.showWindow());
  }, [loadSettings]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
