import { useEffect, useState } from "react";
import type { RepoInspection } from "@native/git/inspect";
import { AppCloneRepo } from "@/components/projects/app-clone-repo";
import { ProjectStep, type ProjectDraft } from "@/components/onboarding/project-step";
import { notifyCompact } from "@/lib/notify";
import { projectConfig } from "@/lib/project-detect";
import { useWorkspaceStore } from "@/stores/workspace.store";

interface Picked {
  inspection: RepoInspection;
  draft: ProjectDraft;
  commands: Record<string, string>;
}

function pick(inspection: RepoInspection): Picked {
  const config = projectConfig(inspection);
  return {
    inspection,
    draft: {
      name: inspection.name,
      path: inspection.path,
      branch: inspection.baseBranch ?? "",
      clean: inspection.clean,
      branchPrefix: config.branch.prefix,
      commands: config.commands.map(({ name, on }) => ({ name, on })),
    },
    commands: Object.fromEntries(config.commands.map(({ name, command }) => [name, command])),
  };
}

export function AppProjectStep({
  workspaceId,
  projectId,
  onBack,
  onSkip,
  onContinue,
}: {
  workspaceId: string;
  projectId: string | null;
  onBack: () => void;
  onSkip: () => void;
  onContinue: (projectId: string) => void;
}) {
  const createProject = useWorkspaceStore((s) => s.createProject);
  const updateProject = useWorkspaceStore((s) => s.updateProject);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneParent, setCloneParent] = useState("");
  useEffect(() => {
    let cancelled = false;
    void window.api
      .findLocalRepos([])
      .then((found) => !cancelled && setCloneParent(found.cloneParent));
    return () => {
      cancelled = true;
    };
  }, []);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  const read = async (path: string | null) => {
    if (!path) return;
    setReading(true);
    const inspection = await window.api.inspectRepo(path);
    setReading(false);
    if (!inspection.git) {
      notifyCompact({ tone: "orange", title: `${inspection.name} isn’t a git repo` });
      return;
    }
    setPicked(pick(inspection));
  };

  const add = async () => {
    if (!picked) return;
    const { draft, commands, inspection } = picked;
    const { setup } = projectConfig(inspection);
    const input = {
      name: draft.name,
      path: draft.path,
      branchPrefix: draft.branchPrefix,
      setup: { ...setup, copy: { ...setup.copy, files: [...setup.copy.files] } },
      quickCommands: draft.commands
        .filter((command) => command.on)
        .map(({ name }) => ({ name, command: commands[name] })),
    };
    setSaving(true);
    try {
      if (projectId) {
        await updateProject(projectId, input);
        onContinue(projectId);
      } else {
        const project = await createProject({ workspaceId, ...input });
        onContinue(project.id);
      }
    } catch {
      setSaving(false);
      notifyCompact({ tone: "red", title: `Couldn’t add ${draft.name}` });
    }
  };

  return (
    <ProjectStep
      project={picked?.draft ?? null}
      onChange={(draft) => picked && setPicked({ ...picked, draft })}
      onChooseFolder={() => void window.api.pickDirectory().then(read)}
      onDropFolder={(file) => void read(window.api.pathForFile(file))}
      onClone={() => setCloning(true)}
      cloning={
        cloning && (
          <AppCloneRepo
            mode="github"
            parent={cloneParent}
            onCloned={(repo) => {
              setCloning(false);
              void read(repo.path);
            }}
            onBack={() => setCloning(false)}
          />
        )
      }
      reading={reading}
      saving={saving}
      onBack={onBack}
      onSkip={onSkip}
      onAdd={() => void add()}
    />
  );
}
