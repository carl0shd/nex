import Foundation
import CoreAudio

private func deviceName(_ dev: AudioDeviceID) -> String {
  var nameRef: CFString = "" as CFString
  var size = UInt32(MemoryLayout<CFString>.size)
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioObjectPropertyName,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  let status = withUnsafeMutablePointer(to: &nameRef) { ptr in
    AudioObjectGetPropertyData(dev, &addr, 0, nil, &size, ptr)
  }
  if status != noErr { return "Unknown" }
  return nameRef as String
}

private func deviceInputChannels(_ dev: AudioDeviceID) -> UInt32 {
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioDevicePropertyStreamConfiguration,
    mScope: kAudioDevicePropertyScopeInput,
    mElement: kAudioObjectPropertyElementMain
  )
  var size: UInt32 = 0
  guard AudioObjectGetPropertyDataSize(dev, &addr, 0, nil, &size) == noErr, size > 0 else {
    return 0
  }
  let listPtr = UnsafeMutableRawPointer.allocate(byteCount: Int(size), alignment: 1)
  defer { listPtr.deallocate() }
  guard AudioObjectGetPropertyData(dev, &addr, 0, nil, &size, listPtr) == noErr else { return 0 }
  let list = listPtr.assumingMemoryBound(to: AudioBufferList.self)
  var channels: UInt32 = 0
  let buffers = UnsafeMutableAudioBufferListPointer(list)
  for b in buffers { channels += b.mNumberChannels }
  return channels
}

private func deviceTransportType(_ dev: AudioDeviceID) -> UInt32 {
  var transport: UInt32 = 0
  var size = UInt32(MemoryLayout<UInt32>.size)
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioDevicePropertyTransportType,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  AudioObjectGetPropertyData(dev, &addr, 0, nil, &size, &transport)
  return transport
}

func defaultInputDevice() -> AudioDeviceID {
  var id: AudioDeviceID = kAudioObjectUnknown
  var size = UInt32(MemoryLayout<AudioDeviceID>.size)
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDefaultInputDevice,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &id)
  return id
}

// MARK: - Live device change listener

private var devicesListenerInstalled = false

func installDeviceChangeListener() {
  if devicesListenerInstalled { return }
  devicesListenerInstalled = true
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDevices,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  AudioObjectAddPropertyListenerBlock(
    AudioObjectID(kAudioObjectSystemObject),
    &addr,
    DispatchQueue.main
  ) { _, _ in
    sendEvent(id: "devices", event: "devicesChanged")
  }
}

func handleListDevices(id: String) {
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDevices,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  var size: UInt32 = 0
  guard AudioObjectGetPropertyDataSize(
    AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size
  ) == noErr else {
    sendResult(id: id, payload: ["devices": []])
    return
  }
  let count = Int(size) / MemoryLayout<AudioDeviceID>.size
  var devices = [AudioDeviceID](repeating: 0, count: count)
  guard AudioObjectGetPropertyData(
    AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &devices
  ) == noErr else {
    sendResult(id: id, payload: ["devices": []])
    return
  }

  let defaultId = defaultInputDevice()
  var result: [[String: Any]] = []
  for dev in devices {
    guard deviceInputChannels(dev) > 0 else { continue }
    let name = deviceName(dev)
    // Skip private aggregate devices CoreAudio auto-creates per-process
    // when an AVAudioEngine attaches to the default input.
    if name.hasPrefix("CADefaultDeviceAggregate") { continue }
    result.append([
      "id": Int(dev),
      "name": name,
      "isDefault": dev == defaultId,
      "isBuiltIn": deviceTransportType(dev) == kAudioDeviceTransportTypeBuiltIn
    ])
  }
  sendResult(id: id, payload: ["devices": result])
}
