import { existsSync, mkdirSync, readdirSync, symlinkSync } from 'fs';
import { join } from 'path';

export function setupSymlinks(repoRoot: string, wtPath: string, items: string[]): void {
  for (const item of items) {
    if (item === '.claude') {
      setupClaudeShallow(repoRoot, wtPath);
    } else {
      const src = join(repoRoot, item);
      const dst = join(wtPath, item);
      if (existsSync(src) && !existsSync(dst)) {
        symlinkSync(src, dst);
      }
    }
  }
}

function setupClaudeShallow(repoRoot: string, wtPath: string): void {
  const srcDir = join(repoRoot, '.claude');
  if (!existsSync(srcDir)) return;

  const dstDir = join(wtPath, '.claude');
  mkdirSync(dstDir, { recursive: true });

  let entries: string[];
  try {
    entries = readdirSync(srcDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry === 'plans' || entry === 'settings.local.json') continue;
    const dst = join(dstDir, entry);
    if (!existsSync(dst)) {
      symlinkSync(join(srcDir, entry), dst);
    }
  }
}
