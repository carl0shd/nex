import { useEffect, useRef, useState, type RefObject } from "react";

const ALL = "nex-search";
const CURRENT = "nex-search-current";
const SKIPPED = "input, textarea, [contenteditable='true'], [aria-hidden='true']";

function findRanges(root: HTMLElement, query: string): Range[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIPPED) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.toLowerCase() ?? "";
    for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + needle.length)) {
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      ranges.push(range);
    }
  }
  return ranges;
}

function paint(ranges: Range[], current: number) {
  CSS.highlights.set(ALL, new Highlight(...ranges));
  if (ranges[current]) CSS.highlights.set(CURRENT, new Highlight(ranges[current]));
  else CSS.highlights.delete(CURRENT);
}

function clear() {
  CSS.highlights.delete(ALL);
  CSS.highlights.delete(CURRENT);
}

export function useTextSearch(root: RefObject<HTMLElement | null>) {
  const ranges = useRef<Range[]>([]);
  const [result, setResult] = useState({ current: 0, total: 0 });

  useEffect(() => clear, []);

  const show = (found: Range[], current: number) => {
    ranges.current = found;
    paint(found, current);
    setResult({ current, total: found.length });
    found[current]?.startContainer.parentElement?.scrollIntoView({ block: "center" });
  };

  return {
    ...result,
    search: (query: string) => show(root.current ? findRanges(root.current, query) : [], 0),
    step: (query: string, delta: 1 | -1) => {
      const found = root.current ? findRanges(root.current, query) : [];
      if (!found.length) return show(found, 0);
      show(found, (result.current + delta + found.length) % found.length);
    },
    reset: () => {
      ranges.current = [];
      clear();
      setResult({ current: 0, total: 0 });
    },
  };
}
