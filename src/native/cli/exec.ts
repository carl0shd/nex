import { app } from 'electron';
import { execFile } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { is } from '@electron-toolkit/utils';

function getCliBinary(): string {
  if (is.dev) {
    const devPath = join(app.getAppPath(), 'cli/target/release/nex');
    if (existsSync(devPath)) return devPath;
  }

  return join(process.resourcesPath, 'bin/nex');
}

export interface CliResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function nex<T = unknown>(args: string[], cwd?: string): Promise<CliResult<T>> {
  return new Promise((resolve) => {
    const bin = getCliBinary();
    execFile(bin, ['--json', ...args], { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (stdout) {
        try {
          resolve(JSON.parse(stdout));
          return;
        } catch {
          // fall through
        }
      }
      if (err) {
        resolve({ ok: false, error: err.message });
      } else {
        resolve({ ok: false, error: 'No output from CLI' });
      }
    });
  });
}
