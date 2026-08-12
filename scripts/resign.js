/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const APP_ENTITLEMENTS = path.join(__dirname, '..', 'build', 'entitlements.mac.plist');

const SPEECH_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.device.audio-input</key>
  <true/>
</dict>
</plist>
`;

const codesign = (args) => {
  execFileSync('codesign', args, { stdio: 'inherit' });
};

// codesign writes its bundle description to stderr, not stdout.
const isAdHocSigned = (appPath) => {
  const { stdout, stderr } = spawnSync('codesign', ['-dvv', appPath], { encoding: 'utf8' });
  return /Signature=adhoc/.test(`${stdout}${stderr}`);
};

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  const helperPath = `${appPath}/Contents/Resources/app.asar.unpacked/helpers/speech/bin/Nex Speech.app`;

  // Re-signing ad-hoc over a Developer ID signature would throw away the only
  // thing Gatekeeper accepts, and strip the notarization ticket with it.
  if (!isAdHocSigned(appPath)) {
    console.log('resign: app carries a real identity, skipping ad-hoc re-sign');
    return;
  }

  // Every Mach-O in the bundle must carry the same ad-hoc identity or dyld
  // refuses to map the embedded frameworks ("mapping process and mapped file
  // have different Team IDs"), so this pass is --deep. Entitlements only ever
  // apply to the bundle named on the command line, never to nested code.
  codesign(['--force', '--deep', '--sign', '-', '--entitlements', APP_ENTITLEMENTS, appPath]);

  const entitlementsFile = path.join(os.tmpdir(), `nex-speech-entitlements-${process.pid}.plist`);
  fs.writeFileSync(entitlementsFile, SPEECH_ENTITLEMENTS);
  try {
    codesign([
      '--force',
      '--deep',
      '--sign',
      '-',
      '--identifier',
      'com.nex.app.NexSpeech',
      '--entitlements',
      entitlementsFile,
      helperPath
    ]);
  } finally {
    fs.unlinkSync(entitlementsFile);
  }

  // Signing the helper changed its cdhash, which broke the outer bundle's seal
  // over it. Re-seal the top level (not --deep, so the helper keeps its mic
  // entitlement) or Gatekeeper reports the whole app as damaged.
  codesign(['--force', '--sign', '-', '--entitlements', APP_ENTITLEMENTS, appPath]);

  // A build that ships an invalid signature is unopenable once quarantined, so
  // fail here rather than at the user's machine.
  codesign(['--verify', '--deep', '--strict', '--verbose=2', appPath]);
};
