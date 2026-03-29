import { app } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataDir = app.getPath('userData');

export function load<T>(filename: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'));
  } catch {
    return fallback;
  }
}

export function save(filename: string, data: unknown): void {
  writeFileSync(join(dataDir, filename), JSON.stringify(data));
}
