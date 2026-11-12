import { create } from "zustand";
import type { ProjectEnvironment } from "@native/db/types";
import type {
  CleanBaseState,
  EnvCheckInput,
  EnvCheckState,
  EnvironmentStatus,
  EnvSetupState,
} from "@native/environments/types";
import type { EnvAction } from "@/lib/environments";

interface EnvironmentsStore {
  status: EnvironmentStatus | null;
  setup: EnvSetupState | null;
  action: EnvAction | null;
  checks: Record<string, EnvCheckState>;
  bases: Record<string, CleanBaseState>;
  load: () => void;
  loadBase: (projectId: string) => void;
  buildBase: (projectId: string, environment: ProjectEnvironment) => void;
  stopBase: (projectId: string) => void;
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
let listeningBases = false;

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

  const putBase = (base: CleanBaseState | null) => {
    if (base) set((state) => ({ bases: { ...state.bases, [base.projectId]: base } }));
  };

  const listenBases = () => {
    if (listeningBases) return;
    listeningBases = true;
    window.api.onCleanBase(putBase);
  };

  return {
    status: null,
    setup: null,
    action: null,
    checks: {},
    bases: {},

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

    loadBase: (projectId) => {
      listenBases();
      void window.api.getCleanBase(projectId).then(putBase);
    },

    buildBase: (projectId, environment) => {
      listenBases();
      void window.api.buildCleanBase({ projectId, environment }).then(putBase);
    },

    stopBase: (projectId) => {
      void window.api.stopCleanBase(projectId);
    },

    startSetup: () => {
      void window.api.setupEnvironments().then((setup) => set({ setup }));
    },

    restart: () => during("restarting", () => window.api.restartEnvironments()),
    repairAddresses: () => during("repairing", () => window.api.repairEnvironmentAddresses()),
    uninstall: () => during("removing", () => window.api.uninstallEnvironments()),
  };
});
