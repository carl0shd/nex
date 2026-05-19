import Speech
import AVFoundation
import Foundation

func handleCheckAvailability(id: String) {
  let authStatus = SFSpeechRecognizer.authorizationStatus()
  let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)

  if authStatus == .denied || authStatus == .restricted {
    sendResult(id: id, payload: [
      "available": false,
      "reason": "Speech recognition permission denied. Enable it in System Settings → Privacy & Security → Speech Recognition.",
      "authStatus": authorizationStatusString(authStatus),
      "micStatus": micAuthorizationStatusString(micStatus)
    ])
    return
  }

  guard let recognizer = SFSpeechRecognizer(), recognizer.isAvailable else {
    sendResult(id: id, payload: [
      "available": false,
      "reason": "SFSpeechRecognizer is not available on this device.",
      "authStatus": authorizationStatusString(authStatus),
      "micStatus": micAuthorizationStatusString(micStatus)
    ])
    return
  }

  sendResult(id: id, payload: [
    "available": true,
    "recognizerLocale": recognizer.locale.identifier,
    "supportsOnDevice": recognizer.supportsOnDeviceRecognition,
    "authStatus": authorizationStatusString(authStatus),
    "micStatus": micAuthorizationStatusString(micStatus)
  ])
}

func requestSpeechAuthorization() async -> SFSpeechRecognizerAuthorizationStatus {
  await withCheckedContinuation { continuation in
    SFSpeechRecognizer.requestAuthorization { status in
      continuation.resume(returning: status)
    }
  }
}

func authorizationStatusString(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
  switch status {
  case .authorized: return "authorized"
  case .denied: return "denied"
  case .restricted: return "restricted"
  case .notDetermined: return "notDetermined"
  @unknown default: return "unknown"
  }
}

func micAuthorizationStatusString(_ status: AVAuthorizationStatus) -> String {
  switch status {
  case .authorized: return "authorized"
  case .denied: return "denied"
  case .restricted: return "restricted"
  case .notDetermined: return "notDetermined"
  @unknown default: return "unknown"
  }
}
