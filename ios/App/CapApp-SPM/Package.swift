// swift-tools-version: 5.9
import PackageDescription

// Capacitor is provided entirely by CocoaPods (see Podfile).
// This package is an empty placeholder required by the Xcode project structure.
// DO NOT add capacitor-swift-pm or any other Capacitor dependency here.
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            path: "Sources/CapApp-SPM")
    ]
)
