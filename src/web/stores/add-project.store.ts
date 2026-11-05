import { create } from "zustand";
import type { FoundRepo } from "@/components/projects/repo-picker";

interface AddProjectStore {
  workspaceId: string | null;
  projectId: string | null;
  repo: FoundRepo | null;
  show: (workspaceId: string, repo?: FoundRepo) => void;
  edit: (projectId: string) => void;
  hide: () => void;
}

export const useAddProjectStore = create<AddProjectStore>((set) => ({
  workspaceId: null,
  projectId: null,
  repo: null,
  show: (workspaceId, repo) => set({ workspaceId, projectId: null, repo: repo ?? null }),
  edit: (projectId) => set({ workspaceId: null, projectId, repo: null }),
  hide: () => set({ workspaceId: null, projectId: null, repo: null }),
}));
