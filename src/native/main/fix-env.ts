import { execFileSync } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getNexDir } from '@native/paths';

const KEYS_TO_INHERIT = [
  'PATH',
  'MANPATH',
  'INFOPATH',
  'HOMEBREW_PREFIX',
  'HOMEBREW_CELLAR',
  'HOMEBREW_REPOSITORY',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_CACHE_HOME',
  'NVM_DIR',
  'MISE_DATA_DIR',
  'ASDF_DATA_DIR',
  'PYENV_ROOT',
  'GOPATH',
  'NODE_PATH'
];

function log(msg: string): void {
  try {
    const dir = getNexDir();
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'fix-env.log'), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    // ignore
  }
}

function trySpawn(shell: string): string | null {
  const marker = '__NEX_ENV_BOUNDARY__';
  try {
    const out = execFileSync(
      shell,
      ['-ilc', `printf '%s\\n' '${marker}'; /usr/bin/env; printf '%s\\n' '${marker}'`],
      {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
    return out;
  } catch (err) {
    log(`spawn failed for ${shell}: ${(err as Error).message}`);
    return null;
  }
}

export function fixEnv(): void {
  if (process.platform === 'win32') return;

  log(
    `fixEnv start. SHELL=${process.env.SHELL ?? '(unset)'} PATH=${process.env.PATH ?? '(unset)'}`
  );

  const candidates = [process.env.SHELL, '/bin/zsh', '/bin/bash'].filter(Boolean) as string[];
  const marker = '__NEX_ENV_BOUNDARY__';

  let envBlock: string | null = null;
  for (const shell of candidates) {
    const out = trySpawn(shell);
    if (!out) continue;
    const start = out.indexOf(marker);
    const end = out.lastIndexOf(marker);
    if (start === -1 || end === -1 || start === end) {
      log(`no markers in output from ${shell}`);
      continue;
    }
    envBlock = out.slice(start + marker.length, end);
    log(`got env from ${shell}`);
    break;
  }

  if (!envBlock) {
    log('all shell attempts failed');
    return;
  }

  for (const line of envBlock.split('\n')) {
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq);
    const value = line.slice(eq + 1);
    if (KEYS_TO_INHERIT.includes(key)) {
      process.env[key] = value;
    }
  }

  log(`fixEnv done. PATH=${process.env.PATH}`);
}
