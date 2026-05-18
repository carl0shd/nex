const MAX_ENTRIES = 50;
const cache = new Map<string, string>();

export function getXtermSnapshot(id: string): string | undefined {
  const value = cache.get(id);
  if (value === undefined) return undefined;
  cache.delete(id);
  cache.set(id, value);
  return value;
}

export function setXtermSnapshot(id: string, data: string): void {
  if (cache.has(id)) cache.delete(id);
  cache.set(id, data);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function clearXtermSnapshot(id: string): void {
  cache.delete(id);
}
