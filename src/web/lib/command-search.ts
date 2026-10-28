export function matchScore(text: string, query: string): number | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  const haystack = text.toLowerCase();

  const at = haystack.indexOf(needle);
  if (at === 0) return 300;
  if (at > 0) return /[\s/._-]/.test(haystack[at - 1]) ? 200 : 100;

  let from = 0;
  let gaps = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, from);
    if (found === -1) return null;
    gaps += found - from;
    from = found + 1;
  }
  return Math.max(1, 50 - gaps);
}

export interface Searchable {
  label: string;
  keywords?: readonly string[];
}

export function searchItems<T extends Searchable>(items: readonly T[], query: string): T[] {
  if (!query.trim()) return [...items];
  return items
    .map((item, index) => {
      const scores = [item.label, ...(item.keywords ?? [])]
        .map((text) => matchScore(text, query))
        .filter((score): score is number => score !== null);
      return { item, index, score: scores.length ? Math.max(...scores) : null };
    })
    .filter((entry): entry is { item: T; index: number; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

export function stepIndex(index: number, delta: number, count: number): number {
  if (count === 0) return 0;
  return (((index + delta) % count) + count) % count;
}
