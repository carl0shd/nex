import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Group, Panel } from 'react-resizable-panels';
import { useHotkey } from '@tanstack/react-hotkeys';
import { toast } from 'sonner';
import type { ChangedFile } from '@/lib/session-view';
import { useSessionStore } from '@/stores/session.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useDiffStore, EMPTY_SESSION_DIFF } from '@/stores/diff.store';
import { useDiffViewStore } from '@/stores/diff-view.store';
import { useWorktreeDiff } from '@/hooks/use-worktree-diff';
import ResizeHandle from '@/components/ui/resize-handle';
import DiffToolbar from '@/components/diff/diff-toolbar';
import DiffFileTree from '@/components/diff/diff-file-tree';
import DiffViewer, { type DiffViewerHandle } from '@/components/diff/diff-viewer';
import DiscardFileModal from '@/components/modals/discard-file-modal';

const NO_FILES: string[] = [];

function DiffView(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId = '' } = useParams();
  const requestedFile = (location.state as { file?: string } | null)?.file ?? null;

  const session = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId));
  const project = useWorkspaceStore((s) => s.projects.find((p) => p.id === session?.projectId));
  const diff = useDiffStore((s) => s.bySession[sessionId]) ?? EMPTY_SESSION_DIFF;

  const prefs = useDiffViewStore((s) => s.prefs);
  const loadPrefs = useDiffViewStore((s) => s.load);
  const setPref = useDiffViewStore((s) => s.setPref);
  const collapsedFiles = useDiffViewStore((s) => s.collapsed[sessionId]) ?? NO_FILES;
  const toggleCollapsed = useDiffViewStore((s) => s.toggleCollapsed);

  const viewerRef = useRef<DiffViewerHandle>(null);
  const [activeFile, setActiveFile] = useState<string | null>(requestedFile);
  const [pendingDiscard, setPendingDiscard] = useState<ChangedFile | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const worktreePath = session?.worktreePath;
  const baseBranch = session?.baseBranch;

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  useWorktreeDiff(sessionId, worktreePath, {
    baseBranch,
    ignoreWhitespace: prefs.ignoreWhitespace
  });

  const goBack = useCallback((): void => {
    navigate('/');
  }, [navigate]);

  const selectFile = useCallback((name: string): void => {
    setActiveFile(name);
    viewerRef.current?.scrollToFile(name);
  }, []);

  const stepFile = useCallback(
    (delta: number): void => {
      if (diff.files.length === 0) return;
      const current = diff.files.findIndex((file) => file.name === activeFile);
      const next = Math.min(Math.max(current + delta, 0), diff.files.length - 1);
      selectFile(diff.files[next].name);
    },
    [diff.files, activeFile, selectFile]
  );

  useHotkey('J', () => stepFile(1));
  useHotkey('K', () => stepFile(-1));

  const handleToggleCollapse = useCallback(
    (name: string): void => toggleCollapsed(sessionId, name),
    [toggleCollapsed, sessionId]
  );

  const handleCopyPath = useCallback((file: ChangedFile): void => {
    void navigator.clipboard.writeText(file.name);
    toast.success('Path copied');
  }, []);

  const handleOpenInIDE = useCallback(
    (file: ChangedFile): void => {
      if (!worktreePath) return;
      void window.api.openInVSCode(`${worktreePath}/${file.name}`);
    },
    [worktreePath]
  );

  const handleDiscardRequest = useCallback((file: ChangedFile): void => {
    setPendingDiscard(file);
    setDiscardOpen(true);
  }, []);

  const handleDiscardConfirm = useCallback((): void => {
    if (!worktreePath || !pendingDiscard) return;
    // The worktree watcher picks the change up and reloads the diff.
    void window.api
      .discardWorktreeFile(worktreePath, pendingDiscard.name, pendingDiscard.prevName)
      .catch(() => toast.error(`Could not discard ${pendingDiscard.name}`));
    setPendingDiscard(null);
  }, [worktreePath, pendingDiscard]);

  const treeVisible = prefs.treeVisible && diff.files.length > 0;
  const groupKey = useMemo(() => `diff-${treeVisible}`, [treeVisible]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border-soft bg-bg">
        <DiffToolbar
          branch={session?.branch ?? session?.name ?? ''}
          projectName={project?.name ?? ''}
          fileCount={diff.files.length}
          totalAdded={diff.totalAdded}
          totalRemoved={diff.totalRemoved}
          showStats={diff.loadedAt !== null && diff.files.length > 0}
          diffStyle={prefs.diffStyle}
          wordDiff={prefs.wordDiff}
          ignoreWhitespace={prefs.ignoreWhitespace}
          treeVisible={prefs.treeVisible}
          onBack={goBack}
          onToggleTree={() => setPref('treeVisible', !prefs.treeVisible)}
          onDiffStyleChange={(style) => setPref('diffStyle', style)}
          onWordDiffChange={(value) => setPref('wordDiff', value)}
          onIgnoreWhitespaceChange={(value) => setPref('ignoreWhitespace', value)}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {diff.error ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <span className="font-mono text-[12px] text-destructive-text">{diff.error}</span>
            </div>
          ) : diff.files.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[12px] text-text-placeholder opacity-60">
                no changes
              </span>
            </div>
          ) : (
            <Group key={groupKey} orientation="horizontal" className="h-full">
              {treeVisible && (
                <>
                  <Panel id="tree" defaultSize="300px" minSize="130px">
                    <DiffFileTree
                      files={diff.files}
                      activeFile={activeFile}
                      onSelect={selectFile}
                      onCopyPath={handleCopyPath}
                      onOpenInIDE={handleOpenInIDE}
                      onDiscard={handleDiscardRequest}
                    />
                  </Panel>
                  <ResizeHandle direction="horizontal" />
                </>
              )}
              <Panel id="diff" minSize="360px">
                <div className="h-full">
                  <DiffViewer
                    ref={viewerRef}
                    diffs={diff.diffs}
                    versionByName={diff.versionByName}
                    collapsedFiles={collapsedFiles}
                    worktreePath={worktreePath ?? ''}
                    baseBranch={baseBranch}
                    diffStyle={prefs.diffStyle}
                    wordDiff={prefs.wordDiff}
                    scrollToFile={requestedFile}
                    onVisibleFileChange={setActiveFile}
                    onToggleCollapse={handleToggleCollapse}
                  />
                </div>
              </Panel>
            </Group>
          )}
        </div>
      </div>

      <DiscardFileModal
        open={discardOpen}
        fileName={pendingDiscard?.name ?? ''}
        onClose={() => setDiscardOpen(false)}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

export default DiffView;
