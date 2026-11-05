import { useEffect, useMemo, useRef } from "react";
import { registerCustomCSSVariableTheme, type CodeViewItem } from "@pierre/diffs";
import { CodeView, type CodeViewHandle } from "@pierre/diffs/react";
import { DiffFileHeader, type ChangedFile, type DiffLayout } from "@/components/changes/diff-file";
import type { LineRange } from "@/lib/diff-range";
import { readDiffTextSelection } from "@/lib/diff-text-selection";
import { getTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type DiffSelection = { path: string; range: LineRange; text?: string };

const THEME = "nex";
const RENDER_EVERYTHING_PX = 1_000_000;

const DIFF_UNSAFE_CSS = `
  [data-code] { scrollbar-gutter: auto; padding-bottom: 4px; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { border-radius: 99px; background: var(--line-strong); }
  [data-code], [data-content], [data-line] { user-select: text; cursor: text; }
  [data-gutter], [data-column-number], [data-line-number-content], [data-separator] {
    user-select: none;
    cursor: default;
  }
`;

let themeRegistered = false;

function registerTheme() {
  if (themeRegistered) return;
  themeRegistered = true;
  registerCustomCSSVariableTheme(THEME, {
    foreground: "var(--ink-2)",
    background: "var(--canvas)",
    "token-comment": "var(--ink-4)",
    "token-keyword": "var(--blue)",
    "token-string": "var(--accent-ink)",
    "token-string-expression": "var(--accent-ink)",
    "token-constant": "var(--orange)",
    "token-function": "var(--ink)",
    "token-parameter": "var(--ink-2)",
    "token-punctuation": "var(--ink-3)",
    "token-link": "var(--blue)",
  });
}

const LAYOUT = {
  card: { gap: 6, paddingTop: 2, paddingBottom: 76 },
  panel: { gap: 10, paddingTop: 12, paddingBottom: 96 },
};

// CodeView estimates unmeasured files from these; they must match DiffFileHeader and the line CSS.
const ITEM_METRICS = {
  card: { diffHeaderHeight: 36, lineHeight: 20 },
  panel: { diffHeaderHeight: 44, lineHeight: 21 },
};

export function DiffList({
  files,
  expanded,
  onToggle,
  layout,
  variant = "card",
  selection,
  onSelectionChange,
  scrollTo,
  className,
}: {
  files: readonly ChangedFile[];
  expanded: readonly string[];
  onToggle?: (path: string) => void;
  layout: DiffLayout;
  variant?: "card" | "panel";
  selection: DiffSelection | null;
  onSelectionChange: (selection: DiffSelection | null) => void;
  scrollTo?: string | null;
  className?: string;
}) {
  registerTheme();
  const viewRef = useRef<CodeViewHandle<undefined>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const pickText = () => {
      const picked = readDiffTextSelection(container);
      if (picked) onSelectionChangeRef.current(picked);
    };
    container.addEventListener("mouseup", pickText);
    return () => container.removeEventListener("mouseup", pickText);
  }, []);

  const items = useMemo<CodeViewItem[]>(
    () =>
      files.map((file) => {
        const collapsed = !expanded.includes(file.path);
        return {
          id: file.path,
          type: "diff",
          fileDiff: file.diff,
          collapsed,
          version: (file.version ?? 0) * 2 + (collapsed ? 1 : 0),
        };
      }),
    [files, expanded],
  );

  const options = useMemo(
    () => ({
      theme: THEME,
      themeType: getTheme(),
      diffStyle: layout,
      diffIndicators: "classic" as const,
      preferredHighlighter: "shiki-js" as const,
      lineDiffType: "word" as const,
      hunkSeparators: "line-info" as const,
      stickyHeaders: variant === "panel",
      enableLineSelection: true,
      unsafeCSS: DIFF_UNSAFE_CSS,
      layout: LAYOUT[variant],
      itemMetrics: ITEM_METRICS[variant],
    }),
    [layout, variant],
  );

  useEffect(() => {
    if (scrollTo) viewRef.current?.scrollTo({ type: "item", id: scrollTo, align: "start" });
  }, [scrollTo]);

  useEffect(() => {
    const view = viewRef.current?.getInstance();
    if (!view) return;
    // CodeView has no switch for virtualization; an overscan taller than any diff renders everything.
    const config = view.config as { overscrollSize: number; intersectionObserverMargin: number };
    config.overscrollSize = RENDER_EVERYTHING_PX;
    config.intersectionObserverMargin = RENDER_EVERYTHING_PX;
  }, []);

  const byPath = useMemo(() => new Map(files.map((file) => [file.path, file])), [files]);

  return (
    <CodeView
      ref={viewRef}
      containerRef={containerRef}
      items={items}
      disableWorkerPool
      className={cn("nex-diff-list", variant === "panel" && "nex-diff-panel", className)}
      options={options}
      selectedLines={selection && { id: selection.path, range: selection.range }}
      onSelectedLinesChange={(next) =>
        onSelectionChange(next && { path: next.id, range: next.range })
      }
      renderCustomHeader={(item) => {
        const file = byPath.get(item.id);
        if (!file) return null;
        return (
          <DiffFileHeader
            file={file}
            variant={variant}
            expanded={!item.collapsed}
            onToggle={onToggle ? () => onToggle(file.path) : undefined}
          />
        );
      }}
    />
  );
}
