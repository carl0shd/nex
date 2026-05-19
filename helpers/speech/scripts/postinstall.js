#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.platform !== 'darwin') process.exit(0);

const appPath = path.join(__dirname, '..', 'bin', 'SpeechHelper.app');
const binaryPath = path.join(appPath, 'Contents', 'MacOS', 'SpeechHelper');

if (fs.existsSync(binaryPath)) process.exit(0);

const buildScript = path.join(__dirname, 'build.sh');
try {
  execFileSync('bash', [buildScript], { stdio: 'inherit' });
} catch (err) {
  console.warn('[speech] build failed:', err.message);
  console.warn(
    '[speech] Speech recognition will be unavailable until you run: bash helpers/speech/scripts/build.sh'
  );
}
