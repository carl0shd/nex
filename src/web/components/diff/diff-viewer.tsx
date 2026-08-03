import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  CodeView,
  type CodeViewHandle,
  type CodeViewItem,
  type FileDiffLoadedFiles,
  type FileDiffMetadata
} from '@pierre/diffs/react';
import { resolveDiffTheme } from './diff-theme';
import DiffFileHeader from './diff-file-header';

export interface DiffViewerHandle {
  scrollToFile: (name: string) => void;
}

interface DiffViewerProps {
  diffs: FileDiffMetadata[];
  versionByName: Record<string, number>;
  collapsedFiles: string[];
  worktreePath: string;
  baseBranch?: string;
  diffStyle?: 'split' | 'unified';
  wordDiff?: boolean;
  scrollToFile?: string | null;
  onVisibleFileChange?: (name: string) => void;
  onToggleCollapse?: (name: string) => void;
  ref?: React.Ref<DiffViewerHandle>;
}

// Injected into the CodeView shadow root (highest-priority `unsafe` layer).
// Pierre fills the empty side of a split diff with a diagonal hatch pattern;
// we flatten it so missing-line gutters read as a calm solid fill.
// Do not add `scrollbar-width`/`scrollbar-color` here: setting either makes
// Chromium drop the `::-webkit-scrollbar` rules Pierre relies on to hide the
// code's vertical scrollbar and size its gutter.
const DIFF_UNSAFE_CSS = `
  [data-content-buffer] { background-image: none; background-color: var(--diffs-bg-context); }
`;

/** Distance below the sticky header at which a file counts as "the one you're reading". */
const ACTIVE_FILE_OFFSET = 8;

function DiffViewer({
  diffs,
  versionByName,
  collapsedFiles,
  worktreePath,
  baseBranch,
  diffStyle = 'split',
  wordDiff = true,
  scrollToFile,
  onVisibleFileChange,
  onToggleCollapse,
  ref
}: DiffViewerProps): React.JSX.Element {
  const viewRef = useRef<CodeViewHandle<undefined>>(null);
  const activeFileRef = useRef<string | null>(null);
  const handledScrollRef = useRef<string | null>(null);

  const items = useMemo<CodeViewItem[]>(
    () =>
      diffs.map((fileDiff) => {
        const collapsed = collapsedFiles.includes(fileDiff.name);
        return {
          id: fileDiff.name,
          type: 'diff',
          fileDiff,
          collapsed,
          // CodeView only re-reads an item when its version moves, and that
          // includes the collapsed flag — so fold both into one number.
          version: (versionByName[fileDiff.name] ?? 0) * 2 + (collapsed ? 1 : 0)
        };
      }),
    [diffs, versionByName, collapsedFiles]
  );

  const { theme, themeType } = useMemo(() => resolveDiffTheme(), []);

  /**
   * A patch only carries the lines around each hunk, so expanding the
   * unchanged context means going back to the file itself.
   */
  const loadDiffFiles = useCallback(
    async (fileDiff: FileDiffMetadata): Promise<FileDiffLoadedFiles> => {
      const { oldContents, newContents } = await window.api.readWorktreeFileVersions({
        worktreePath,
        path: fileDiff.name,
        prevPath: fileDiff.prevName,
        baseBranch
      });

      if (newContents == null) throw new Error(`Could not read ${fileDiff.name}`);
      const newFile = {
        name: fileDiff.name,
        contents: newContents,
        cacheKey: `${fileDiff.cacheKey}:new`
      };

      if (fileDiff.type === 'rename-pure') return { oldFile: null, newFile };
      if (oldContents == null)
        throw new Error(`Could not read the base version of ${fileDiff.name}`);

      return {
        oldFile: {
          name: fileDiff.prevName ?? fileDiff.name,
          contents: oldContents,
          cacheKey: `${fileDiff.cacheKey}:old`
        },
        newFile
      };
    },
    [worktreePath, baseBranch]
  );

  const scrollToFileById = useCallback((name: string): void => {
    activeFileRef.current = name;
    viewRef.current?.scrollTo({ type: 'item', id: name, align: 'start' });
  }, []);

  useImperativeHandle(ref, () => ({ scrollToFile: scrollToFileById }), [scrollToFileById]);

  // Jump to the requested file once it exists. Guarded, because `items` is
  // rebuilt on every reload and re-scrolling would fight the reader.
  useEffect(() => {
    if (!scrollToFile || handledScrollRef.current === scrollToFile) return;
    if (!items.some((item) => item.id === scrollToFile)) return;
    handledScrollRef.current = scrollToFile;
    scrollToFileById(scrollToFile);
  }, [scrollToFile, items, scrollToFileById]);

  const handleScroll = useCallback(
    (scrollTop: number): void => {
      if (!onVisibleFileChange) return;
      const view = viewRef.current?.getInstance();
      if (!view) return;

      let visible: string | null = null;
      for (const item of items) {
        const top = view.getTopForItem(item.id);
        if (top == null || top > scrollTop + ACTIVE_FILE_OFFSET) break;
        visible = item.id;
      }

      if (!visible || visible === activeFileRef.current) return;
      activeFileRef.current = visible;
      onVisibleFileChange(visible);
    },
    [items, onVisibleFileChange]
  );

  return (
    <CodeView
      ref={viewRef}
      items={items}
      disableWorkerPool
      className="diff-codeview h-full w-full"
      onScroll={handleScroll}
      renderCustomHeader={(item) =>
        item.type === 'diff' ? (
          <DiffFileHeader
            fileDiff={item.fileDiff}
            collapsed={item.collapsed}
            onToggle={onToggleCollapse}
          />
        ) : null
      }
      options={{
        theme,
        themeType,
        diffStyle,
        diffIndicators: 'classic',
        stickyHeaders: true,
        preferredHighlighter: 'shiki-js',
        lineDiffType: wordDiff ? 'word' : 'none',
        hunkSeparators: 'line-info',
        loadDiffFiles,
        unsafeCSS: DIFF_UNSAFE_CSS,
        layout: { gap: 16, paddingTop: 20, paddingBottom: 20 }
      }}
    />
  );
}

export default DiffViewer;
