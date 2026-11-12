import { create } from "zustand";
import type { ProjectSection } from "@/components/projects/add-project-dialog";
import type { CloneMode } from "@/components/projects/clone-repo-panel";
import type { FoundRepo } from "@/components/projects/repo-picker";

interface AddProjectStore {
  workspaceId: string | null;
  projectId: string | null;
  repo: FoundRepo | null;
  clone: CloneMode | null;
  section: ProjectSection | null;
  show: (workspaceId: string, repo?: FoundRepo) => void;
  showClone: (workspaceId: string, mode: CloneMode) => void;
  edit: (projectId: string, section?: ProjectSection) => void;
  hide: () => void;
}

const CLOSED = { workspaceId: null, projectId: null, repo: null, clone: null, section: null };

export const useAddProjectStore = create<AddProjectStore>((set) => ({
  ...CLOSED,
  show: (workspaceId, repo) => set({ ...CLOSED, workspaceId, repo: repo ?? null }),
  showClone: (workspaceId, mode) => set({ ...CLOSED, workspaceId, clone: mode }),
  edit: (projectId, section) => set({ ...CLOSED, projectId, section: section ?? null }),
  hide: () => set(CLOSED),
}));
