import { useState } from "react";
import { Folder } from "lucide-react";
import { GithubMark } from "@/components/atoms/brand-icons";
import { Button } from "@/components/atoms/button";
import { HoverSwap } from "@/components/atoms/hover-swap";
import { Kbd } from "@/components/atoms/kbd";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";

export interface FoundRepo {
  name: string;
  path: string;
  branch: string;
  active: string;
}

function FolderTile() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-elevated text-ink-3">
      <Folder width={14} height={14} strokeWidth={2} />
    </span>
  );
}

export function RepoDropZone({
  onChooseFolder,
  onClone,
  onDropFolder,
}: {
  onChooseFolder?: () => void;
  onClone?: () => void;
  onDropFolder?: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        if (!onDropFolder) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onDropFolder?.(file);
      }}
      className={cn(
        "interactive flex flex-col items-center gap-1.5 rounded-panel border border-dashed px-5 pt-[26px] pb-[22px] text-center",
        over ? "border-accent-ink bg-accent-tint" : "border-line-focus bg-hover/30",
      )}
    >
      <span className="mb-1.5 flex size-10 items-center justify-center rounded-menu bg-elevated text-ink-2">
        <Folder width={18} height={18} strokeWidth={2} />
      </span>
      <span className="text-base font-medium text-ink">Drop a git repo here</span>
      <span className="text-xs text-ink-4">
        Any folder with a .git inside. Nex never changes your checkout.
      </span>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={onChooseFolder}>
          <Folder width={13} height={13} strokeWidth={2} />
          Choose folder
          <Kbd>⌘O</Kbd>
        </Button>
        {onClone && (
          <Button variant="ghost" size="sm" onClick={onClone}>
            <GithubMark width={13} height={13} strokeWidth={2} />
            Clone from GitHub
          </Button>
        )}
      </div>
    </div>
  );
}

export function FoundRepos({
  repos,
  onPick,
}: {
  repos: readonly FoundRepo[];
  onPick: (repo: FoundRepo) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="px-0.5 pb-1.5 text-xs text-ink-3">Found on this Mac</span>
      <GlideMenu
        className="-mx-2.5 flex flex-col"
        highlightClassName="inset-x-0 rounded-field bg-hover"
      >
        {repos.map((repo) => (
          <button
            key={repo.path}
            type="button"
            data-menu-row
            onClick={() => onPick(repo)}
            className="interactive press-wide relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-field px-2.5 text-left select-none"
          >
            <FolderTile />
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="text-sm font-medium text-ink">{repo.name}</span>
              <span className="truncate text-2xs text-ink-4">{repo.path}</span>
            </span>
            <HoverSwap
              rest={
                <span className="text-2xs text-ink-4">
                  {repo.branch} · {repo.active}
                </span>
              }
              hover={
                <span className="flex h-6 items-center rounded-full bg-ink px-2.5 text-2xs font-medium text-inverse">
                  Add
                </span>
              }
            />
          </button>
        ))}
      </GlideMenu>
    </div>
  );
}

export function PickedRepo({ repo, onChange }: { repo: FoundRepo; onChange?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-panel border border-dashed border-line-focus px-3.5 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-tint text-accent-ink">
        <Folder width={15} height={15} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold text-ink">{repo.name}</span>
        <span className="truncate text-2xs text-ink-4">{repo.path}</span>
      </span>
      {onChange && (
        <Button variant="quiet" size="sm" onClick={onChange}>
          Change
        </Button>
      )}
    </div>
  );
}
