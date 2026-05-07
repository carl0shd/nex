import { create } from 'zustand';
import type { Terminal, CreateTerminalInput, TerminalStatus, TerminalType } from '@native/db/types';
import { clearXtermSnapshot } from '@/lib/xterm-snapshot-cache';

interface TerminalStore {
  terminals: Terminal[];
  activeBySession: Record<string, string>;

  loadTerminals: () => Promise<void>;
  createTerminal: (input: CreateTerminalInput) => Promise<Terminal>;
  createSessionTerminal: (
    sessionId: string,
    type: TerminalType,
    options?: { name?: string; runCommand?: string }
  ) => Promise<Terminal>;
  deleteTerminal: (id: string) => Promise<void>;
  setActive: (sessionId: string, terminalId: string) => void;
  setStatus: (id: string, status: TerminalStatus) => void;
}

function pickActive(terminals: Terminal[], sessionId: string): string | undefined {
  const list = terminals.filter((t) => t.sessionId === sessionId);
  if (list.length === 0) return undefined;
  return (list.find((t) => t.isPrimary) ?? list[0]).id;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  terminals: [],
  activeBySession: {},

  loadTerminals: async () => {
    const terminals = await window.api.getTerminals();
    const activeBySession: Record<string, string> = {};
    const seen = new Set<string>();
    for (const term of terminals) {
      if (seen.has(term.sessionId)) continue;
      const active = pickActive(terminals, term.sessionId);
      if (active) {
        activeBySession[term.sessionId] = active;
        seen.add(term.sessionId);
      }
    }
    set({ terminals, activeBySession });
  },

  createTerminal: async (input) => {
    const terminal = await window.api.createTerminal(input);
    set((s) => ({
      terminals: [...s.terminals, terminal],
      activeBySession: { ...s.activeBySession, [terminal.sessionId]: terminal.id }
    }));
    return terminal;
  },

  createSessionTerminal: async (sessionId, type, options) => {
    const terminal = await window.api.createSessionTerminal({
      sessionId,
      type,
      name: options?.name,
      runCommand: options?.runCommand
    });
    set((s) => ({
      terminals: [...s.terminals, terminal],
      activeBySession: { ...s.activeBySession, [sessionId]: terminal.id }
    }));
    return terminal;
  },

  deleteTerminal: async (id) => {
    await window.api.deleteTerminal(id);
    clearXtermSnapshot(id);
    set((s) => {
      const removed = s.terminals.find((t) => t.id === id);
      const terminals = s.terminals.filter((t) => t.id !== id);
      const activeBySession = { ...s.activeBySession };
      if (removed && activeBySession[removed.sessionId] === id) {
        const next = pickActive(terminals, removed.sessionId);
        if (next) activeBySession[removed.sessionId] = next;
        else delete activeBySession[removed.sessionId];
      }
      return { terminals, activeBySession };
    });
  },

  setActive: (sessionId, terminalId) => {
    set((s) => ({ activeBySession: { ...s.activeBySession, [sessionId]: terminalId } }));
  },

  setStatus: (id, status) => {
    set((s) => {
      let changed = false;
      const terminals = s.terminals.map((t) => {
        if (t.id !== id || t.status === status) return t;
        changed = true;
        return { ...t, status };
      });
      return changed ? { terminals } : s;
    });
  }
}));
