import { create } from "zustand";
import type { PermissionAnswer, PermissionRequest } from "@native/agents/permissions";

interface PermissionStore {
  requests: PermissionRequest[];
  answering: string[];
  start: () => Promise<void>;
  answer: (id: string, answer: PermissionAnswer) => Promise<void>;
}

let stop: (() => void) | null = null;

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  requests: [],
  answering: [],

  start: async () => {
    stop?.();
    const offRequest = window.api.onPermissionRequest((request) =>
      set((state) => ({ requests: [...state.requests, request] })),
    );
    const offResolved = window.api.onPermissionResolved((id) =>
      set((state) => ({
        requests: state.requests.filter((request) => request.id !== id),
        answering: state.answering.filter((item) => item !== id),
      })),
    );
    stop = () => {
      offRequest();
      offResolved();
    };
    const pending = await window.api.getPendingPermissions();
    set((state) => ({
      requests: [
        ...pending.filter((request) => !state.requests.some((item) => item.id === request.id)),
        ...state.requests,
      ],
    }));
  },

  answer: async (id, answer) => {
    if (get().answering.includes(id)) return;
    set((state) => ({ answering: [...state.answering, id] }));
    await window.api.answerPermission(id, answer);
  },
}));
