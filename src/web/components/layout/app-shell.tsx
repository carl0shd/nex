import { AppCommandPalette } from "@/components/command/app-command-palette";
import { AppAgentToasts } from "@/components/task/app-agent-toasts";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppBackdropContext } from "@/components/layout/app-backdrop";
import { AppSidebar } from "@/components/layout/app-sidebar";
import Titlebar from "@/components/layout/titlebar";
import { AppNewTask } from "@/components/new-task/app-new-task";
import { AppFirstRunCard } from "@/components/onboarding/app-first-run-card";
import { AppOnboarding } from "@/components/onboarding/app-onboarding";
import { AppAddProject } from "@/components/projects/app-add-project";
import { AppRemoveProject } from "@/components/projects/app-remove-project";
import { AppRemoveWorkspace } from "@/components/layout/app-remove-workspace";
import { AppCloseTask } from "@/components/task/app-close-task";
import { Toaster } from "@/components/primitives/toaster";
import { useClaudeVersionCheck } from "@/hooks/use-claude-version-check";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

function useOnboarding() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const finishOnboarding = useSettingsStore((s) => s.finishOnboarding);
  const workspacesLoaded = useWorkspaceStore((s) => s.loaded);
  const hasWorkspaces = useWorkspaceStore((s) => s.workspaces.length > 0);
  const firstRun = settingsLoaded && workspacesLoaded && !onboarded && !hasWorkspaces;
  const [started, setStarted] = useState(false);
  if (firstRun && !started) setStarted(true);
  return {
    showing: started,
    done: () => {
      setStarted(false);
      finishOnboarding();
    },
  };
}

function AppShell(): React.JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useClaudeVersionCheck();
  useEffect(() => {
    if (pathname !== "/settings") return;
    return useWorkspaceStore.subscribe((state, previous) => {
      const opened =
        state.activeTaskId !== previous.activeTaskId ||
        state.replyFocus !== previous.replyFocus ||
        state.viewRequest !== previous.viewRequest;
      if (opened && state.activeTaskId) navigate("/");
    });
  }, [pathname, navigate]);
  const onboarding = useOnboarding();
  const [backdrop, setBackdrop] = useState<HTMLDivElement | null>(null);
  if (onboarding.showing) {
    return (
      <>
        <AppOnboarding onDone={onboarding.done} />
        <AppAddProject fullWindow />
        <Toaster />
      </>
    );
  }
  return (
    <div className="relative isolate flex h-screen flex-col overflow-clip bg-page">
      <div ref={setBackdrop} className="pointer-events-none absolute inset-0 -z-10" />
      <AppBackdropContext value={backdrop}>
        <Titlebar />
        <div className="relative flex min-h-0 flex-1 overflow-clip">
          <AppSidebar />
          <Outlet />
        </div>
      </AppBackdropContext>
      <AppNewTask />
      <AppAddProject />
      <AppRemoveProject />
      <AppRemoveWorkspace />
      <AppCloseTask />
      <AppCommandPalette />
      <AppAgentToasts />
      <Toaster />
      <AppFirstRunCard />
    </div>
  );
}

export default AppShell;
