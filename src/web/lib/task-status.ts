import type { SidebarTaskStatus, SidebarWorkspace } from "@/components/sidebar/types";

export interface TaskStatusItem {
  id: string;
  title: string;
  project: string;
  status: SidebarTaskStatus;
  age: string;
}

const STATUS_ORDER: Record<SidebarTaskStatus, number> = { waiting: 0, running: 1, idle: 2 };

export const byStatus = (a: Pick<TaskStatusItem, "status">, b: Pick<TaskStatusItem, "status">) =>
  STATUS_ORDER[a.status] - STATUS_ORDER[b.status];

export function taskStatusItems(
  workspaces: readonly SidebarWorkspace[],
  askingIds: ReadonlySet<string> = new Set(),
): TaskStatusItem[] {
  return workspaces
    .flatMap((workspace) => workspace.projects)
    .flatMap((project) =>
      project.tasks.map((task) => {
        const status = askingIds.has(task.id) ? "waiting" : task.status;
        return {
          id: task.id,
          title: task.title,
          project: project.name,
          status,
          age: status === "waiting" ? "" : task.meta,
        };
      }),
    )
    .toSorted(byStatus);
}

export function statusCounts(items: readonly Pick<TaskStatusItem, "status">[]) {
  const count = (status: SidebarTaskStatus) =>
    items.filter((item) => item.status === status).length;
  return { working: count("running"), waiting: count("waiting"), idle: count("idle") };
}
