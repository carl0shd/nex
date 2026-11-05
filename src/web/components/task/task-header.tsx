import { useState } from "react";
import {
  Code,
  Copy,
  Ellipsis,
  FolderOpen,
  GitBranch,
  PenLine,
  SquareTerminal,
  X,
} from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import { InlineRename } from "@/components/atoms/inline-rename";
import { StatusPill } from "@/components/atoms/status-pill";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";

export type TaskStatus = "working" | "waiting" | "idle";

export interface OpenWithAction {
  app: string;
  run: () => void;
}

export interface TaskActions {
  onRename?: (title: string) => void;
  onOpenInFinder?: () => void;
  openInEditor?: OpenWithAction;
  openInTerminal?: OpenWithAction;
  onCopyBranch?: () => void;
  onClose?: () => void;
}

const PILL = {
  working: { tone: "green", label: "Working" },
  waiting: { tone: "orange", label: "Needs you" },
  idle: { tone: "neutral", label: "Idle" },
} as const;

export function TaskHeader({
  title,
  project,
  branch,
  workspace,
  status,
  actions = {},
}: {
  title: string;
  project: string;
  branch: string;
  workspace: { name: string; color: string; image?: string };
  status: TaskStatus;
  actions?: TaskActions;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const run = (action?: () => void) => () => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line-soft pr-2 pl-4">
      <Monogram size="md" color={workspace.color} image={workspace.image}>
        {workspace.name[0]}
      </Monogram>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {renaming ? (
          <InlineRename
            label="Task name"
            name={title}
            className="-ml-1.5 h-5 flex-none rounded-[5px] text-base leading-5 font-medium"
            onDone={(next) => {
              setRenaming(false);
              if (next) actions.onRename?.(next);
            }}
          />
        ) : (
          <span title={title} className="truncate text-base leading-5 font-medium text-ink">
            {title}
          </span>
        )}
        <span className="flex min-w-0 items-center gap-[5px] text-2xs whitespace-nowrap text-ink-4">
          <span className="shrink-0">{project}</span>
          <span className="text-ink-6">/</span>
          <GitBranch width={11} height={11} strokeWidth={2.25} className="shrink-0" />
          <span title={branch} className="truncate font-mono">
            {branch}
          </span>
        </span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <StatusPill tone={PILL[status].tone}>{PILL[status].label}</StatusPill>
        <span className="w-1.5" />
        <AnchoredPopover
          open={menuOpen}
          onOpenChange={setMenuOpen}
          align="end"
          side="bottom"
          strategy="fixed"
          trigger={
            <IconButton
              aria-label="More actions"
              aria-expanded={menuOpen}
              pressed={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Ellipsis width={15} height={15} strokeWidth={2} />
            </IconButton>
          }
        >
          <Menu width={200}>
            <MenuItem icon={PenLine} onSelect={run(() => setRenaming(true))}>
              Rename
            </MenuItem>
            <MenuItem icon={FolderOpen} onSelect={run(actions.onOpenInFinder)}>
              Open in Finder
            </MenuItem>
            {actions.openInEditor && (
              <MenuItem icon={Code} onSelect={run(actions.openInEditor.run)}>
                Open in {actions.openInEditor.app}
              </MenuItem>
            )}
            {actions.openInTerminal && (
              <MenuItem icon={SquareTerminal} onSelect={run(actions.openInTerminal.run)}>
                Open in {actions.openInTerminal.app}
              </MenuItem>
            )}
            <MenuItem icon={Copy} onSelect={run(actions.onCopyBranch)}>
              Copy branch name
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={X} danger onSelect={run(actions.onClose)}>
              Close task
            </MenuItem>
          </Menu>
        </AnchoredPopover>
      </div>
    </header>
  );
}
