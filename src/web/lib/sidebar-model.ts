import type { Project, Session, Terminal, TerminalStatus, Workspace } from "@native/db/types";
import type { SidebarTaskStatus, SidebarWorkspace } from "@/components/sidebar/types";
import { workspaceIcon } from "@/lib/workspace-icons";
import { workspaceImageUrl } from "@/lib/workspace-image";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function shortAge(then: number, now: number): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  return `${Math.floor(elapsed / DAY)}d`;
}

export function taskStatus(statuses: readonly (TerminalStatus | null)[]): SidebarTaskStatus {
  if (statuses.includes("waiting")) return "waiting";
  if (statuses.includes("running")) return "running";
  return "idle";
}

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

export interface SidebarSource {
  workspaces: readonly Workspace[];
  projects: readonly Project[];
  sessions: readonly Session[];
  terminals: readonly Pick<Terminal, "sessionId" | "type" | "status">[];
}

export function buildSidebar(source: SidebarSource, now: number): SidebarWorkspace[] {
  const agentStatuses = new Map<string, (TerminalStatus | null)[]>();
  for (const terminal of source.terminals) {
    if (terminal.type !== "agent") continue;
    agentStatuses.set(terminal.sessionId, [
      ...(agentStatuses.get(terminal.sessionId) ?? []),
      terminal.status,
    ]);
  }

  return source.workspaces
    .filter((workspace) => !workspace.archived)
    .toSorted(bySortOrder)
    .map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      color: workspace.color,
      image: workspaceImageUrl(workspace.customImage),
      icon: workspaceIcon(workspace.icon),
      expanded: !workspace.collapsed,
      projects: source.projects
        .filter((project) => project.workspaceId === workspace.id)
        .toSorted(bySortOrder)
        .map((project) => ({
          id: project.id,
          name: project.name,
          tasks: source.sessions
            .filter((session) => session.projectId === project.id && session.status !== "done")
            .toSorted(bySortOrder)
            .map((session) => {
              const status = taskStatus(agentStatuses.get(session.id) ?? []);
              return {
                id: session.id,
                title: session.title || session.name,
                status,
                meta:
                  status === "waiting"
                    ? "needs you"
                    : shortAge(Date.parse(session.lastOpened), now),
              };
            }),
        })),
    }));
}

export function workspaceSummary(workspace: SidebarWorkspace): string {
  const tasks = workspace.projects.flatMap((project) => project.tasks);
  const working = tasks.filter((task) => task.status === "running").length;
  const waiting = tasks.filter((task) => task.status === "waiting").length;
  const parts = [working > 0 && `${working} working`, waiting > 0 && `${waiting} needs you`].filter(
    Boolean,
  );
  if (parts.length > 0) return parts.join(" · ");
  return tasks.length > 0 ? `${tasks.length} idle` : "No tasks";
}
