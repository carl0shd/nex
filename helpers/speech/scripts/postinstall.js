#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.platform !== 'darwin') process.exit(0);

const speechDir = path.join(__dirname, '..');
const appPath = path.join(speechDir, 'bin', 'Nex Speech.app');
const binaryPath = path.join(appPath, 'Contents', 'MacOS', 'Nex Speech');
const swiftDir = path.join(speechDir, 'swift');

function latestMtime(dir) {
  let latest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.build' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      latest = Math.max(latest, latestMtime(full));
    } else {
      latest = Math.max(latest, fs.statSync(full).mtimeMs);
    }
  }
  return latest;
}

function needsBuild() {
  if (!fs.existsSync(binaryPath)) return true;
  try {
    const binMtime = fs.statSync(binaryPath).mtimeMs;
    const srcMtime = latestMtime(swiftDir);
    return srcMtime > binMtime;
  } catch {
    return true;
  }
}

if (!needsBuild()) {
  console.log('[speech] up-to-date, skipping build');
  process.exit(0);
}

const buildScript = path.join(__dirname, 'build.sh');
try {
  execFileSync('bash', [buildScript], { stdio: 'inherit' });
} catch (err) {
  console.warn('[speech] build failed:', err.message);
  console.warn(
    '[speech] Speech recognition will be unavailable until you run: bash helpers/speech/scripts/build.sh'
  );
}
