// Plays short on/off cue sounds bundled in Contents/Resources/.
// Uses NSSound (AppKit) so we get native AVFoundation-backed playback with no
// HTMLMediaElement decoding artifacts.

import AppKit

private var cueCache: [String: NSSound] = [:]
private let cueLock = NSLock()

func playCue(_ name: String) {
  cueLock.lock()
  let cached = cueCache[name]
  cueLock.unlock()

  if let cached {
    cached.stop()
    cached.currentTime = 0
    cached.play()
    return
  }

  guard let url = Bundle.main.url(forResource: name, withExtension: "mp3"),
        let sound = NSSound(contentsOf: url, byReference: true)
  else { return }

  cueLock.lock()
  cueCache[name] = sound
  cueLock.unlock()

  sound.play()
}
