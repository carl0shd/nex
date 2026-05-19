#!/usr/bin/env bash
# Builds the Nex Speech Swift executable and bundles it as a .app
# with the Info.plist needed for mic + speech recognition permissions.
#
# Universal binary (arm64 + x86_64) when both toolchains are present.
# Falls back to single-arch builds otherwise.

set -euo pipefail

cd "$(dirname "$0")/.."

SWIFT_DIR="$(pwd)/swift"
BIN_DIR="$(pwd)/bin"
APP_NAME="Nex Speech"
APP_DIR="$BIN_DIR/$APP_NAME.app"

if [ "$(uname)" != "Darwin" ]; then
  echo "Nex Speech only builds on macOS — skipping"
  exit 0
fi

if ! command -v swift >/dev/null 2>&1; then
  echo "Swift toolchain not found. Install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi

rm -rf "$BIN_DIR"
mkdir -p "$BIN_DIR"

cd "$SWIFT_DIR"

HOST_ARCH="$(uname -m)"

build_arch() {
  local arch=$1
  if swift build -c release --arch "$arch" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

ARM_BIN="$SWIFT_DIR/.build/arm64-apple-macosx/release/NexSpeech"
X86_BIN="$SWIFT_DIR/.build/x86_64-apple-macosx/release/NexSpeech"

mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"
TARGET_BIN="$APP_DIR/Contents/MacOS/$APP_NAME"

# Copy the Nex app icon so the helper shows up correctly in System Settings,
# Activity Monitor, the TCC permission dialog, etc.
ICON_SRC="$(cd "$(dirname "$0")/../../.." && pwd)/build/icon.icns"
if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$APP_DIR/Contents/Resources/icon.icns"
fi

# Bundle the mic on/off cue sounds — accessed via Bundle.main from Swift.
SOUNDS_DIR="$(dirname "$0")/../sounds"
if [ -d "$SOUNDS_DIR" ]; then
  cp "$SOUNDS_DIR"/*.mp3 "$APP_DIR/Contents/Resources/" 2>/dev/null || true
fi

if build_arch arm64 && build_arch x86_64 && [ -f "$ARM_BIN" ] && [ -f "$X86_BIN" ]; then
  echo "Built arm64 + x86_64; creating universal binary"
  lipo -create "$ARM_BIN" "$X86_BIN" -output "$TARGET_BIN"
else
  echo "Falling back to single-arch build ($HOST_ARCH)"
  swift build -c release
  cp ".build/release/NexSpeech" "$TARGET_BIN"
fi

chmod +x "$TARGET_BIN"

cat > "$APP_DIR/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>CFBundleIdentifier</key><string>com.nex.app.NexSpeech</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>LSUIElement</key><true/>
  <key>NSMicrophoneUsageDescription</key>
  <string>Nex uses the microphone to dictate messages to the agent.</string>
  <key>NSSpeechRecognitionUsageDescription</key>
  <string>Nex uses speech recognition to transcribe dictated messages.</string>
</dict>
</plist>
EOF

printf 'APPL????' > "$APP_DIR/Contents/PkgInfo"

ENTITLEMENTS_FILE="$(mktemp)"
cat > "$ENTITLEMENTS_FILE" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.device.audio-input</key>
  <true/>
</dict>
</plist>
EOF

codesign --force --sign - \
  --identifier com.nex.app.NexSpeech \
  --entitlements "$ENTITLEMENTS_FILE" \
  "$APP_DIR" >/dev/null 2>&1 || true

rm -f "$ENTITLEMENTS_FILE"

# Ad-hoc signing changes the binary's cdhash on every rebuild, which makes
# macOS TCC silently deny previously-granted permissions. Reset the grants
# so the next launch re-prompts cleanly. Also kill any old helper still
# running so the fresh binary loads.
pkill -f "$APP_NAME" >/dev/null 2>&1 || true
tccutil reset SpeechRecognition com.nex.app.NexSpeech >/dev/null 2>&1 || true
tccutil reset Microphone com.nex.app.NexSpeech >/dev/null 2>&1 || true

echo "$APP_NAME.app built at $APP_DIR"
