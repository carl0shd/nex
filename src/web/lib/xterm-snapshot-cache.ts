const cache = new Map<string, string>();

export function getXtermSnapshot(id: string): string | undefined {
  return cache.get(id);
}

export function setXtermSnapshot(id: string, data: string): void {
  cache.set(id, data);
}

export function clearXtermSnapshot(id: string): void {
  cache.delete(id);
}
