import { useEffect, useState } from "react";
import type { CloneResult } from "@native/git/clone";
import {
  CloneRepoPanel,
  type CloneMode,
  type CloneProgressState,
  type CloneSource,
  type GithubState,
} from "@/components/projects/clone-repo-panel";
import type { FoundRepo } from "@/components/projects/repo-picker";
import { ipcErrorMessage } from "@/lib/ipc-error";
import { relativeTime } from "@/lib/relative-time";
import { repoAt } from "@/lib/repo-at";

const NAME_FROM_URL = /([^/:]+?)(?:\.git)?\/?$/;

async function loadGithub(owner?: string): Promise<GithubState> {
  const gh = await window.api.detectGh();
  if (!gh.installed) return { status: "missing" };
  if (!gh.authenticated) return { status: "signed-out" };
  const owners = (await window.api.listGithubOwners()).map((item) => item.login);
  const chosen = owner ?? gh.login ?? owners[0] ?? "";
  const now = Date.now();
  const repos = await window.api.listGithubRepos(chosen);
  return {
    status: "ready",
    owners,
    owner: chosen,
    repos: repos.map((repo): CloneSource => ({
      id: repo.nameWithOwner,
      name: repo.name,
      description: repo.description,
      private: repo.isPrivate,
      updated: relativeTime(new Date(repo.updatedAt).getTime(), now),
    })),
  };
}

export function AppCloneRepo({
  mode,
  parent: initialParent,
  onCloned,
  onBack,
}: {
  mode: CloneMode;
  parent: string;
  onCloned: (repo: FoundRepo) => void;
  onBack: () => void;
}) {
  const [github, setGithub] = useState<GithubState>({ status: "loading" });
  const [parent, setParent] = useState(initialParent);
  const [progress, setProgress] = useState<CloneProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = (owner?: string) => {
    void loadGithub(owner)
      .then(setGithub)
      .catch((cause) => {
        setError(ipcErrorMessage(cause));
        setGithub({ status: "signed-out" });
      });
  };

  useEffect(() => {
    if (mode !== "github") return;
    let cancelled = false;
    void loadGithub()
      .then((next) => !cancelled && setGithub(next))
      .catch((cause) => !cancelled && setError(ipcErrorMessage(cause)));
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const clone = async (name: string, run: () => Promise<CloneResult>) => {
    setError(null);
    setProgress({ name, phase: "Starting", percent: null });
    const stop = window.api.onCloneProgress((next) =>
      setProgress({ name, phase: next.phase, percent: next.percent }),
    );
    try {
      const result = await run();
      const repo = await repoAt(result.path);
      if (repo) onCloned(repo);
      else setProgress(null);
    } catch (cause) {
      setProgress(null);
      setError(ipcErrorMessage(cause));
    } finally {
      stop();
    }
  };

  return (
    <CloneRepoPanel
      mode={mode}
      github={github}
      parent={parent}
      progress={progress}
      error={error}
      onBack={onBack}
      onOwner={(owner) => {
        setGithub({ status: "loading" });
        refresh(owner);
      }}
      onRetry={() => {
        setError(null);
        setGithub({ status: "loading" });
        refresh();
      }}
      onChangeParent={() => void window.api.pickDirectory().then((path) => path && setParent(path))}
      onCloneGithub={(repo) =>
        void clone(repo.name, () => window.api.cloneGithubRepo(repo.id, parent))
      }
      onCloneUrl={(url) =>
        void clone(url.match(NAME_FROM_URL)?.[1] ?? url, () =>
          window.api.cloneRepository(url, parent),
        )
      }
    />
  );
}
