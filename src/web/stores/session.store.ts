import { create } from 'zustand';
import type { Session, CreateSessionInput, UpdateSessionInput } from '@native/db/types';

interface SessionStore {
  sessions: Session[];

  loadSessions: () => Promise<void>;

  createSession: (input: CreateSessionInput) => Promise<Session>;
  updateSession: (id: string, input: UpdateSessionInput) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  reorderSessions: (orderedIds: string[]) => Promise<void>;

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

  reorderSessions: async (orderedIds) => {
    set((s) => {
      const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
      const sessions = s.sessions
        .map((sess) =>
          orderMap.has(sess.id)
            ? { ...sess, sortOrder: orderMap.get(sess.id) ?? sess.sortOrder }
            : sess
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return { sessions };
    });
    await window.api.reorderSessions(orderedIds);
  },

  getByProject: (projectId) => {
    return get().sessions.filter((s) => s.projectId === projectId);
  },

  getActive: () => {
    return get().sessions.filter((s) => s.status === 'active');
  }
}));
