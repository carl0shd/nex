// Manages one live microphone recognition session.
//
// AVAudioEngine captures mic audio and feeds raw PCM buffers directly into
// SFSpeechAudioBufferRecognitionRequest. Optionally pins the engine to a
// specific input device via Core Audio (kAudioOutputUnitProperty_CurrentDevice).

import Speech
import AVFoundation
import CoreAudio

final class LiveSession {
  let sessionId: String
  private let locale: Locale
  private let interimResults: Bool
  private let continuous: Bool
  private let onDevice: Bool
  private let deviceId: AudioDeviceID?

  private var audioEngine: AVAudioEngine?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var recognizer: SFSpeechRecognizer?
  private var isStopping = false
  private var isStopped = false
  private var lastEmittedText = ""

  init(
    sessionId: String,
    locale: Locale,
    interimResults: Bool,
    continuous: Bool,
    onDevice: Bool,
    deviceId: AudioDeviceID?
  ) {
    self.sessionId = sessionId
    self.locale = locale
    self.interimResults = interimResults
    self.continuous = continuous
    self.onDevice = onDevice
    self.deviceId = deviceId
  }

  func start() {
    emitState("starting")

    let speechStatus = SFSpeechRecognizer.authorizationStatus()
    guard speechStatus == .authorized else {
      emitError(code: "permission-denied", message: "Speech recognition not authorized")
      return
    }

    let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)
    if micStatus == .authorized {
      DispatchQueue.global(qos: .userInteractive).async { self.startRecognition() }
      return
    }
    guard micStatus == .notDetermined else {
      emitError(code: "permission-denied", message: "Microphone not authorized")
      return
    }
    AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
      guard let self else { return }
      guard granted else {
        self.emitError(code: "permission-denied", message: "Microphone permission denied by user")
        return
      }
      DispatchQueue.global(qos: .userInteractive).async { self.startRecognition() }
    }
  }

  private func startRecognition() {
    guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
      emitError(code: "unsupported-locale", message: "SFSpeechRecognizer unavailable for \(locale.identifier)")
      return
    }
    self.recognizer = recognizer

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = interimResults
    request.requiresOnDeviceRecognition = onDevice && recognizer.supportsOnDeviceRecognition
    request.taskHint = continuous ? .dictation : .unspecified
    self.recognitionRequest = request

    let engine = AVAudioEngine()
    self.audioEngine = engine
    let inputNode = engine.inputNode

    // Disable Voice Processing on the input. macOS auto-enables it for any
    // SFSpeechRecognizer client, which wraps the input in an aggregate device.
    try? inputNode.setVoiceProcessingEnabled(false)

    // Pin the input to an explicit real device (user-chosen or system default).
    // Without this, CoreAudio also wraps default-input in a private aggregate
    // whose channel layout breaks the engine with -10877.
    if let au = inputNode.audioUnit {
      var dev = deviceId ?? defaultInputDevice()
      if dev != kAudioObjectUnknown {
        AudioUnitSetProperty(
          au,
          kAudioOutputUnitProperty_CurrentDevice,
          kAudioUnitScope_Global,
          0,
          &dev,
          UInt32(MemoryLayout<AudioDeviceID>.size)
        )
      }
    }

    // The setVoiceProcessingEnabled + device-pin calls above trigger an async
    // AudioUnit reconfig. If we query inputFormat / installTap immediately,
    // we sometimes see a stale 0-channel format → installTap throws -10877
    // and the engine fails silently. Yield briefly so CoreAudio's reconfig
    // settles before we read the format.
    Thread.sleep(forTimeInterval: 0.05)

    let inputFmt = inputNode.inputFormat(forBus: 0)
    guard inputFmt.sampleRate > 0, inputFmt.channelCount > 0 else {
      emitError(
        code: "permission-denied",
        message: "Microphone returned invalid format (rate=\(inputFmt.sampleRate) ch=\(inputFmt.channelCount))."
      )
      return
    }

    inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFmt) { [weak self] buffer, _ in
      self?.recognitionRequest?.append(buffer)
    }

    engine.prepare()
    do {
      try engine.start()
    } catch {
      emitError(code: "backend-failure", message: "AVAudioEngine.start() threw: \(error.localizedDescription)")
      return
    }

    self.recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }
      if let error {
        if self.isStopping || self.isStopped { return }
        let nsErr = error as NSError
        if nsErr.code == 1110 { return } // user cancelled
        self.emitError(code: "backend-failure", message: error.localizedDescription)
        return
      }
      guard let result else { return }
      let isFinal = result.isFinal
      let best = result.bestTranscription
      let text = best.formattedString
      if !isFinal && text == self.lastEmittedText { return }
      self.lastEmittedText = text
      let lastSegment = best.segments.last
      let timestampMs = Int((lastSegment?.timestamp ?? 0) * 1000)
      var payload: [String: Any] = [
        "text": text,
        "isFinal": isFinal,
        "timestampMs": timestampMs
      ]
      if let c = lastSegment.map({ Double($0.confidence) }), c > 0 {
        payload["confidence"] = c
      }
      sendEvent(id: self.sessionId, event: "result", payload: payload)
      if isFinal && !self.continuous { self.stopInternal() }
    }

    playCue("mic-on")
    emitState("listening")
  }

  func stop() {
    guard !isStopping && !isStopped else { return }
    isStopping = true
    emitState("stopping")
    stopInternal()
  }

  func abort() {
    isStopping = true
    isStopped = true
    teardown()
    playCue("mic-off")
    sendEvent(id: sessionId, event: "stopped")
  }

  private func stopInternal() {
    recognitionRequest?.endAudio()
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    recognitionTask?.finish()
    DispatchQueue.global(qos: .userInteractive).asyncAfter(deadline: .now() + 0.5) { [weak self] in
      guard let self else { return }
      self.teardown()
      playCue("mic-off")
      sendEvent(id: self.sessionId, event: "stopped")
      removeSession(self.sessionId)
    }
  }

  private func teardown() {
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionRequest = nil
    audioEngine?.stop()
    audioEngine = nil
    recognizer = nil
    isStopped = true
  }

  private func emitState(_ state: String) {
    sendEvent(id: sessionId, event: "state", payload: ["state": state])
  }

  private func emitError(code: String, message: String) {
    sendEvent(id: sessionId, event: "error", payload: ["code": code, "message": message])
  }
}

