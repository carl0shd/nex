import { app } from 'electron';
import { join } from 'path';
import { homedir } from 'os';

export function isDev(): boolean {
  return !app.isPackaged;
}

export function getNexDir(): string {
  return join(homedir(), isDev() ? '.nex-dev' : '.nex');
}
