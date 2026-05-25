import { existsSync } from 'fs';
import { delimiter, isAbsolute, join } from 'path';

export function whichBinary(cmd: string, envPath: string = process.env.PATH ?? ''): string | null {
  if (isAbsolute(cmd)) return existsSync(cmd) ? cmd : null;
  if (cmd.includes('/')) return existsSync(cmd) ? cmd : null;
  if (process.platform === 'win32') return null;
  for (const dir of envPath.split(delimiter)) {
    if (!dir) continue;
    const full = join(dir, cmd);
    if (existsSync(full)) return full;
  }
  return null;
}
