import { useHotkey } from "@tanstack/react-hotkeys";
import type { CloneMode } from "@/components/projects/clone-repo-panel";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GitBranch, Link, Package, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Monogram } from "@/components/atoms/entity-chip";
import { Spinner } from "@/components/atoms/spinner";
import type { ProjectEnvironment } from "@native/db/types";
import type { EnvCheckState } from "@native/environments/types";
import { EnvironmentEditor } from "@/components/projects/environment-editor";
import {
  BranchEditor,
  QuickCommandsEditor,
  WorktreeSetupEditor,
  type BranchConfig,
  type QuickCommand,
} from "@/components/projects/project-editors";
import {
  FoundRepos,
  PickedRepo,
  RepoDropZone,
  type FoundRepo,
} from "@/components/projects/repo-picker";
import { SetupSection } from "@/components/projects/setup-section";
import { environmentPhrase } from "@/lib/project-environment";
import {
  commandsPhrase,
  setupPhrase,
  type Phrase,
  type WorktreeSetup,
} from "@/lib/project-summary";
import type { WorkspaceIconName } from "@/lib/workspace-icons";

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

export type ProjectSection = "branch" | "setup" | "environment" | "commands";

const branchPhrase = (branch: BranchConfig): Phrase => [
  { text: "New tasks branch from " },
  { text: branch.base, name: true },
  { text: " as " },
  { text: `${branch.prefix}task-name`, name: true },
];

export function AddProjectDialog({
  workspace,
  found,
  detect,
  initialRepo = null,
  initialSection = null,
  initialClone = null,
  onAdd,
  onCancel,
  onChooseFolder,
  onDropFolder,
  clone,
  editing = false,
  environmentChecks = {},
  canCheckEnvironment = false,
  onCheckEnvironment,
  onStopEnvironmentCheck,
  onDetectEnvironment,
}: {
  editing?: boolean;
  workspace: { name: string; color: string; image?: string; icon?: WorkspaceIconName };
  found: readonly FoundRepo[];
  detect: (repo: FoundRepo) => ProjectConfig | Promise<ProjectConfig>;
  initialRepo?: FoundRepo | null;
  initialSection?: ProjectSection | null;
  initialClone?: CloneMode | null;
  onAdd: (project: NewProject) => void;
  onCancel: () => void;
  onChooseFolder?: () => Promise<FoundRepo | null>;
  onDropFolder?: (file: File) => Promise<FoundRepo | null>;
  clone?: (mode: CloneMode, onCloned: (repo: FoundRepo) => void, onBack: () => void) => ReactNode;
  environmentChecks?: Readonly<Record<string, EnvCheckState>>;
  canCheckEnvironment?: boolean;
  onCheckEnvironment?: (repo: FoundRepo, environment: ProjectEnvironment) => void;
  onStopEnvironmentCheck?: (repo: FoundRepo) => void;
  onDetectEnvironment?: (repo: FoundRepo) => Promise<ProjectEnvironment>;
}) {
  const [cloning, setCloning] = useState<CloneMode | null>(initialClone);
  const [repo, setRepo] = useState<FoundRepo | null>(initialRepo);
  const [config, setConfig] = useState<ProjectConfig | null>(() => {
    const detected = initialRepo ? detect(initialRepo) : null;
    return detected instanceof Promise ? null : detected;
  });
  const [open, setOpen] = useState<ProjectSection | null>(initialSection);
  const [detecting, setDetecting] = useState(false);
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
  const detectAgain = async () => {
    if (!repo || !onDetectEnvironment) return;
    setDetecting(true);
    try {
      const environment = await onDetectEnvironment(repo);
      setConfig((current) => current && { ...current, environment });
    } finally {
      setDetecting(false);
    }
  };
  const toggle = (section: ProjectSection) => () =>
    setOpen((current) => (current === section ? null : section));

  useHotkey("Escape", onCancel, { target: dialogRef });
  useHotkey("Mod+Enter", add, { target: dialogRef });

  return (
    <div
      role="dialog"
      aria-label={editing && repo ? `Edit ${repo.name}` : `Add a project to ${workspace.name}`}
      ref={dialogRef}
      tabIndex={-1}
      className="enter-pop relative flex max-h-[min(100%,680px)] w-[580px] flex-col rounded-sheet bg-surface-raised shadow-modal outline-none"
      style={{ transformOrigin: "top center" }}
    >
      <div className="flex shrink-0 items-center gap-2.5 px-[22px] pt-5 pb-1">
        <Monogram
          color={workspace.color}
          image={workspace.image}
          icon={workspace.icon}
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

      <div className="quiet-scroll min-h-0 flex-1 overflow-y-auto pt-3">
        {!repo && cloning && clone ? (
          <div className="px-[22px]">
            {clone(
              cloning,
              (next) => {
                setCloning(null);
                void pick(next);
              },
              () => setCloning(null),
            )}
          </div>
        ) : !repo ? (
          <>
            <div className="px-[22px]">
              <RepoDropZone
                onChooseFolder={onChooseFolder && (() => void chooseFolder())}
                onClone={clone && (() => setCloning("github"))}
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
          <div className="flex flex-col gap-3 px-[22px] pb-1">
            <PickedRepo repo={repo} onChange={editing ? undefined : () => setRepo(null)} />
            <span className="flex items-center gap-2 px-0.5 text-xs text-ink-3">
              <Spinner className="size-3" />
              Reading {repo.name}…
            </span>
          </div>
        ) : (
          <>
            <div className="px-[22px]">
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
                  phrase={setupPhrase(config.setup, Boolean(config.environment?.services.length))}
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
                    phrase={environmentPhrase(config.environment, repo.name)}
                    open={open === "environment"}
                    onToggle={toggle("environment")}
                  >
                    <EnvironmentEditor
                      value={config.environment}
                      onChange={(environment) => setConfig({ ...config, environment })}
                      check={environmentChecks[repo.path] ?? null}
                      canCheck={canCheckEnvironment}
                      onCheck={
                        onCheckEnvironment &&
                        (() => config.environment && onCheckEnvironment(repo, config.environment))
                      }
                      onStopCheck={onStopEnvironmentCheck && (() => onStopEnvironmentCheck(repo))}
                      onDetectAgain={onDetectEnvironment && (() => void detectAgain())}
                      detecting={detecting}
                    />
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
      </div>

      <div className="flex shrink-0 items-center gap-2 px-[22px] pt-3.5 pb-5">
        {!repo && !cloning && clone && (
          <Button variant="quiet" size="sm" onClick={() => setCloning("url")}>
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
