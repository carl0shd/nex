export type SidebarTaskStatus = "running" | "waiting" | "idle";

export type SidebarTask = {
  id: string;
  title: string;
  status: SidebarTaskStatus;
  meta: string;
  env?: "starting" | "down";
};

export type SidebarProject = { id?: string; name: string; tasks: SidebarTask[] };

export type SidebarWorkspace = {
  id: string;
  name: string;
  color: string;
  image?: string;
  projects: SidebarProject[];
  expanded: boolean;
};
