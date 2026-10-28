import { Outlet } from "react-router";
import Titlebar from "@/components/layout/titlebar";
import { Toaster } from "@/components/primitives/toaster";

function AppShell(): React.JSX.Element {
  return (
    <div className="relative isolate flex h-screen flex-col overflow-clip bg-page">
      <Titlebar />
      <div className="relative flex min-h-0 flex-1 overflow-clip">
        <Outlet />
      </div>
      <Toaster />
    </div>
  );
}

export default AppShell;
