/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
// Collects the license of every dependency we ship, for the About panel.
// Run through `yarn licenses:generate`; the build does it automatically.

const { readFileSync, writeFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const OUTPUT = join(ROOT, 'src/web/assets/licenses.json');

// React and Electron live in devDependencies but ship inside the app.
const EXTRA_PACKAGES = ['react', 'react-dom', 'electron'];

const LICENSE_FILE = /^(licen[cs]e|copying|notice)(\.|$)/i;

function readPackage(name) {
  const dir = join(ROOT, 'node_modules', name);
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) return null;
  return { dir, pkg: JSON.parse(readFileSync(manifest, 'utf8')) };
}

function licenseName(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).join(', ');
  return 'Unknown';
}

function licenseText(dir) {
  const file = readdirSync(dir).find((entry) => LICENSE_FILE.test(entry));
  if (!file) return '';
  return readFileSync(join(dir, file), 'utf8').trim();
}

function repositoryUrl(pkg) {
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  if (!repo) return pkg.homepage ?? '';
  return repo
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');
}

const { dependencies } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const names = [...new Set([...Object.keys(dependencies), ...EXTRA_PACKAGES])].sort();

const entries = [];
const missing = [];

for (const name of names) {
  const resolved = readPackage(name);
  if (!resolved) {
    missing.push(name);
    continue;
  }
  entries.push({
    name,
    version: resolved.pkg.version,
    license: licenseName(resolved.pkg),
    url: repositoryUrl(resolved.pkg),
    text: licenseText(resolved.dir)
  });
}

writeFileSync(OUTPUT, `${JSON.stringify(entries, null, 2)}\n`);

console.log(`Wrote ${entries.length} licenses to ${OUTPUT}`);
if (missing.length > 0) console.warn(`Not installed, skipped: ${missing.join(', ')}`);
