import { watch, type FSWatcher } from 'fs';
import { join } from 'path';
import * as agentAccountRepo from '@native/db/repositories/agent-account.repo';
import * as usageRepo from '@native/db/repositories/usage.repo';
import { defaultConfigDir } from '@native/usage/credentials';
import { listTranscriptFiles, scanTranscript } from '@native/usage/transcript';

const REFRESH_WINDOW_MS = 60_000;

interface ScanTarget {
  accountId: string | null;
  configDir: string;
}

function scanTargets(): ScanTarget[] {
  const seen = new Map<string, ScanTarget>();

  for (const account of agentAccountRepo.getAll()) {
    if (!account.configDir || seen.has(account.configDir)) continue;
    seen.set(account.configDir, { accountId: account.id, configDir: account.configDir });
  }

  const fallback = defaultConfigDir();
  if (!seen.has(fallback)) seen.set(fallback, { accountId: null, configDir: fallback });

  return [...seen.values()];
}

function scanTarget(target: ScanTarget, seenPaths: string[]): number {
  let inserted = 0;

  for (const file of listTranscriptFiles(target.configDir)) {
    seenPaths.push(file);

    const state = usageRepo.getScanState(file);
    const scan = scanTranscript(file, state?.byteOffset ?? 0);

    if (scan.records.length > 0) {
      inserted += usageRepo.insertMany(scan.records, target.accountId);
    }
    if (!state || state.byteOffset !== scan.offset || state.size !== scan.size) {
      usageRepo.setScanState(file, target.accountId, scan.size, scan.offset);
    }
  }

  return inserted;
}

export function scanAllTranscripts(): number {
  const seenPaths: string[] = [];
  let inserted = 0;

  for (const target of scanTargets()) {
    inserted += scanTarget(target, seenPaths);
  }

  usageRepo.pruneScanState(seenPaths);
  return inserted;
}

interface TranscriptWatch {
  watchers: FSWatcher[];
  listeners: Set<() => void>;
  timer: NodeJS.Timeout | null;
}

let active: TranscriptWatch | null = null;

// Throttled, not debounced: an agent writes continuously while it streams, so
// resetting the timer on each change would postpone the flush indefinitely.
function notify(entry: TranscriptWatch): void {
  if (entry.timer) return;
  entry.timer = setTimeout(() => {
    entry.timer = null;
    const inserted = scanAllTranscripts();
    if (inserted === 0) return;
    for (const listener of entry.listeners) listener();
  }, REFRESH_WINDOW_MS);
}

function attachWatchers(entry: TranscriptWatch): void {
  for (const target of scanTargets()) {
    try {
      const watcher = watch(
        join(target.configDir, 'projects'),
        { recursive: true, persistent: false },
        (_event, filename) => {
          if (typeof filename === 'string' && !filename.endsWith('.jsonl')) return;
          notify(entry);
        }
      );
      watcher.on('error', () => watcher.close());
      entry.watchers.push(watcher);
    } catch {
      /* the config dir may not exist until the agent runs once */
    }
  }
}

export function watchTranscripts(onChange: () => void): () => void {
  if (!active) {
    active = { watchers: [], listeners: new Set(), timer: null };
    attachWatchers(active);
  }

  const entry = active;
  entry.listeners.add(onChange);

  return () => {
    entry.listeners.delete(onChange);
    if (entry.listeners.size > 0 || active !== entry) return;

    active = null;
    if (entry.timer) clearTimeout(entry.timer);
    for (const watcher of entry.watchers) watcher.close();
    entry.watchers.length = 0;
  };
}
