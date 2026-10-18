import { Outlet } from "react-router";
import { Toaster } from "sonner";
import Titlebar from "@/components/layout/titlebar";
import { useSettingsStore } from "@/stores/settings.store";

function AppShell(): React.JSX.Element {
  const theme = useSettingsStore((s) => s.resolvedTheme);

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden bg-page">
      <Titlebar />
      <div className="relative flex flex-1 overflow-hidden">
        <Outlet />
      </div>
      <Toaster position="bottom-center" theme={theme} closeButton expand duration={10000} />
    </div>
  );
}

export default AppShell;
