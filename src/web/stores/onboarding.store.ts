import { create } from 'zustand';
import type { QuickCommand } from '@native/db/types';

interface OnboardingWorkspace {
  name: string;
  color: string;
  icon: string;
  customImage: string | null;
}

interface OnboardingProject {
  name: string;
  path: string;
  branchPrefix: string;
  quickCommands: QuickCommand[];
}

interface OnboardingStore {
  step: number;
  introPlayed: boolean;
  workspace: OnboardingWorkspace;
  project: OnboardingProject;
  agentId: string | null;

  setIntroPlayed: () => void;
  setStep: (step: number) => void;
  setWorkspace: (data: Partial<OnboardingWorkspace>) => void;
  setProject: (data: Partial<OnboardingProject>) => void;
  setAgentId: (id: string | null) => void;
  reset: () => void;
}

const INITIAL_WORKSPACE: OnboardingWorkspace = {
  name: '',
  color: '#175F52',
  icon: 'letter',
  customImage: null
};

const INITIAL_PROJECT: OnboardingProject = {
  name: '',
  path: '',
  branchPrefix: '',
  quickCommands: []
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  introPlayed: false,
  workspace: { ...INITIAL_WORKSPACE },
  project: { ...INITIAL_PROJECT },
  agentId: null,

  setIntroPlayed: () => set({ introPlayed: true }),
  setStep: (step) => set({ step }),
  setWorkspace: (data) => set((s) => ({ workspace: { ...s.workspace, ...data } })),
  setProject: (data) => set((s) => ({ project: { ...s.project, ...data } })),
  setAgentId: (agentId) => set({ agentId }),
  reset: () =>
    set({
      step: 1,
      introPlayed: false,
      workspace: { ...INITIAL_WORKSPACE },
      project: { ...INITIAL_PROJECT },
      agentId: null
    })
}));
