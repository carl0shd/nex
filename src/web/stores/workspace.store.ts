import type { TaskView } from "@/components/task/task-tab-bar";
import { create } from "zustand";
import type {
  CreateProjectInput,
  CreateWorkspaceInput,
  Project,
  QuickCommand,
  Session,
  StartWorkInput,
  UpdateProjectInput,
  Terminal,
  Workspace,
} from "@native/db/types";
import { badgeFields, storedWorkspaceIcon, type WorkspaceIconName } from "@/lib/workspace-icons";

type TerminalState = Pick<Terminal, "id" | "sessionId" | "type" | "status" | "name" | "isPrimary">;

export type HomeView = "overview" | "tasks";

interface WorkspaceStore {
  workspaces: Workspace[];
  projects: Project[];
  sessions: Session[];
  terminals: TerminalState[];
  runningSince: Record<string, number>;
  activeTaskId: string | null;
  homeView: HomeView;
  replyFocus: { sessionId: string; request: number; insert?: string } | null;
  viewRequest: { sessionId: string; request: number; view: TaskView } | null;
  openTaskView: (id: string, view: TaskView) => void;
  loaded: boolean;
  load: () => Promise<void>;
  createWorkspace: (
    input: Pick<CreateWorkspaceInput, "name" | "color"> & {
      image: string | null;
      icon?: WorkspaceIconName | null;
    },
  ) => Promise<Workspace>;
  startTask: (input: StartWorkInput) => Promise<Session>;
  addShell: (sessionId: string) => Promise<string>;
  closeTerminal: (id: string) => Promise<void>;
  runQuickCommand: (sessionId: string, command: QuickCommand) => Promise<string>;
  openEnvironmentLogs: (sessionId: string, service?: string) => Promise<string | null>;
  renameTask: (id: string, title: string) => Promise<void>;
  setTaskWidth: (id: string, width: number) => void;
  turnEnvironmentOn: (id: string) => void;
  setTaskMinimized: (id: string, minimized: boolean) => void;
  setWorkspaceHidden: (id: string, hidden: boolean) => void;
  closeTask: (id: string) => Promise<void>;
  setAgentRunning: (sessionId: string, running: boolean) => void;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  setWorkspaceLook: (
    id: string,
    look: { color?: string; image?: string | null; icon?: WorkspaceIconName | null },
  ) => Promise<void>;
  removeWorkspace: (id: string) => Promise<void>;
  toggleWorkspace: (id: string) => void;
  expandWorkspace: (id: string) => void;
  selectTask: (id: string) => void;
  openTask: (id: string, insert?: string) => void;
  showOverview: () => void;
  showTasks: () => void;
}

