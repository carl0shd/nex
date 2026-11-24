import { useEffect, useState } from "react";
import { Code, FolderOpen, FolderPlus, PanelLeft, Plus, SunMoon } from "lucide-react";
import {
  CommandPalette,
  type CommandGroup,
  type CommandItem,
  type CommandTaskStatus,
} from "@/components/command/command-palette";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { shortcutLabel } from "@/lib/app-shortcuts";
import { notifyCompact } from "@/lib/notify";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useCommandPaletteStore } from "@/stores/command-palette.store";
import { useNewTaskStore } from "@/stores/new-task.store";
import { usePermissionStore } from "@/stores/permission.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOpenWithApps } from "@/hooks/use-open-with-apps";
import { appShortName } from "@/components/settings/settings-values";
import { shownSessions } from "@/lib/sidebar-model";

const FILE_RESULTS = 8;
const PROJECT_RESULTS = 6;
const AGENT_STATUS: Record<string, CommandTaskStatus> = {
  running: "working",
  waiting: "waiting",
  idle: "idle",
};

type ActionId = "new-task" | "new-project" | "ide" | "finder" | "theme" | "sidebar";

function openInEditor(app: string, path: string) {
  void window.api.openWith(app, path).then((opened) => {
    if (!opened) notifyCompact({ tone: "red", title: `Couldn’t open ${app}` });
  });
}

function useWorktreeFiles(path: string | null, enabled: boolean): string[] {
  const [files, setFiles] = useState<{ path: string; list: string[] } | null>(null);
  useEffect(() => {
    if (!enabled || !path) return;
    let cancelled = false;
    void window.api
      .listWorktreeFiles(path)
      .then((entries) => {
        if (cancelled) return;
        const list = entries.filter((entry) => entry.type === "file").map((entry) => entry.path);
        setFiles({ path, list });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [path, enabled]);
  return files?.path === path ? files.list : [];
}

export function AppCommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const hide = useCommandPaletteStore((s) => s.hide);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const projects = useWorkspaceStore((s) => s.projects);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const terminals = useWorkspaceStore((s) => s.terminals);
  const activeTaskId = useWorkspaceStore((s) => s.activeTaskId);
  const openTask = useWorkspaceStore((s) => s.openTask);
  const requests = usePermissionStore((s) => s.requests);
  const showNewTask = useNewTaskStore((s) => s.show);
  const showAddProject = useAddProjectStore((s) => s.show);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const { editor } = useOpenWithApps();
  useAppHotkey("palette", toggle);

  const activeTask = sessions.find((session) => session.id === activeTaskId) ?? null;
  const files = useWorktreeFiles(activeTask?.worktreePath ?? null, open);
  if (!open) return null;

  const statusOf = (sessionId: string): CommandTaskStatus => {
    if (requests.some((request) => request.sessionId === sessionId)) return "waiting";
    const agent = terminals.find(
      (terminal) => terminal.sessionId === sessionId && terminal.type === "agent",
    );
    return AGENT_STATUS[agent?.status ?? "idle"] ?? "idle";
  };
  const projectOf = (projectId: string) => projects.find((project) => project.id === projectId);
  const taskName = activeTask ? activeTask.title || activeTask.name : "";
  const workspaceForProject =
    projectOf(activeTask?.projectId ?? "")?.workspaceId ?? workspaces[0]?.id ?? null;

  const actions: (CommandItem & { kind: "action" })[] = [
    {
      kind: "action",
      id: "new-task",
      label: "New task",
      icon: Plus,
      kbd: shortcutLabel("new-task"),
    },
    ...(workspaceForProject
      ? [{ kind: "action" as const, id: "new-project", label: "New project", icon: FolderPlus }]
      : []),
    ...(activeTask
      ? [
          ...(editor
            ? [
                {
                  kind: "action" as const,
                  id: "ide",
                  label: `Open task in ${appShortName(editor)}`,
                  icon: Code,
                  keywords: ["IDE", "editor", editor],
                },
              ]
            : []),
          { kind: "action" as const, id: "finder", label: "Open task in Finder", icon: FolderOpen },
        ]
      : []),
    { kind: "action", id: "theme", label: "Toggle light / dark", icon: SunMoon },
    {
      kind: "action",
      id: "sidebar",
      label: "Show or hide the sidebar",
      icon: PanelLeft,
      kbd: shortcutLabel("sidebar"),
    },
  ];

  const workspaceName = (workspaceId: string) =>
    workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? "";

  const groups: CommandGroup[] = [
    {
      id: "tasks",
      label: "Tasks",
      items: shownSessions({ workspaces, projects, sessions }).map((session) => ({
        kind: "task",
        id: session.id,
        label: session.title || session.name,
        project: projectOf(session.projectId)?.name ?? "",
        status: statusOf(session.id),
        keywords: [session.branch, projectOf(session.projectId)?.name ?? ""],
      })),
    },
    {
      id: "projects",
      label: "Projects",
      onlyWhenSearching: true,
      limit: PROJECT_RESULTS,
      items: projects
        .filter((project) =>
          workspaces.some(
            (workspace) => workspace.id === project.workspaceId && !workspace.archived,
          ),
        )
        .map((project) => ({
          kind: "project" as const,
          id: project.id,
          label: project.name,
          workspace: workspaceName(project.workspaceId),
          keywords: [workspaceName(project.workspaceId)],
        })),
    },
    ...(activeTask
      ? [
          {
            id: "files",
            label: `Files in ${taskName}`,
            onlyWhenSearching: true,
            limit: FILE_RESULTS,
            items: files.map((path) => ({ kind: "file" as const, id: path, label: path })),
          },
        ]
      : []),
    { id: "actions", label: "Actions", items: actions },
  ];

  const runAction = (id: ActionId) => {
    if (id === "new-task") showNewTask(activeTask?.projectId);
    if (id === "new-project" && workspaceForProject) showAddProject(workspaceForProject);
    if (id === "ide" && activeTask && editor) openInEditor(editor, activeTask.worktreePath);
    if (id === "finder" && activeTask) void window.api.openInFinder(activeTask.worktreePath);
    if (id === "theme") setTheme(resolvedTheme === "dark" ? "light" : "dark");
    if (id === "sidebar") toggleSidebar();
  };

  return (
    <CommandPalette
      groups={groups}
      onClose={hide}
      onSelect={({ item }) => {
        hide();
        if (item.kind === "task") openTask(item.id);
        if (item.kind === "project") showNewTask(item.id);
        if (item.kind === "file" && activeTask) openTask(activeTask.id, `@${item.label} `);
        if (item.kind === "action") runAction(item.id as ActionId);
      }}
    />
  );
}
