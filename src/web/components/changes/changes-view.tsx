import { useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, GitPullRequest } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { ChangedFileList } from "@/components/changes/changed-file-list";
import type { ChangedFile, DiffLayout } from "@/components/changes/diff-file";
import { NoChanges } from "@/components/changes/no-changes";
import { DiffList, type DiffSelection } from "@/components/changes/diff-list";
import { SelectionAsk } from "@/components/changes/selection-ask";
import { DiffStat } from "@/components/task/task-tab-bar";
import { usePreferencesStore } from "@/stores/preferences.store";
import { rangeLabel } from "@/lib/diff-range";

const LAYOUTS: readonly DiffLayout[] = ["unified", "split"];
const LAYOUT_LABELS = { unified: "Unified", split: "Split" };

function totals(files: readonly ChangedFile[]) {
  return files.reduce(
    (sum, file) => ({ added: sum.added + file.added, removed: sum.removed + file.removed }),
    { added: 0, removed: 0 },
  );
}

function useChanges(initiallyExpanded: string[]) {
  const [layout, setLayout] = useState<DiffLayout>(
    () => usePreferencesStore.getState().prefs.diffView,
  );
  const [expanded, setExpanded] = useState<string[]>(initiallyExpanded);
  const [selection, setSelection] = useState<DiffSelection | null>(null);
  const label = selection ? rangeLabel(selection.path, selection.range) : null;

  const toggle = (path: string) =>
    setExpanded((paths) =>
      paths.includes(path) ? paths.filter((item) => item !== path) : [...paths, path],
    );

  return {
    layout,
    setLayout,
    expanded,
    setExpanded,
    toggle,
    selection,
    setSelection,
    label,
    clearSelection: () => setSelection(null),
  };
}

function LayoutToggle({
  value,
  onChange,
}: {
  value: DiffLayout;
  onChange: (layout: DiffLayout) => void;
}) {
  return (
    <SegmentedControl
      size="sm"
      options={LAYOUTS}
      value={value}
      onChange={onChange}
      labels={LAYOUT_LABELS}
    />
  );
}

export function ChangesView({
  files,
  onAsk,
  onOpenPanel,
}: {
  files: readonly ChangedFile[];
  onAsk?: (question: string, lines: string, text?: string) => void;
  onOpenPanel?: () => void;
}) {
  const changes = useChanges(files.slice(0, 1).map((file) => file.path));
  const sum = totals(files);
  if (files.length === 0) return <NoChanges />;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex h-[42px] shrink-0 items-center gap-2 pr-2.5 pl-4">
        <span className="text-xs text-ink-3">{files.length} files</span>
        <DiffStat {...sum} className="text-2xs" />
        <span className="ml-auto flex items-center gap-0.5">
          <span className="mr-1">
            <LayoutToggle value={changes.layout} onChange={changes.setLayout} />
          </span>
          <IconButton size="sm" aria-label="Collapse all" onClick={() => changes.setExpanded([])}>
            <ChevronsDownUp width={13} height={13} strokeWidth={2} />
          </IconButton>
          <IconButton size="sm" aria-label="Open in focus" onClick={onOpenPanel}>
            <ChevronsUpDown width={13} height={13} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <DiffList
        files={files}
        expanded={changes.expanded}
        onToggle={changes.toggle}
        layout={changes.layout}
        selection={changes.selection}
        onSelectionChange={changes.setSelection}
        className="min-h-0 flex-1 px-3"
      />
      {changes.label && (
        <SelectionAsk
          label={changes.label}
          onSend={(question) => {
            onAsk?.(question, changes.label ?? "", changes.selection?.text);
            changes.clearSelection();
          }}
          onCancel={changes.clearSelection}
          className="absolute inset-x-3 bottom-3"
        />
      )}
    </div>
  );
}

export function ChangesDock({
  files,
  onCreatePullRequest,
}: {
  files: readonly ChangedFile[];
  onCreatePullRequest?: () => void;
}) {
  const [selected, setSelected] = useState(files[0]?.path ?? "");
  const changes = useChanges([]);
  const sum = totals(files);
  const file = files.find((item) => item.path === selected);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-2.5">
      <div className="flex h-8 shrink-0 items-center gap-2 pl-1">
        <span className="text-xs text-ink-2">{files.length} files</span>
        <DiffStat {...sum} className="text-2xs" />
        <Button size="xs" className="ml-auto" onClick={onCreatePullRequest}>
          <GitPullRequest width={12} height={12} strokeWidth={2} />
          Create PR
        </Button>
      </div>
      <ChangedFileList
        files={files}
        selected={selected}
        onSelect={setSelected}
        className="shrink-0"
      />
      {file && (
        <DiffList
          files={[file]}
          expanded={[file.path]}
          layout={changes.layout}
          selection={changes.selection}
          onSelectionChange={changes.setSelection}
          className="min-h-0 flex-1"
        />
      )}
    </div>
  );
}

export function ChangesPanel({
  files,
  base,
  onAsk,
  onCreatePullRequest,
}: {
  files: readonly ChangedFile[];
  base: string;
  onAsk?: (question: string, lines: string, text?: string) => void;
  onCreatePullRequest?: () => void;
}) {
  const [selected, setSelected] = useState(files[0]?.path ?? "");
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const changes = useChanges(files.slice(0, 1).map((file) => file.path));
  const sum = totals(files);
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-[276px] shrink-0 flex-col gap-1 border-r border-line-soft px-2 py-3">
        <span className="px-2.5 pb-1.5 text-xs text-ink-3">{files.length} files</span>
        <ChangedFileList
          files={files}
          selected={selected}
          onSelect={(path) => {
            setSelected(path);
            if (!changes.expanded.includes(path)) changes.toggle(path);
            setScrollTo(path);
          }}
        />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line-soft px-4">
          <span className="text-xs text-ink-3">Since {base}</span>
          <DiffStat {...sum} className="text-2xs" />
          <span className="ml-auto flex items-center gap-2">
            <LayoutToggle value={changes.layout} onChange={changes.setLayout} />
            <Button variant="primary" size="sm" onClick={onCreatePullRequest}>
              <GitPullRequest width={13} height={13} strokeWidth={2} />
              Create PR
            </Button>
          </span>
        </div>
        <DiffList
          files={files}
          expanded={changes.expanded}
          onToggle={changes.toggle}
          layout={changes.layout}
          variant="panel"
          selection={changes.selection}
          onSelectionChange={changes.setSelection}
          scrollTo={scrollTo}
          className="min-h-0 flex-1 px-3"
        />
        {changes.label && (
          <SelectionAsk
            label={changes.label}
            onSend={(question) => {
              onAsk?.(question, changes.label ?? "", changes.selection?.text);
              changes.clearSelection();
            }}
            onCancel={changes.clearSelection}
            className="absolute bottom-4 left-1/2 w-[min(740px,calc(100%-48px))] -translate-x-1/2"
          />
        )}
      </div>
    </div>
  );
}
