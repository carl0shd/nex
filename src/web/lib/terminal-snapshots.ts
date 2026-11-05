const MAX_ENTRIES = 50;
const MAX_TAIL = 512 * 1024;

interface Snapshot {
  screen: string;
  tail: string;
  stop: () => void;
}

const snapshots = new Map<string, Snapshot>();

export function forgetTerminalSnapshot(id: string): void {
  snapshots.get(id)?.stop();
  snapshots.delete(id);
}

export function keepTerminalSnapshot(id: string, screen: string): void {
  forgetTerminalSnapshot(id);
  const entry: Snapshot = { screen, tail: "", stop: () => {} };
  entry.stop = window.api.onPtyData(id, (data) => {
    entry.tail += data;
    if (entry.tail.length > MAX_TAIL) forgetTerminalSnapshot(id);
  });
  snapshots.set(id, entry);
  if (snapshots.size > MAX_ENTRIES) {
    const oldest = snapshots.keys().next().value;
    if (oldest !== undefined) forgetTerminalSnapshot(oldest);
  }
}

export function takeTerminalSnapshot(id: string): string | null {
  const entry = snapshots.get(id);
  if (!entry) return null;
  forgetTerminalSnapshot(id);
  return entry.screen + entry.tail;
}