let unsubscribeStatus: (() => void) | null = null;
let unsubscribeAgents: (() => void) | null = null;
const hookDriven = new Set<string>();

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => {
  const setCollapsed = (id: string, collapsed: boolean) => {
    const workspace = get().workspaces.find((item) => item.id === id);
    if (!workspace || workspace.collapsed === collapsed) return;
    set((state) => ({
      workspaces: state.workspaces.map((item) => (item.id === id ? { ...item, collapsed } : item)),
    }));
    void window.api.updateWorkspace(id, { collapsed });
  };

  const setMinimized = (id: string, minimized: boolean) => {
    const session = get().sessions.find((item) => item.id === id);
    if (!session || session.minimized === minimized) return;
    set((state) => ({
      sessions: state.sessions.map((item) => (item.id === id ? { ...item, minimized } : item)),
    }));
    void window.api.updateSession(id, { minimized });
  };

  const replaceWorkspace = (workspace: Workspace) =>
    set((state) => ({
      workspaces: state.workspaces.map((item) => (item.id === workspace.id ? workspace : item)),
    }));

  const closeTasks = async (belongs: (session: Session) => boolean) => {
    const { sessions, terminals, activeTaskId } = get();
    const sessionIds = new Set(sessions.filter(belongs).map((session) => session.id));
    await Promise.all(
      terminals
        .filter((terminal) => sessionIds.has(terminal.sessionId))
        .map((terminal) => window.api.ptyKill(terminal.id)),
    );
    set((state) => ({
      sessions: state.sessions.filter((session) => !sessionIds.has(session.id)),
      terminals: state.terminals.filter((terminal) => !sessionIds.has(terminal.sessionId)),
      activeTaskId: activeTaskId && sessionIds.has(activeTaskId) ? null : activeTaskId,
    }));
  };

  return {
    workspaces: [],
    projects: [],
    sessions: [],
    terminals: [],
    runningSince: {},
    activeTaskId: null,
    homeView: "overview",
    replyFocus: null,
    viewRequest: null,
    loaded: false,

    load: async () => {
      const [workspaces, projects, sessions, terminals] = await Promise.all([
        window.api.getWorkspaces(),
        window.api.getProjects(),
        window.api.getSessions(),
        window.api.getTerminals(),
      ]);
      set({ workspaces, projects, sessions, terminals, loaded: true });

      unsubscribeStatus?.();
      unsubscribeStatus = window.api.onTerminalStatus(({ id, status }) =>
        set((state) => {
          const terminal = state.terminals.find((item) => item.id === id);
          if (!terminal || (terminal.type === "agent" && hookDriven.has(terminal.sessionId))) {
            return state;
          }
          return {
            terminals: state.terminals.map((item) => (item.id === id ? { ...item, status } : item)),
          };
        }),
      );
      unsubscribeAgents?.();
      unsubscribeAgents = window.api.onAgentState(({ sessionId, state }) =>
        get().setAgentRunning(sessionId, state === "running"),
      );
      const running = await window.api.agentStates();
      for (const session of sessions)
        get().setAgentRunning(session.id, running[session.id] === "running");
    },

    createWorkspace: async ({ name, color, image, icon }) => {
      let workspace = await window.api.createWorkspace({
        name,
        color,
        icon: icon ? storedWorkspaceIcon(icon) : image ? "image" : "letter",
      });
      const imagePath = !icon && image && (await window.api.saveWorkspaceIcon(workspace.id, image));
      if (imagePath) {
        workspace = await window.api.updateWorkspace(workspace.id, { customImage: imagePath });
      }
      set((state) => ({ workspaces: [...state.workspaces, workspace] }));
      return workspace;
    },
    createProject: async (input) => {
      const project = await window.api.createProject(input);
      set((state) => ({ projects: [...state.projects, project] }));
      setCollapsed(input.workspaceId, false);
      return project;
    },
    renameWorkspace: async (id, name) => {
      const workspace = await window.api.updateWorkspace(id, { name });
      replaceWorkspace(workspace);
    },
    setWorkspaceLook: async (id, { color, image, icon }) => {
      if (color) {
        set((state) => ({
          workspaces: state.workspaces.map((item) => (item.id === id ? { ...item, color } : item)),
        }));
      }
      const customImage =
        image === undefined || icon
          ? undefined
          : image && (await window.api.saveWorkspaceIcon(id, image));
      replaceWorkspace(
        await window.api.updateWorkspace(id, {
          ...(color && { color }),
          ...badgeFields(customImage, icon),
        }),
      );
    },
    removeWorkspace: async (id) => {
      const projectIds = get()
        .projects.filter((project) => project.workspaceId === id)
        .map((project) => project.id);
      await closeTasks((session) => projectIds.includes(session.projectId));
      await window.api.deleteWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((workspace) => workspace.id !== id),
        projects: state.projects.filter((project) => project.workspaceId !== id),
      }));
    },
    updateProject: async (id, input) => {
      const project = await window.api.updateProject(id, input);
      set((state) => ({
        projects: state.projects.map((item) => (item.id === id ? project : item)),
      }));
    },
    removeProject: async (id) => {
      await closeTasks((session) => session.projectId === id);
      await window.api.deleteProject(id);
      set((state) => ({ projects: state.projects.filter((project) => project.id !== id) }));
    },
    startTask: async (input) => {
      const session = await window.api.startWork(input);
      const terminals = await window.api.getTerminalsBySession(session.id);
      set((state) => ({
        sessions: [...state.sessions, session],
        terminals: [...state.terminals, ...terminals],
        activeTaskId: session.id,
        homeView: "tasks",
      }));
      return session;
    },
    setAgentRunning: (sessionId, running) => {
      hookDriven.add(sessionId);
      const status = running ? "running" : "idle";
      set((state) => {
        const agent = state.terminals.find(
          (terminal) => terminal.sessionId === sessionId && terminal.type === "agent",
        );
        if (!agent || agent.status === status) return state;
        const { [sessionId]: _since, ...rest } = state.runningSince;
        return {
          terminals: state.terminals.map((terminal) =>
            terminal.id === agent.id ? { ...terminal, status } : terminal,
          ),
          runningSince: running ? { ...state.runningSince, [sessionId]: Date.now() } : rest,
        };
      });
    },
    runQuickCommand: async (sessionId, command) => {
      const running = get().terminals.find(
        (terminal) =>
          terminal.sessionId === sessionId &&
          terminal.type === "shell" &&
          terminal.name === command.name,
      );
      if (running) return running.id;
      const terminal = await window.api.createSessionTerminal({
        sessionId,
        type: "shell",
        name: command.name,
        runCommand: command.command,
      });
      set((state) => ({ terminals: [...state.terminals, terminal] }));
      return terminal.id;
    },
    openEnvironmentLogs: async (sessionId, service) => {
      const terminal = await window.api.openTaskEnvironmentLogs(sessionId, service);
      if (!terminal) return null;
      set((state) =>
        state.terminals.some((item) => item.id === terminal.id)
          ? state
          : { terminals: [...state.terminals, terminal] },
      );
      return terminal.id;
    },
    setTaskWidth: (id, width) => {
      set((state) => ({
        sessions: state.sessions.map((item) => (item.id === id ? { ...item, width } : item)),
      }));
      void window.api.updateSession(id, { width });
    },
    turnEnvironmentOn: (id) => {
      set((state) => ({
        sessions: state.sessions.map((item) =>
          item.id === id ? { ...item, envOff: false } : item,
        ),
      }));
    },
    setTaskMinimized: (id, minimized) => {
      setMinimized(id, minimized);
      if (minimized && get().activeTaskId === id) set({ activeTaskId: null });
    },
    setWorkspaceHidden: (id, archived) => {
      const projectIds = new Set(
        get()
          .projects.filter((project) => project.workspaceId === id)
          .map((project) => project.id),
      );
      set((state) => {
        const active = state.sessions.find((session) => session.id === state.activeTaskId);
        return {
          workspaces: state.workspaces.map((item) =>
            item.id === id ? { ...item, archived } : item,
          ),
          activeTaskId:
            archived && active && projectIds.has(active.projectId) ? null : state.activeTaskId,
        };
      });
      void window.api.updateWorkspace(id, { archived });
      if (!archived) return;
      for (const session of get().sessions)
        if (projectIds.has(session.projectId)) void window.api.pauseTaskEnvironment(session.id);
    },
    renameTask: async (id, title) => {
      const session = await window.api.updateSession(id, { title });
      set((state) => ({
        sessions: state.sessions.map((item) => (item.id === id ? session : item)),
      }));
    },
    closeTask: async (id) => {
      await window.api.deleteSession(id, true);
      set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== id),
        terminals: state.terminals.filter((terminal) => terminal.sessionId !== id),
        activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
      }));
    },
    closeTerminal: async (id) => {
      await window.api.deleteTerminal(id);
      set((state) => ({ terminals: state.terminals.filter((terminal) => terminal.id !== id) }));
    },
    addShell: async (sessionId) => {
      const terminal = await window.api.createSessionTerminal({ sessionId, type: "shell" });
      set((state) => ({ terminals: [...state.terminals, terminal] }));
      return terminal.id;
    },
    toggleWorkspace: (id) => {
      const workspace = get().workspaces.find((item) => item.id === id);
      if (workspace) setCollapsed(id, !workspace.collapsed);
    },
    expandWorkspace: (id) => setCollapsed(id, false),
    selectTask: (id) => {
      setMinimized(id, false);
      set({ activeTaskId: id, homeView: "tasks" });
    },
    openTask: (id, insert) => {
      setMinimized(id, false);
      set((state) => ({
        activeTaskId: id,
        homeView: "tasks",
        replyFocus: { sessionId: id, request: (state.replyFocus?.request ?? 0) + 1, insert },
      }));
    },
    openTaskView: (id, view) => {
      setMinimized(id, false);
      set((state) => ({
        activeTaskId: id,
        homeView: "tasks",
        viewRequest: { sessionId: id, request: (state.viewRequest?.request ?? 0) + 1, view },
      }));
    },
    showOverview: () => set({ activeTaskId: null, homeView: "overview" }),
    showTasks: () => set({ homeView: "tasks" }),
  };
});
