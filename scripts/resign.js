/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  const helperPath = `${appPath}/Contents/Resources/app.asar.unpacked/helpers/speech/bin/Nex Speech.app`;

  // 1) Re-sign the main app + every embedded framework (Electron Framework,
  //    Nex Helper variants, etc.) with the same ad-hoc identity. --deep is
  //    required so dyld can load the embedded frameworks at runtime; otherwise
  //    the team-id check fails ("mapping process and mapped file have different
  //    Team IDs"). This also signs our Nex Speech.app — but without the mic
  //    entitlement, so we re-sign it next.
  execSync(`codesign --force --deep --sign - "${appPath}"`);

  // 2) Re-sign the speech helper alone with its mic entitlement. This changes
  //    the helper's cdhash, which technically invalidates the main app's
  //    "embedded code" seal of it — but that doesn't matter because the helper
  //    is launched as a separate process via `/usr/bin/open`, and macOS only
  //    validates the helper bundle's own signature at that point.
  const entitlementsFile = path.join(os.tmpdir(), `nex-speech-entitlements-${process.pid}.plist`);
  fs.writeFileSync(
    entitlementsFile,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.device.audio-input</key>
  <true/>
</dict>
</plist>
`
  );
  try {
    execSync(
      `codesign --force --sign - --identifier com.nex.app.NexSpeech --entitlements "${entitlementsFile}" "${helperPath}"`
    );
  } finally {
    fs.unlinkSync(entitlementsFile);
  }
};
