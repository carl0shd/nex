import { create } from 'zustand';
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput
} from '@native/db/types';

interface WorkspaceStore {
  workspaces: Workspace[];
  projects: Project[];

  loadWorkspaces: () => Promise<void>;
  loadProjects: () => Promise<void>;

  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>;
  updateWorkspace: (id: string, input: UpdateWorkspaceInput) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;

  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;

  getProjectsByWorkspace: (workspaceId: string) => Project[];
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  projects: [],

  loadWorkspaces: async () => {
    const workspaces = await window.api.getWorkspaces();
    set({ workspaces });
  },

  loadProjects: async () => {
    const projects = await window.api.getProjects();
    set({ projects });
  },

  createWorkspace: async (input) => {
    const workspace = await window.api.createWorkspace(input);
    set((s) => ({ workspaces: [...s.workspaces, workspace] }));
    return workspace;
  },

  updateWorkspace: async (id, input) => {
    const workspace = await window.api.updateWorkspace(id, input);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? workspace : w))
    }));
    return workspace;
  },

  deleteWorkspace: async (id) => {
    await window.api.deleteWorkspace(id);
    set((s) => ({
      workspaces: s.workspaces.filter((w) => w.id !== id),
      projects: s.projects.filter((p) => p.workspaceId !== id)
    }));
  },

  createProject: async (input) => {
    const project = await window.api.createProject(input);
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject: async (id, input) => {
    const project = await window.api.updateProject(id, input);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? project : p))
    }));
    return project;
  },

  deleteProject: async (id) => {
    await window.api.deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  getProjectsByWorkspace: (workspaceId) => {
    return get().projects.filter((p) => p.workspaceId === workspaceId);
  }
}));
