import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  CodeView,
  type CodeViewHandle,
  type CodeViewItem,
  type FileDiffLoadedFiles,
  type FileDiffMetadata
} from '@pierre/diffs/react';
import type { CodeViewLineSelection } from '@pierre/diffs';
import { resolveDiffTheme } from './diff-theme';
import DiffFileHeader from './diff-file-header';
import { readTextSelection, type DiffTextSelection } from '@/lib/diff-text-selection';

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
  selectedLines?: CodeViewLineSelection | null;
  onSelectedLinesChange?: (selection: CodeViewLineSelection | null) => void;
  onTextSelection?: (selection: DiffTextSelection | null) => void;
  onVisibleFileChange?: (name: string) => void;
  onToggleCollapse?: (name: string) => void;
  ref?: React.Ref<DiffViewerHandle>;
}

// Never add `scrollbar-width`/`scrollbar-color`: either one makes Chromium drop
// the `::-webkit-scrollbar` rules Pierre needs to size and hide its gutter.
const DIFF_UNSAFE_CSS = `
  [data-content-buffer] { background-image: none; background-color: var(--diffs-bg-context); }
  :host, [data-code], [data-content], [data-line] { user-select: text; cursor: text; }
  [data-gutter],
  [data-gutter-buffer],
  [data-column-number],
  [data-line-number-content],
  [data-separator],
  [data-diffs-header],
  [data-no-newline] { user-select: none; cursor: default; }
`;

/** Distance below the sticky header at which a file counts as "the one you're reading". */
const ACTIVE_FILE_OFFSET = 8;

// Hoisted because CodeView compares options shallowly: a fresh object every
// render re-renders every row and wipes any in-progress text selection.
const DIFF_LAYOUT = { gap: 16, paddingTop: 12, paddingBottom: 12 };

function DiffViewer({
  diffs,
  versionByName,
  collapsedFiles,
  worktreePath,
  baseBranch,
  diffStyle = 'split',
  wordDiff = true,
  scrollToFile,
  selectedLines,
  onSelectedLinesChange,
  onTextSelection,
  onVisibleFileChange,
  onToggleCollapse,
  ref
}: DiffViewerProps): React.JSX.Element {
  const viewRef = useRef<CodeViewHandle<undefined>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // A patch only carries the lines around each hunk, so expanding the context
  // means going back to the file itself.
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

  /**
   * Each file renders into its own shadow root, so there is no single document
   * selection to read — every host has to be asked for its own.
   */
  useEffect(() => {
    if (!onTextSelection) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = (): void => {
      const view = viewRef.current?.getInstance();
      if (!view) return;
      for (const item of view.getRenderedItems()) {
        const found = readTextSelection(item.element, item.id);
        if (found) {
          onTextSelection(found);
          return;
        }
      }
      onTextSelection(null);
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [onTextSelection]);

  const options = useMemo(
    () => ({
      theme,
      themeType,
      diffStyle,
      diffIndicators: 'classic' as const,
      stickyHeaders: true,
      preferredHighlighter: 'shiki-js' as const,
      lineDiffType: (wordDiff ? 'word' : 'none') as 'word' | 'none',
      hunkSeparators: 'line-info' as const,
      enableLineSelection: true,
      loadDiffFiles,
      unsafeCSS: DIFF_UNSAFE_CSS,
      layout: DIFF_LAYOUT
    }),
    [theme, themeType, diffStyle, wordDiff, loadDiffFiles]
  );

  const renderHeader = useCallback(
    (item: CodeViewItem): React.ReactNode =>
      item.type === 'diff' ? (
        <DiffFileHeader
          fileDiff={item.fileDiff}
          collapsed={item.collapsed}
          onToggle={onToggleCollapse}
        />
      ) : null,
    [onToggleCollapse]
  );

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
      containerRef={containerRef}
      items={items}
      disableWorkerPool
      className="diff-codeview h-full w-full"
      onScroll={handleScroll}
      selectedLines={selectedLines}
      onSelectedLinesChange={onSelectedLinesChange}
      renderCustomHeader={renderHeader}
      options={options}
    />
  );
}

export default DiffViewer;
