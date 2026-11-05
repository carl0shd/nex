import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useRef, useState } from "react";
import { GitBranch, Link, Package, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Monogram } from "@/components/atoms/entity-chip";
import { Spinner } from "@/components/atoms/spinner";
import {
  BranchEditor,
  EnvironmentEditor,
  QuickCommandsEditor,
  WorktreeSetupEditor,
  type BranchConfig,
  type ProjectEnvironment,
  type QuickCommand,
} from "@/components/projects/project-editors";
import {
  FoundRepos,
  PickedRepo,
  RepoDropZone,
  type FoundRepo,
} from "@/components/projects/repo-picker";
import { SetupSection } from "@/components/projects/setup-section";
import {
  commandsPhrase,
  setupPhrase,
  type Phrase,
  type WorktreeSetup,
} from "@/lib/project-summary";

export interface ProjectConfig {
  branches: readonly string[];
  branch: BranchConfig;
  setup: WorktreeSetup;
  detectedFrom: readonly string[];
  commands: readonly QuickCommand[];
  environment?: ProjectEnvironment;
}

export interface NewProject {
  repo: FoundRepo;
  config: ProjectConfig;
}

type Section = "branch" | "setup" | "environment" | "commands";

const branchPhrase = (branch: BranchConfig): Phrase => [
  { text: "New tasks branch from " },
  { text: branch.base, code: true },
  { text: " as " },
  { text: `${branch.prefix}task-name`, code: true },
];

