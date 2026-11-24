import type { WorkspaceIconName } from "@/lib/workspace-icons";

export type SidebarTaskStatus = "running" | "waiting" | "idle";

export type SidebarTask = {
  id: string;
  title: string;
  status: SidebarTaskStatus;
  meta: string;
  env?: "starting" | "down";
  minimized?: boolean;
};

export type SidebarProject = { id?: string; name: string; tasks: SidebarTask[] };

export type SidebarWorkspace = {
  id: string;
  name: string;
  color: string;
  image?: string;
  icon?: WorkspaceIconName;
  projects: SidebarProject[];
  expanded: boolean;
};

export type HiddenWorkspace = Pick<SidebarWorkspace, "id" | "name" | "color" | "image" | "icon">;
