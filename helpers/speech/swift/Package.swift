// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "NexSpeech",
  platforms: [.macOS(.v13)],
  targets: [
    .executableTarget(
      name: "NexSpeech",
      path: "Sources/NexSpeech",
      swiftSettings: [
        .unsafeFlags(["-O", "-whole-module-optimization"])
      ]
    )
  ]
)