export function AddProjectDialog({
  workspace,
  found,
  detect,
  initialRepo = null,
  initialSection = null,
  onAdd,
  onCancel,
  onChooseFolder,
  onDropFolder,
  onClone,
  onPasteUrl,
  editing = false,
}: {
  editing?: boolean;
  workspace: { name: string; color: string; image?: string };
  found: readonly FoundRepo[];
  detect: (repo: FoundRepo) => ProjectConfig | Promise<ProjectConfig>;
  initialRepo?: FoundRepo | null;
  initialSection?: Section | null;
  onAdd: (project: NewProject) => void;
  onCancel: () => void;
  onChooseFolder?: () => Promise<FoundRepo | null>;
  onDropFolder?: (file: File) => Promise<FoundRepo | null>;
  onClone?: () => void;
  onPasteUrl?: () => void;
}) {
  const [repo, setRepo] = useState<FoundRepo | null>(initialRepo);
  const [config, setConfig] = useState<ProjectConfig | null>(() => {
    const detected = initialRepo ? detect(initialRepo) : null;
    return detected instanceof Promise ? null : detected;
  });
  const [open, setOpen] = useState<Section | null>(initialSection);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => dialogRef.current?.focus({ preventScroll: true }), []);
  useEffect(() => {
    if (!initialRepo || config) return;
    void Promise.resolve(detect(initialRepo)).then(setConfig);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (next: FoundRepo) => {
    setRepo(next);
    setConfig(null);
    setOpen(null);
    setConfig(await detect(next));
  };
  const chooseFolder = async () => {
    const chosen = await onChooseFolder?.();
    if (chosen) await pick(chosen);
  };
  const dropFolder = async (file: File) => {
    const dropped = await onDropFolder?.(file);
    if (dropped) await pick(dropped);
  };
  useHotkey("Mod+O", () => void chooseFolder(), {
    target: dialogRef,
    enabled: Boolean(onChooseFolder) && !repo,
  });
  const add = () => repo && config && onAdd({ repo, config });
  const toggle = (section: Section) => () =>
    setOpen((current) => (current === section ? null : section));

  useHotkey("Escape", onCancel, { target: dialogRef });
  useHotkey("Mod+Enter", add, { target: dialogRef });

  return (
    <div
      role="dialog"
      aria-label={editing && repo ? `Edit ${repo.name}` : `Add a project to ${workspace.name}`}
      ref={dialogRef}
      tabIndex={-1}
      className="enter-pop relative w-[580px] rounded-sheet outline-none bg-surface-raised shadow-modal"
      style={{ transformOrigin: "top center" }}
    >
      <div className="flex items-center gap-2.5 px-[22px] pt-5">
        <Monogram
          color={workspace.color}
          image={workspace.image}
          className="size-[22px] rounded-[6px] text-3xs"
        >
          {workspace.name[0]}
        </Monogram>
        <h2 className="m-0 text-lg font-semibold tracking-[-0.012em] text-ink">
          {editing && repo
            ? `Edit ${repo.name}`
            : repo
              ? "Add a project"
              : `Add a project to ${workspace.name}`}
        </h2>
      </div>

      {!repo ? (
        <>
          <div className="px-[22px] pt-4">
            <RepoDropZone
              onChooseFolder={onChooseFolder && (() => void chooseFolder())}
              onClone={onClone}
              onDropFolder={onDropFolder && ((file) => void dropFolder(file))}
            />
          </div>
          {found.length > 0 && (
            <div className="px-[22px] pt-[18px] pb-1">
              <FoundRepos repos={found} onPick={(next) => void pick(next)} />
            </div>
          )}
        </>
      ) : !config ? (
        <div className="flex flex-col gap-3 px-[22px] pt-4 pb-1">
          <PickedRepo repo={repo} onChange={editing ? undefined : () => setRepo(null)} />
          <span className="flex items-center gap-2 px-0.5 text-xs text-ink-3">
            <Spinner className="size-3" />
            Reading {repo.name}…
          </span>
        </div>
      ) : (
        <>
          <div className="px-[22px] pt-4">
            <PickedRepo repo={repo} onChange={editing ? undefined : () => setRepo(null)} />
          </div>
          <div className="flex flex-col px-[22px] pt-4 pb-1">
            <span className="px-0.5 pb-1.5 text-xs text-ink-3">Nex will set it up like this</span>
            <div className="-mx-2.5 flex flex-col gap-0.5">
              <SetupSection
                icon={GitBranch}
                phrase={branchPhrase(config.branch)}
                open={open === "branch"}
                onToggle={toggle("branch")}
              >
                <BranchEditor
                  value={config.branch}
                  branches={config.branches}
                  onChange={(branch) => setConfig({ ...config, branch })}
                />
              </SetupSection>
              <SetupSection
                icon={config.environment ? Sparkles : Package}
                phrase={setupPhrase(config.setup)}
                open={open === "setup"}
                onToggle={toggle("setup")}
              >
                <WorktreeSetupEditor
                  value={config.setup}
                  detectedFrom={config.detectedFrom}
                  onChange={(setup) => setConfig({ ...config, setup })}
                />
              </SetupSection>
              {config.environment && (
                <SetupSection
                  icon={Package}
                  phrase={[{ text: "Each task runs in its own environment" }]}
                  open={open === "environment"}
                  onToggle={toggle("environment")}
                >
                  <EnvironmentEditor value={config.environment} />
                </SetupSection>
              )}
              <SetupSection
                icon={Play}
                phrase={commandsPhrase(
                  config.commands.filter((command) => command.on).map((command) => command.name),
                )}
                open={open === "commands"}
                onToggle={toggle("commands")}
              >
                <QuickCommandsEditor
                  value={config.commands}
                  onChange={(commands) => setConfig({ ...config, commands })}
                />
              </SetupSection>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-2 px-[22px] pt-3.5 pb-5">
        {!repo && onPasteUrl && (
          <Button variant="quiet" size="sm" onClick={onPasteUrl}>
            <Link width={12} height={12} strokeWidth={2.25} />
            Paste a git URL
          </Button>
        )}
        <span className="ml-auto" />
        <Button size="sm" className="h-8" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          kbd="⌘↵"
          className="h-8"
          disabled={!repo || !config}
          onClick={add}
        >
          {editing ? "Save" : repo ? `Add ${repo.name}` : "Add project"}
        </Button>
      </div>
    </div>
  );
}
