// SpeechHelper — persistent helper for Nex live mic transcription.
//
// Launches as an .app bundle via `/usr/bin/open` so macOS TCC attributes
// the mic/speech permission prompts correctly (using the bundle's Info.plist).
// Communicates with the parent Electron app over a TCP socket on localhost.
//
// Protocol: newline-delimited JSON, both directions.
// See Protocol.swift for envelope shapes.
//
// Adapted from https://github.com/varaprasadreddy9676/electron-native-speech (MIT)
// with device selection support added.

import Foundation
import AppKit

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

func dispatchCommand(_ command: [String: Any]) {
  guard let cmd = command["command"] as? String else { return }
  let id = command["id"] as? String ?? ""

  switch cmd {
  case "checkAvailability":
    handleCheckAvailability(id: id)

  case "listDevices":
    handleListDevices(id: id)

  case "listLocales":
    handleListLocales(id: id)

  case "requestAuth":
    Task { @MainActor in
      let status = await requestSpeechAuthorization()
      sendResult(id: id, payload: [
        "authorized": status == .authorized,
        "status": authorizationStatusString(status)
      ])
    }

  case "startSession":
    handleStartSession(id: id, command: command)

  case "stopSession":
    handleStopSession(command: command)

  case "abortSession":
    handleAbortSession(command: command)

  case "shutdown":
    cleanupAllSessions()
    exit(0)

  default:
    if !id.isEmpty {
      sendError(id: id, code: "unknown", message: "Unknown command: \(cmd)")
    }
  }
}

let args = Array(CommandLine.arguments.dropFirst())
let port = args.drop { $0 != "--port" }.dropFirst().first.flatMap(UInt16.init)

installDeviceChangeListener()

if let port {
  do {
    try startSocketTransport(port: port, handler: dispatchCommand)
    // sendLog can't go before transport is up, but we can log once connected via Protocol.swift
  } catch {
    fputs("Failed to start socket transport: \(error.localizedDescription)\n", stderr)
    exit(1)
  }
} else {
  sendReady()
  readCommands(handler: dispatchCommand)
}

RunLoop.main.run()
