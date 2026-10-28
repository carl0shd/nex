export type DiffSide = "deletions" | "additions";

export type LineRange = { start: number; end: number; side?: DiffSide; endSide?: DiffSide };

export function rangeLabel(path: string, range: LineRange): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const first = Math.min(range.start, range.end);
  const last = Math.max(range.start, range.end);
  return first === last ? `${name}:${first}` : `${name}:${first}–${last}`;
}
