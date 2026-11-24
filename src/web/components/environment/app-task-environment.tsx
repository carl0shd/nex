import { useNavigate } from "react-router";
import type { TaskEnvState } from "@native/environments/types";
import { EnvBannerSlot, type EnvBannerState } from "@/components/environment/env-banner";
import { EnvTaskButton } from "@/components/environment/env-menu";
import { EnvButton } from "@/components/task/env-button";
import { EnvStartStatus } from "@/components/environment/env-start-status";
import { useNow } from "@/hooks/use-now";
import { notifyCompact } from "@/lib/notify";
import {
  bannerState,
  envButtonLabel,
  envButtonState,
  mainAddress,
  menuServices,
  startStatus,
} from "@/lib/task-environment";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const TICK_MS = 1000;

const openUrl = (url: string) => void window.api.openExternalUrl(url);

// `localhost:<port>` goes to the task Nex is viewing, so the task is viewed before the page asks.
function useOpenInTask(sessionId: string) {
  const selectTask = useWorkspaceStore((s) => s.selectTask);
  return (url: string) => {
    selectTask(sessionId);
    void window.api.viewTaskEnvironment(sessionId).then(() => openUrl(url));
  };
}

const useTaskEnvironment = (sessionId: string): TaskEnvState | undefined =>
  useEnvironmentsStore((s) => s.tasks[sessionId]);

function useTurnOnEnvironment(
  sessionId: string,
  env: TaskEnvState | undefined,
): (() => void) | null {
  const session = useWorkspaceStore((s) => s.sessions.find((item) => item.id === sessionId));
  const project = useWorkspaceStore((s) =>
    s.projects.find((item) => item.id === session?.projectId),
  );
  const enabled = useEnvironmentsStore((s) => s.status?.enabled ?? false);
  const startTask = useEnvironmentsStore((s) => s.startTask);
  const turnEnvironmentOn = useWorkspaceStore((s) => s.turnEnvironmentOn);
  const off =
    enabled &&
    Boolean(session?.envOff) &&
    (project?.environment?.services.length ?? 0) > 0 &&
    (!env || env.status === "none");
  if (!off) return null;
  return () => {
    turnEnvironmentOn(sessionId);
    startTask(sessionId);
  };
}

export function AppEnvButton({
  sessionId,
  onLogs,
}: {
  sessionId: string;
  onLogs: (service?: string) => void;
}) {
  const env = useTaskEnvironment(sessionId);
  const startTask = useEnvironmentsStore((s) => s.startTask);
  const pauseTask = useEnvironmentsStore((s) => s.pauseTask);
  const restartTask = useEnvironmentsStore((s) => s.restartTask);
  const openInTask = useOpenInTask(sessionId);
  const turnOn = useTurnOnEnvironment(sessionId, env);
  const state = envButtonState(env);
  if (turnOn) return <EnvButton state="off" label="Start environment" onClick={turnOn} />;
  if (!env || !state) return null;
  const main = mainAddress(env);
  const paused = env.status === "paused";
  return (
    <EnvTaskButton
      state={state}
      label={envButtonLabel(env)}
      services={menuServices(env)}
      actions={{
        onOpenService: openInTask,
        onCopyService: (url) => {
          void navigator.clipboard.writeText(url);
          notifyCompact({ tone: "green", title: "Link copied" });
        },
        onCopyLink: main
          ? () => {
              void navigator.clipboard.writeText(main.url);
              notifyCompact({ tone: "green", title: "Link copied" });
            }
          : undefined,
        onOpenWindow: main ? () => openInTask(main.url) : undefined,
        onRestart: () => restartTask(sessionId),
        onTogglePause: () => (paused ? startTask(sessionId) : pauseTask(sessionId)),
        onLogs: () => onLogs(),
      }}
    />
  );
}

const IDLE_TICK_MS = 60_000;

export function AppEnvBanner({
  sessionId,
  onLogs,
}: {
  sessionId: string;
  onLogs: (service?: string) => void;
}) {
  const env = useTaskEnvironment(sessionId);
  const startTask = useEnvironmentsStore((s) => s.startTask);
  const pauseTask = useEnvironmentsStore((s) => s.pauseTask);
  const restartTask = useEnvironmentsStore((s) => s.restartTask);
  const navigate = useNavigate();
  const now = useNow(env?.status === "starting" ? TICK_MS : IDLE_TICK_MS);
  return <EnvBannerSlot state={withActions(bannerState(env, now))} />;

  function withActions(state: EnvBannerState | null): EnvBannerState | null {
    if (!env || !state) return null;
    const suggested = env.waiting?.suggestion?.sessionId;
    switch (state.kind) {
      case "paused":
        return { ...state, onResume: () => startTask(sessionId) };
      case "down":
        return {
          ...state,
          onViewLog: () => onLogs(env.down?.service),
          onRestart: () => restartTask(sessionId, env.down?.service),
        };
      case "failed":
        return { ...state, onViewLog: () => onLogs(), onRetry: () => startTask(sessionId) };
      case "waiting":
        return {
          ...state,
          onManage: () => navigate("/settings", { state: { section: "environments" } }),
          onPause: suggested ? () => pauseTask(suggested) : undefined,
        };
      default:
        return state;
    }
  }
}

export function AppEnvStartStatus({ sessionId }: { sessionId: string }) {
  const env = useTaskEnvironment(sessionId);
  const pauseTask = useEnvironmentsStore((s) => s.pauseTask);
  const openInTask = useOpenInTask(sessionId);
  const turnOn = useTurnOnEnvironment(sessionId, env);
  if (turnOn) return <EnvStartStatus state={{ kind: "off", onStart: turnOn }} />;
  const state = startStatus(env);
  if (!state) return null;
  const suggested = env?.waiting?.suggestion?.sessionId;
  if (state.kind === "ready") return <EnvStartStatus state={{ ...state, onOpen: openInTask }} />;
  if (state.kind === "waiting") {
    return (
      <EnvStartStatus
        state={{ ...state, onPause: suggested ? () => pauseTask(suggested) : undefined }}
      />
    );
  }
  return <EnvStartStatus state={state} />;
}
