import { create } from 'zustand';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@native/db/types';

interface SessionStore {
  sessions: Session[];

  loadSessions: () => Promise<void>;

  createSession: (input: CreateSessionInput) => Promise<Session>;
  updateSession: (id: string, input: UpdateSessionInput) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;

  getByProject: (projectId: string) => Session[];
  getActive: () => Session[];
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],

  loadSessions: async () => {
    const sessions = await window.api.getSessions();
    set({ sessions });
  },

  createSession: async (input) => {
    const session = await window.api.createSession(input);
    set((s) => ({ sessions: [session, ...s.sessions] }));
    return session;
  },

  updateSession: async (id, input) => {
    const session = await window.api.updateSession(id, input);
    set((s) => ({ sessions: s.sessions.map((sess) => (sess.id === id ? session : sess)) }));
    return session;
  },

  deleteSession: async (id) => {
    await window.api.deleteSession(id);
    set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
  },

  getByProject: (projectId) => {
    return get().sessions.filter((s) => s.projectId === projectId);
  },

  getActive: () => {
    return get().sessions.filter((s) => s.status === 'active');
  }
}));
