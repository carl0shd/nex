import { create } from 'zustand';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@native/db/types';

interface TaskStore {
  tasks: Task[];

  loadTasks: () => Promise<void>;

  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  getByProject: (projectId: string) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    const tasks = await window.api.getTasks();
    set({ tasks });
  },

  createTask: async (input) => {
    const task = await window.api.createTask(input);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, input) => {
    const task = await window.api.updateTask(id, input);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t))
    }));
    return task;
  },

  deleteTask: async (id) => {
    await window.api.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  getByProject: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId);
  }
}));
