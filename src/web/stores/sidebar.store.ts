import { create } from 'zustand';

interface SidebarCollapsed {
  workspacesSection: boolean;
  workspaces: string[];
  tasks: boolean;
  groups: string[];
  projects: string[];
  full: boolean;
}

const DEFAULT_COLLAPSED: SidebarCollapsed = {
  workspacesSection: false,
  workspaces: [],
  tasks: false,
  groups: [],
  projects: [],
  full: false
};

interface SidebarState {
  collapsed: SidebarCollapsed;
  loaded: boolean;

  workspaceModalOpen: boolean;
  workspaceModalId: string;
  createProjectWorkspaceId: string;
  createProjectOpen: boolean;
  deleteWorkspaceId: string;
  deleteWorkspaceOpen: boolean;
  manageWorkspacesOpen: boolean;

  editProjectOpen: boolean;
  editProjectId: string;
  deleteProjectOpen: boolean;
  deleteProjectId: string;

  load: () => Promise<void>;
  persist: (next: SidebarCollapsed) => void;
  toggle: (key: 'workspaces' | 'groups' | 'projects', id: string) => void;
  toggleFull: () => void;

  openCreateWorkspace: () => void;
  openEditWorkspace: (workspaceId: string) => void;
  closeWorkspaceModal: () => void;
  openCreateProject: (workspaceId: string) => void;
  closeCreateProject: () => void;
  openDeleteWorkspace: (workspaceId: string) => void;
  closeDeleteWorkspace: () => void;
  openManageWorkspaces: () => void;
  closeManageWorkspaces: () => void;

  openEditProject: (projectId: string) => void;
  closeEditProject: () => void;
  openDeleteProject: (projectId: string) => void;
  closeDeleteProject: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: DEFAULT_COLLAPSED,
  loaded: false,

  workspaceModalOpen: false,
  workspaceModalId: '',
  createProjectWorkspaceId: '',
  createProjectOpen: false,
  deleteWorkspaceId: '',
  deleteWorkspaceOpen: false,
  manageWorkspacesOpen: false,

  editProjectOpen: false,
  editProjectId: '',
  deleteProjectOpen: false,
  deleteProjectId: '',

  load: async () => {
    const val = await window.api.getSetting<SidebarCollapsed>(
      'sidebar-collapsed',
      DEFAULT_COLLAPSED
    );
    set({ collapsed: { ...DEFAULT_COLLAPSED, ...val }, loaded: true });
  },

  persist: (next) => {
    set({ collapsed: next });
    window.api.setSetting('sidebar-collapsed', next);
  },

  toggle: (key, id) => {
    const { collapsed, persist } = get();
    const list = collapsed[key];
    const next = list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
    persist({ ...collapsed, [key]: next });
  },

  toggleFull: () => {
    const { collapsed, persist } = get();
    persist({ ...collapsed, full: !collapsed.full });
  },

  openCreateWorkspace: () => set({ workspaceModalOpen: true, workspaceModalId: '' }),
  openEditWorkspace: (workspaceId) =>
    set({ workspaceModalOpen: true, workspaceModalId: workspaceId }),
  closeWorkspaceModal: () => set({ workspaceModalOpen: false }),

  openCreateProject: (workspaceId) =>
    set({ createProjectOpen: true, createProjectWorkspaceId: workspaceId }),
  closeCreateProject: () => set({ createProjectOpen: false }),

  openDeleteWorkspace: (workspaceId) =>
    set({ deleteWorkspaceOpen: true, deleteWorkspaceId: workspaceId }),
  closeDeleteWorkspace: () => set({ deleteWorkspaceOpen: false }),

  openManageWorkspaces: () => set({ manageWorkspacesOpen: true }),
  closeManageWorkspaces: () => set({ manageWorkspacesOpen: false }),

  openEditProject: (projectId) => set({ editProjectOpen: true, editProjectId: projectId }),
  closeEditProject: () => set({ editProjectOpen: false }),
  openDeleteProject: (projectId) => set({ deleteProjectOpen: true, deleteProjectId: projectId }),
  closeDeleteProject: () => set({ deleteProjectOpen: false })
}));
