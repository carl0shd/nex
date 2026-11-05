import { useEffect, useState } from "react";
import type { ChangedFile } from "@/components/changes/diff-file";
import { parseWorktreePatch } from "@/lib/worktree-changes";

export function useWorktreeChanges(worktreePath: string, baseBranch: string): ChangedFile[] {
  const [files, setFiles] = useState<ChangedFile[]>([]);

  useEffect(() => {
    if (!worktreePath) return;
    let cancelled = false;
    let lastPatch: string | null = null;
    const load = () =>
      void window.api
        .getWorktreeDiff(worktreePath, { baseBranch: baseBranch || undefined })
        .then((patch) => {
          if (cancelled || patch === lastPatch) return;
          lastPatch = patch;
          setFiles((previous) => {
            const next = parseWorktreePatch(patch, previous);
            const unchanged =
              next.length === previous.length &&
              next.every((file, index) => file === previous[index]);
            return unchanged ? previous : next;
          });
        })
        .catch(() => {});
    load();
    const unwatch = window.api.watchWorktree(worktreePath, load);
    return () => {
      cancelled = true;
      unwatch();
    };
  }, [worktreePath, baseBranch]);

  return files;
}
