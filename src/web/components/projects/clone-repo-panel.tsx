import { useState } from "react";
import { ChevronLeft, Folder, Lock } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { DitherProgress } from "@/components/atoms/dither-progress";
import { IconButton } from "@/components/atoms/icon-button";
import { InlineCode } from "@/components/atoms/inline-code";
import { SearchField } from "@/components/atoms/search-field";
import { TextField } from "@/components/atoms/text-field";
import GlideMenu from "@/components/primitives/glide-menu";
import { SelectMenu } from "@/components/primitives/select-menu";

export type CloneMode = "github" | "url";

export interface CloneSource {
  id: string;
  name: string;
  description: string;
  private: boolean;
  updated: string;
}

export type GithubState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "signed-out" }
  | { status: "ready"; owners: readonly string[]; owner: string; repos: readonly CloneSource[] };

export interface CloneProgressState {
  name: string;
  phase: string;
  percent: number | null;
}

const LIST_HEIGHT = 264;

function RepoRow({ repo, onPick }: { repo: CloneSource; onPick: () => void }) {
  return (
    <button
      type="button"
      data-menu-row
      onClick={onPick}
      className="interactive press-wide relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-field px-2.5 text-left select-none"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <span className="truncate" title={repo.name}>
            {repo.name}
          </span>
          {repo.private && (
            <Lock width={11} height={11} strokeWidth={2.25} className="shrink-0 text-ink-4" />
          )}
        </span>
        {repo.description && (
          <span className="truncate text-2xs text-ink-4" title={repo.description}>
            {repo.description}
          </span>
        )}
      </span>
      <span className="shrink-0 text-2xs text-ink-4">{repo.updated}</span>
    </button>
  );
}

function GithubList({
  state,
  onOwner,
  onPick,
  onRetry,
}: {
  state: GithubState;
  onOwner: (owner: string) => void;
  onPick: (repo: CloneSource) => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  if (state.status === "loading") {
    return <span className="px-0.5 py-6 text-center text-xs text-ink-4">Loading your repos…</span>;
  }
  if (state.status !== "ready") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-panel bg-inset px-4 py-3.5 text-xs leading-[18px] text-ink-3">
        {state.status === "missing" ? (
          <span>
            Nex lists your repos with the GitHub CLI. Install it with{" "}
            <InlineCode>brew install gh</InlineCode>, then sign in with{" "}
            <InlineCode>gh auth login</InlineCode>.
          </span>
        ) : (
          <span>
            Sign in to the GitHub CLI with <InlineCode>gh auth login</InlineCode> to see your repos.
          </span>
        )}
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  const term = query.trim().toLowerCase();
  const shown = term
    ? state.repos.filter((repo) => `${repo.name} ${repo.description}`.toLowerCase().includes(term))
    : state.repos;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search repos"
          autoFocus
          className="min-w-0 flex-1"
        />
        {state.owners.length > 1 && (
          <SelectMenu
            value={state.owner}
            options={state.owners.map((owner) => ({ value: owner, label: owner }))}
            onChange={onOwner}
          />
        )}
      </div>
      <div className="quiet-scroll -mx-2.5 overflow-y-auto" style={{ maxHeight: LIST_HEIGHT }}>
        {shown.length === 0 ? (
          <span className="block px-2.5 py-4 text-xs text-ink-4">No repos match</span>
        ) : (
          <GlideMenu
            className="flex flex-col"
            highlightClassName="inset-x-0 rounded-field bg-hover"
          >
            {shown.map((repo) => (
              <RepoRow key={repo.id} repo={repo} onPick={() => onPick(repo)} />
            ))}
          </GlideMenu>
        )}
      </div>
    </div>
  );
}

function UrlForm({ onClone }: { onClone: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const submit = () => url.trim() && onClone(url.trim());
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <TextField
          autoFocus
          mono
          size="md"
          aria-label="Git URL"
          placeholder="https://github.com/owner/repo.git"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
      </div>
      <Button variant="primary" size="sm" className="h-8" disabled={!url.trim()} onClick={submit}>
        Clone
      </Button>
    </div>
  );
}

export function CloneRepoPanel({
  mode,
  github,
  parent,
  progress,
  error,
  onBack,
  onOwner,
  onRetry,
  onChangeParent,
  onCloneGithub,
  onCloneUrl,
}: {
  mode: CloneMode;
  github: GithubState;
  parent: string;
  progress: CloneProgressState | null;
  error: string | null;
  onBack: () => void;
  onOwner: (owner: string) => void;
  onRetry: () => void;
  onChangeParent: () => void;
  onCloneGithub: (repo: CloneSource) => void;
  onCloneUrl: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <IconButton aria-label="Back" size="sm" onClick={onBack} disabled={Boolean(progress)}>
          <ChevronLeft width={14} height={14} strokeWidth={2} />
        </IconButton>
        <span className="text-sm font-medium text-ink">
          {mode === "github" ? "Clone from GitHub" : "Clone from a git URL"}
        </span>
      </div>
      {progress ? (
        <div className="flex flex-col gap-2 rounded-panel bg-inset px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm text-ink">
            Cloning {progress.name}
            <span className="ml-auto text-2xs text-ink-4">
              {progress.phase}
              {progress.percent !== null && ` · ${progress.percent}%`}
            </span>
          </span>
          <DitherProgress value={progress.percent ?? 4} />
        </div>
      ) : mode === "github" ? (
        <GithubList state={github} onOwner={onOwner} onPick={onCloneGithub} onRetry={onRetry} />
      ) : (
        <UrlForm onClone={onCloneUrl} />
      )}
      {error && <span className="text-xs text-red">{error}</span>}
      <div className="flex items-center gap-2 text-xs text-ink-3">
        <Folder width={12} height={12} strokeWidth={2} className="shrink-0 text-ink-4" />
        <span className="shrink-0">Clone into</span>
        <span className="min-w-0 truncate text-2xs text-ink-2" title={parent}>
          {parent}
        </span>
        <Button
          variant="quiet"
          size="sm"
          className="ml-auto shrink-0"
          disabled={Boolean(progress)}
          onClick={onChangeParent}
        >
          Change
        </Button>
      </div>
    </div>
  );
}
