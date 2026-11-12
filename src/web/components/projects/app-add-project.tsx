import { useEffect, useState } from "react";
import { Overlay } from "@/components/primitives/overlay";
import type { Project, ProjectEnvironment } from "@native/db/types";
import { CleanBaseFailedDialog } from "@/components/environment/clean-base-failed-dialog";
import {
  AddProjectDialog,
  type NewProject,
  type ProjectConfig,
} from "@/components/projects/add-project-dialog";
import type { FoundRepo } from "@/components/projects/repo-picker";
import { AppCloneRepo } from "@/components/projects/app-clone-repo";
import { failureSteps } from "@/lib/clean-base";
import { relativeTime } from "@/lib/relative-time";
import { notifyCompact } from "@/lib/notify";
import { projectConfig } from "@/lib/project-detect";
import { repoAt } from "@/lib/repo-at";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { workspaceIcon } from "@/lib/workspace-icons";

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
  const base = project.baseBranch || detected.branch.base;
  return {
    ...detected,
    branches: [base, ...detected.branches.filter((branch) => branch !== base)],
    branch: { base, prefix: project.branchPrefix, pull: project.pullBase },
    setup: project.setup ?? detected.setup,
    environment: project.environment ?? detected.environment,
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
  const [inspection, environment] = await Promise.all([
    window.api.inspectRepo(path),
    window.api.detectEnvironment(path),
  ]);
  const config = { ...projectConfig(inspection), environment };
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

function projectSettings(config: ProjectConfig) {
  return {
    branchPrefix: config.branch.prefix,
    baseBranch: config.branch.base,
    pullBase: config.branch.pull,
    setup: { ...config.setup, copy: { ...config.setup.copy, files: [...config.setup.copy.files] } },
    ...(config.environment ? { environment: config.environment } : {}),
  };
}

function useLocalRepos(enabled: boolean): { repos: FoundRepo[]; cloneParent: string } {
  const projects = useWorkspaceStore((s) => s.projects);
  const [local, setLocal] = useState<{ repos: FoundRepo[]; cloneParent: string }>({
    repos: [],
    cloneParent: "",
  });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void window.api.findLocalRepos(projects.map((project) => project.path)).then((found) => {
      if (cancelled) return;
      const now = Date.now();
      setLocal({
        cloneParent: found.cloneParent,
        repos: found.repos.map((repo) => ({
          name: repo.name,
          path: repo.path,
          branch: repo.branch,
          active: relativeTime(repo.activeAt, now),
        })),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, projects]);
  return local;
}

function useEnvironmentSupport() {
  const status = useEnvironmentsStore((s) => s.status);
  const load = useEnvironmentsStore((s) => s.load);
  useEffect(() => {
    if (!status) load();
  }, [status, load]);
  return {
    supported: status?.supported !== false,
    canCheck: Boolean(status?.enabled && status.runtime.running),
  };
}

function useCleanBase(project: Project | undefined) {
  const base = useEnvironmentsStore((s) => (project ? s.bases[project.id] : undefined));
  const loadBase = useEnvironmentsStore((s) => s.loadBase);
  const buildBase = useEnvironmentsStore((s) => s.buildBase);
  const stopBase = useEnvironmentsStore((s) => s.stopBase);
  const updateProject = useWorkspaceStore((s) => s.updateProject);
  const id = project?.id;
  useEffect(() => {
    if (id) loadBase(id);
  }, [id, loadBase]);
  if (!project) return null;
  return {
    state: base ?? null,
    build: async (environment: ProjectEnvironment) => {
      await updateProject(project.id, { environment });
      buildBase(project.id, environment);
    },
    stop: () => stopBase(project.id),
  };
}

export function AppAddProject({ fullWindow = false }: { fullWindow?: boolean }) {
  const projectId = useAddProjectStore((s) => s.projectId);
  const editing = useWorkspaceStore((s) => s.projects.find((item) => item.id === projectId));
  const workspaceId = useAddProjectStore((s) => s.workspaceId) ?? editing?.workspaceId;
  const hide = useAddProjectStore((s) => s.hide);
  const droppedRepo = useAddProjectStore((s) => s.repo);
  const cloneMode = useAddProjectStore((s) => s.clone);
  const initialSection = useAddProjectStore((s) => s.section);
  const checks = useEnvironmentsStore((s) => s.checks);
  const startCheck = useEnvironmentsStore((s) => s.startCheck);
  const stopCheck = useEnvironmentsStore((s) => s.stopCheck);
  const environments = useEnvironmentSupport();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((item) => item.id === workspaceId));
  const createProject = useWorkspaceStore((s) => s.createProject);
  const updateProject = useWorkspaceStore((s) => s.updateProject);
  const editingReady = useInspected(editing?.path);
  const local = useLocalRepos(!editing && Boolean(workspace));
  const cleanBase = useCleanBase(editing);
  const [showFailure, setShowFailure] = useState(false);
  if (!workspace || (editing && !editingReady)) return null;
  const failedBase = cleanBase?.state?.status === "failed" ? cleanBase.state : null;
  const shown = (config: ProjectConfig): ProjectConfig =>
    environments.supported ? config : { ...config, environment: undefined };

  const save = async ({ config }: NewProject) => {
    if (!editing) return;
    hide();
    try {
      await updateProject(editing.id, {
        ...projectSettings(config),
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
        ...projectSettings(config),
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
    <Overlay offset={138} fullWindow={fullWindow} onClose={hide}>
      <AddProjectDialog
        key={editing?.id ?? `${workspace.id}-${cloneMode ?? "local"}`}
        editing={Boolean(editing)}
        workspace={{
          name: workspace.name,
          color: workspace.color,
          image: workspaceImageUrl(workspace.customImage),
          icon: workspaceIcon(workspace.icon),
        }}
        found={editing ? [] : local.repos}
        clone={(mode, onCloned, onBack) => (
          <AppCloneRepo
            mode={mode}
            parent={local.cloneParent}
            onCloned={onCloned}
            onBack={onBack}
          />
        )}
        initialClone={editing ? null : cloneMode}
        initialSection={initialSection}
        environmentChecks={checks}
        canCheckEnvironment={environments.canCheck}
        onCheckEnvironment={(repo, environment) =>
          startCheck({ projectPath: repo.path, projectName: repo.name, environment })
        }
        onStopEnvironmentCheck={(repo) => stopCheck(repo.path)}
        onDetectEnvironment={(repo) => window.api.detectEnvironment(repo.path)}
        cleanBase={cleanBase?.state ?? null}
        onBuildCleanBase={
          cleanBase ? (environment) => void cleanBase.build(environment) : undefined
        }
        onStopCleanBase={cleanBase?.stop}
        onShowCleanBaseFailure={() => setShowFailure(true)}
        initialRepo={
          editing ? { name: editing.name, path: editing.path, branch: "", active: "" } : droppedRepo
        }
        detect={(repo) => {
          const cached = editing ? inspected.get(repo.path) : undefined;
          if (editing && cached) return shown(savedConfig(editing, cached));
          return inspect(repo.path).then((detected) =>
            shown(editing ? savedConfig(editing, detected) : detected),
          );
        }}
        onChooseFolder={chooseFolder}
        onDropFolder={dropFolder}
        onAdd={(project) => void (editing ? save(project) : add(project))}
        onCancel={hide}
      />
      {showFailure && failedBase && editing && cleanBase && (
        <Overlay fullWindow onClose={() => setShowFailure(false)}>
          <CleanBaseFailedDialog
            failure={{
              project: editing.name,
              steps: failureSteps(failedBase),
              error: failedBase.error ?? "The last build didn’t finish.",
            }}
            onClose={() => setShowFailure(false)}
            onViewLog={() => void window.api.showEnvironmentLog()}
            onEditSetup={() => setShowFailure(false)}
            onRetry={() => {
              setShowFailure(false);
              if (editing.environment) void cleanBase.build(editing.environment);
            }}
          />
        </Overlay>
      )}
    </Overlay>
  );
}
