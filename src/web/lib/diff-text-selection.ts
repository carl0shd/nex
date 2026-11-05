import type { DiffSide, LineRange } from "@/lib/diff-range";

const DIFFS_TAG = "diffs-container";

export interface DiffTextSelection {
  path: string;
  range: LineRange;
  text: string;
}

type ShadowWithSelection = ShadowRoot & { getSelection?: () => Selection | null };

function lineOf(node: Node | null): HTMLElement | null {
  const element = node instanceof HTMLElement ? node : (node?.parentElement ?? null);
  return element?.closest<HTMLElement>("[data-line]") ?? null;
}

function sideOf(line: HTMLElement): DiffSide {
  if (line.closest("[data-deletions]")) return "deletions";
  if (line.closest("[data-additions]")) return "additions";
  return line.dataset.lineType?.includes("deletion") ? "deletions" : "additions";
}

export function readDiffTextSelection(root: HTMLElement): DiffTextSelection | null {
  for (const host of root.querySelectorAll<HTMLElement>(DIFFS_TAG)) {
    const selection = (host.shadowRoot as ShadowWithSelection | null)?.getSelection?.();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) continue;
    const first = lineOf(selection.anchorNode);
    const last = lineOf(selection.focusNode);
    const header =
      host.querySelector("[data-diff-path]") ?? host.shadowRoot?.querySelector("[data-diff-path]");
    const path = header?.getAttribute("data-diff-path");
    if (!first || !last || !path) continue;
    const start = Number(first.dataset.line);
    const end = Number(last.dataset.line);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    return {
      path,
      range: { start, end, side: sideOf(first), endSide: sideOf(last) },
      text: selection.toString(),
    };
  }
  return null;
}
