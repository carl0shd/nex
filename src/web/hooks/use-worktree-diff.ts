import { useEffect } from 'react';
import { useDiffStore, type LoadDiffOptions } from '@/stores/diff.store';

/**
 * Loads a session's diff and keeps it current from the worktree watcher in the
 * main process. The store skips reparsing when the patch itself is unchanged,
 * so a noisy filesystem costs one `git diff` and nothing more.
 */
export function useWorktreeDiff(
  sessionId: string,
  worktreePath: string | undefined,
  options: LoadDiffOptions = {},
  enabled = true
): void {
  const load = useDiffStore((s) => s.load);
  const { baseBranch, ignoreWhitespace } = options;

  useEffect(() => {
    if (!enabled || !worktreePath) return;

    const refresh = (): void => {
      void load(sessionId, worktreePath, { baseBranch, ignoreWhitespace });
    };

    refresh();
    return window.api.watchWorktree(worktreePath, refresh);
  }, [enabled, sessionId, worktreePath, baseBranch, ignoreWhitespace, load]);
}