// MARK: - Session registry

private var activeSessions: [String: LiveSession] = [:]
private let sessionsLock = NSLock()

func removeSession(_ id: String) {
  sessionsLock.lock()
  activeSessions.removeValue(forKey: id)
  sessionsLock.unlock()
}

func handleStartSession(id: String, command: [String: Any]) {
  let localeStr = command["locale"] as? String ?? Locale.current.identifier
  let interimResults = command["interimResults"] as? Bool ?? true
  let continuous = command["continuous"] as? Bool ?? false
  let onDevice = command["onDevice"] as? Bool ?? false
  let deviceIdRaw = command["deviceId"] as? Int
  let deviceId: AudioDeviceID? = deviceIdRaw.map { AudioDeviceID($0) }

  let session = LiveSession(
    sessionId: id,
    locale: Locale(identifier: localeStr),
    interimResults: interimResults,
    continuous: continuous,
    onDevice: onDevice,
    deviceId: deviceId
  )

  sessionsLock.lock()
  activeSessions[id] = session
  sessionsLock.unlock()

  session.start()
}

func handleStopSession(command: [String: Any]) {
  guard let sessionId = command["sessionId"] as? String else { return }
  sessionsLock.lock()
  let session = activeSessions[sessionId]
  sessionsLock.unlock()
  session?.stop()
}

func handleAbortSession(command: [String: Any]) {
  guard let sessionId = command["sessionId"] as? String else { return }
  sessionsLock.lock()
  let session = activeSessions.removeValue(forKey: sessionId)
  sessionsLock.unlock()
  session?.abort()
}

func cleanupAllSessions() {
  sessionsLock.lock()
  let all = activeSessions.values
  activeSessions.removeAll()
  sessionsLock.unlock()
  for s in all { s.abort() }
}
