import { create } from "zustand";
import type { AgentModel } from "@native/agents/agent-models";

interface AgentModelsStore {
  reported: AgentModel[];
  load: () => void;
}

let listening = false;

export const useAgentModelsStore = create<AgentModelsStore>((set) => ({
  reported: [],
  load: () => {
    const fetch = () => void window.api.agentModels().then((reported) => set({ reported }));
    if (!listening) {
      listening = true;
      window.api.onAgentModels(fetch);
    }
    fetch();
  },
}));
