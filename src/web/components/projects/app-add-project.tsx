import { useEffect, useState } from "react";
import { Overlay } from "@/components/primitives/overlay";
import type { Project } from "@native/db/types";
import {
  AddProjectDialog,
  type NewProject,
  type ProjectConfig,
} from "@/components/projects/add-project-dialog";
import type { FoundRepo } from "@/components/projects/repo-picker";
import { notifyCompact } from "@/lib/notify";
import { projectConfig } from "@/lib/project-detect";
import { repoAt } from "@/lib/repo-at";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

async function chooseFolder(): Promise<FoundRepo | null> {
  const path = await window.api.pickDirectory();
  return path ? repoAt(path) : null;
}

function dropFolder(file: File): Promise<FoundRepo | null> {
  return repoAt(window.api.pathForFile(file));
}

function savedConfig(project: Project, detected: ProjectConfig): ProjectConfig {
  const saved = project.quickCommands.map((command) => ({ ...command, on: true }));
  const names = new Set(saved.map((command) => command.name));
  return {
    ...detected,
    branch: { ...detected.branch, prefix: project.branchPrefix },
    commands: [
      ...saved,
      ...detected.commands
        .filter((command) => !names.has(command.name))
        .map((command) => ({ ...command, on: false })),
    ],
  };
}

const inspected = new Map<string, ProjectConfig>();

async function inspect(path: string): Promise<ProjectConfig> {
  const config = projectConfig(await window.api.inspectRepo(path));
  inspected.set(path, config);
  return config;
}

function useInspected(path: string | undefined): boolean {
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    void inspect(path).then(() => !cancelled && setReady(path));
    return () => {
      cancelled = true;
    };
  }, [path]);
  return Boolean(path && (ready === path || inspected.has(path)));
}

export function AppAddProject() {
  const projectId = useAddProjectStore((s) => s.projectId);
  const editing = useWorkspaceStore((s) => s.projects.find((item) => item.id === projectId));
  const workspaceId = useAddProjectStore((s) => s.workspaceId) ?? editing?.workspaceId;
  const hide = useAddProjectStore((s) => s.hide);
  const droppedRepo = useAddProjectStore((s) => s.repo);
  const workspace = useWorkspaceStore((s) => s.workspaces.find((item) => item.id === workspaceId));
  const createProject = useWorkspaceStore((s) => s.createProject);
  const updateProject = useWorkspaceStore((s) => s.updateProject);
  const editingReady = useInspected(editing?.path);
  if (!workspace || (editing && !editingReady)) return null;

  const save = async ({ config }: NewProject) => {
    if (!editing) return;
    hide();
    try {
      await updateProject(editing.id, {
        branchPrefix: config.branch.prefix,
        quickCommands: config.commands
          .filter((command) => command.on)
          .map(({ name, command }) => ({ name, command })),
      });
      notifyCompact({ tone: "green", title: `${editing.name} saved` });
    } catch {
      notifyCompact({ tone: "red", title: `Couldn’t save ${editing.name}` });
    }
  };

  const add = async ({ repo, config }: NewProject) => {
    hide();
    try {
      await createProject({
        workspaceId: workspace.id,
        name: repo.name,
        path: repo.path,
        branchPrefix: config.branch.prefix,
        quickCommands: config.commands
          .filter((command) => command.on)
          .map(({ name, command }) => ({ name, command })),
      });
      notifyCompact({ tone: "green", title: `${repo.name} added to ${workspace.name}` });
    } catch {
      notifyCompact({ tone: "red", title: `Couldn’t add ${repo.name}` });
    }
  };

  return (
    <Overlay offset={138} onClose={hide}>
      <AddProjectDialog
        key={editing?.id ?? workspace.id}
        editing={Boolean(editing)}
        workspace={{
          name: workspace.name,
          color: workspace.color,
          image: workspaceImageUrl(workspace.customImage),
        }}
        found={[]}
        initialRepo={
          editing ? { name: editing.name, path: editing.path, branch: "", active: "" } : droppedRepo
        }
        detect={(repo) => {
          const cached = editing ? inspected.get(repo.path) : undefined;
          if (editing && cached) return savedConfig(editing, cached);
          return inspect(repo.path).then((detected) =>
            editing ? savedConfig(editing, detected) : detected,
          );
        }}
        onChooseFolder={chooseFolder}
        onDropFolder={dropFolder}
        onAdd={(project) => void (editing ? save(project) : add(project))}
        onCancel={hide}
      />
    </Overlay>
  );
}
