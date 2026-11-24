import { create } from "zustand";
import type {
  EnvCheckInput,
  EnvCheckState,
  EnvironmentStatus,
  EnvSetupState,
  TaskEnvState,
} from "@native/environments/types";
import type { EnvAction } from "@/lib/environments";

interface EnvironmentsStore {
  status: EnvironmentStatus | null;
  setup: EnvSetupState | null;
  action: EnvAction | null;
  checks: Record<string, EnvCheckState>;
  tasks: Record<string, TaskEnvState>;
  load: () => void;
  loadTasks: () => void;
  startTask: (sessionId: string) => void;
  pauseTask: (sessionId: string) => void;
  restartTask: (sessionId: string, service?: string) => void;
  pauseIdle: () => void;
  startCheck: (input: EnvCheckInput) => void;
  stopCheck: (projectPath: string) => void;
  refresh: () => Promise<void>;
  startSetup: () => void;
  restart: () => Promise<void>;
  repairAddresses: () => Promise<void>;
  uninstall: () => Promise<void>;
}

let listening = false;
let listeningChecks = false;
let listeningTasks = false;

export const useEnvironmentsStore = create<EnvironmentsStore>((set, get) => {
  const during = async (action: EnvAction, task: () => Promise<void>) => {
    set({ action });
    try {
      await task();
    } finally {
      set({ action: null });
      await get().refresh();
    }
  };

  const putCheck = (check: EnvCheckState) =>
    set((state) => ({ checks: { ...state.checks, [check.projectPath]: check } }));

  const putTask = (env: TaskEnvState | null) => {
    if (!env) return;
    set((state) => {
      const { [env.sessionId]: _previous, ...rest } = state.tasks;
      const gone = env.status === "none" && env.services.length === 0;
      return { tasks: gone ? rest : { ...rest, [env.sessionId]: env } };
    });
  };

  return {
    status: null,
    setup: null,
    action: null,
    checks: {},
    tasks: {},

    loadTasks: () => {
      if (listeningTasks) return;
      listeningTasks = true;
      window.api.onTaskEnvironment(putTask);
      void window.api.getTaskEnvironments().then((all) => all.forEach(putTask));
    },

    startTask: (sessionId) => {
      void window.api.startTaskEnvironment(sessionId).then(putTask);
    },

    pauseTask: (sessionId) => {
      void window.api.pauseTaskEnvironment(sessionId);
    },

    restartTask: (sessionId, service) => {
      void window.api.restartTaskEnvironment(sessionId, service);
    },

    pauseIdle: () => {
      void window.api.pauseIdleTaskEnvironments();
    },

    load: () => {
      if (!listening) {
        listening = true;
        window.api.onEnvironmentSetup((setup) => {
          set({ setup });
          if (setup.phase !== "running") void get().refresh();
        });
      }
      void get().refresh();
    },

    refresh: async () => {
      const status = await window.api.getEnvironmentStatus();
      const current = get().setup;
      const live = current?.phase === "running" && status.setup?.phase === "running";
      set({ status, setup: live ? current : status.setup });
    },

    startCheck: (input) => {
      if (!listeningChecks) {
        listeningChecks = true;
        window.api.onEnvironmentCheck(putCheck);
      }
      void window.api.checkEnvironment(input).then((check) => {
        const current = get().checks[check.projectPath];
        if (!current || current.startedAt < check.startedAt) putCheck(check);
      });
    },

    stopCheck: (projectPath) => {
      void window.api.stopEnvironmentCheck(projectPath);
    },

    startSetup: () => {
      void window.api.setupEnvironments().then((setup) => set({ setup }));
    },

    restart: () => during("restarting", () => window.api.restartEnvironments()),
    repairAddresses: () => during("repairing", () => window.api.repairEnvironmentAddresses()),
    uninstall: () => during("removing", () => window.api.uninstallEnvironments()),
  };
});
