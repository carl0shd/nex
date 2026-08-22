import type { SnippetSide } from '@/stores/diff-chat.store';

export interface DiffTextSelection {
  file: string;
  start: number;
  end: number;
  side: SnippetSide;
  code: string;
}

/** Chromium exposes this on open shadow roots; it is not in the DOM lib types. */
type SelectableShadowRoot = ShadowRoot & { getSelection?: () => Selection | null };

function closestRow(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.dataset.line != null) return current;
    current = current.parentNode;
  }
  return null;
}

function lineNumberOf(row: HTMLElement | null): number | null {
  const raw = row?.dataset.line;
  if (raw == null) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function sideOf(row: HTMLElement | null): SnippetSide {
  return row?.closest('[data-line-type="deletion"]') != null || row?.dataset.lineType === 'deletion'
    ? 'deletions'
    : 'additions';
}

// Pierre's own line selection only starts from the number column, so dragging
// across the code is handled here instead.
export function readTextSelection(host: HTMLElement, file: string): DiffTextSelection | null {
  const root = host.shadowRoot as SelectableShadowRoot | null;
  const selection = root?.getSelection?.();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const code = selection.toString();
  if (code.trim() === '') return null;

  const range = selection.getRangeAt(0);
  const startRow = closestRow(range.startContainer);
  const endRow = closestRow(range.endContainer);
  const first = lineNumberOf(startRow);
  const last = lineNumberOf(endRow) ?? first;
  if (first == null || last == null) return null;

  return {
    file,
    start: Math.min(first, last),
    end: Math.max(first, last),
    side: sideOf(startRow),
    code
  };
}
