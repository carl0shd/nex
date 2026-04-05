import { create } from 'zustand';
import type {
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  AgentAccount,
  CreateAgentAccountInput,
  UpdateAgentAccountInput
} from '@native/db/types';

interface AgentStore {
  agents: Agent[];
  accounts: AgentAccount[];

  loadAgents: () => Promise<void>;
  loadAccounts: () => Promise<void>;

  createAgent: (input: CreateAgentInput) => Promise<Agent>;
  updateAgent: (id: string, input: UpdateAgentInput) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;

  createAccount: (input: CreateAgentAccountInput) => Promise<AgentAccount>;
  updateAccount: (id: string, input: UpdateAgentAccountInput) => Promise<AgentAccount>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  accounts: [],

  loadAgents: async () => {
    const agents = await window.api.getAgents();
    set({ agents });
  },

  loadAccounts: async () => {
    const accounts = await window.api.getAgentAccounts();
    set({ accounts });
  },

  createAgent: async (input) => {
    const agent = await window.api.createAgent(input);
    set((s) => ({ agents: [...s.agents, agent] }));
    return agent;
  },

  updateAgent: async (id, input) => {
    const agent = await window.api.updateAgent(id, input);
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? agent : a)) }));
    return agent;
  },

  deleteAgent: async (id) => {
    await window.api.deleteAgent(id);
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
  },

  createAccount: async (input) => {
    const account = await window.api.createAgentAccount(input);
    set((s) => ({ accounts: [...s.accounts, account] }));
    return account;
  },

  updateAccount: async (id, input) => {
    const account = await window.api.updateAgentAccount(id, input);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? account : a)) }));
    return account;
  },

  deleteAccount: async (id) => {
    await window.api.deleteAgentAccount(id);
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
  }
}));
