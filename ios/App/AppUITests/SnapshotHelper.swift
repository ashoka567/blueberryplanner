import Foundation
import XCTest

var deviceLanguage = ""
var locale = ""

func setupSnapshot(_ app: XCUIApplication, waitForAnimations: Bool = true) {
    Snapshot.setupSnapshot(app, waitForAnimations: waitForAnimations)
}

func snapshot(_ name: String, waitForLoadingIndicator: Bool = true) {
    if waitForLoadingIndicator {
        Snapshot.snapshot(name, waitForLoadingIndicator: waitForLoadingIndicator)
    } else {
        Snapshot.snapshot(name)
    }
}

enum SnapshotError: Error, LocalizedError {
    case cannotDetectUser
    case cannotFindHomeDirectory
    case cannotFindSimulatorHomeDirectory
    case cannotAccessSimulatorHomeDirectory(String)
    case cannotRunOnPhysicalDevice
}

@objcMembers
open class Snapshot: NSObject {
    static var app: XCUIApplication?
    static var waitForAnimations = true
    static var cacheDirectory: URL?
    static var screenshotsDirectory: URL? {
        return cacheDirectory
    }

    open class func setupSnapshot(_ app: XCUIApplication, waitForAnimations: Bool = true) {
        Snapshot.app = app
        Snapshot.waitForAnimations = waitForAnimations

        do {
            let cacheDir = try pathPrefix()
            Snapshot.cacheDirectory = cacheDir
            setLanguage(app)
            setLocale(app)
            setLaunchArguments(app)
        } catch {
            NSLog("Snapshot setup error: \(error)")
        }
    }

    class func setLanguage(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("CacheDirectory is not set - probably running on a physical device?")
            return
        }
        let path = cacheDirectory.appendingPathComponent("language.txt")
        do {
            let trimCharacterSet = CharacterSet.whitespacesAndNewlines
            deviceLanguage = try String(contentsOf: path, encoding: .utf8).trimmingCharacters(in: trimCharacterSet)
            app.launchArguments += ["-AppleLanguages", "(\(deviceLanguage))"]
        } catch {
            NSLog("Couldn't detect/set language...")
        }
    }

    class func setLocale(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("CacheDirectory is not set - probably running on a physical device?")
            return
        }
        let path = cacheDirectory.appendingPathComponent("locale.txt")
        do {
            let trimCharacterSet = CharacterSet.whitespacesAndNewlines
            locale = try String(contentsOf: path, encoding: .utf8).trimmingCharacters(in: trimCharacterSet)
        } catch {
            NSLog("Couldn't detect/set locale...")
        }
        if locale.isEmpty && !deviceLanguage.isEmpty {
            locale = Locale(identifier: deviceLanguage).identifier
        }
        if !locale.isEmpty {
            app.launchArguments += ["-AppleLocale", "\"\(locale)\""]
        }
    }

    class func setLaunchArguments(_ app: XCUIApplication) {
        guard let cacheDirectory = self.cacheDirectory else {
            NSLog("CacheDirectory is not set - probably running on a physical device?")
            return
        }
        let path = cacheDirectory.appendingPathComponent("snapshot-launch_arguments.txt")
        app.launchArguments += ["-FASTLANE_SNAPSHOT", "YES", "-ui_testing"]
        do {
            let trimCharacterSet = CharacterSet.whitespacesAndNewlines
            let argsString = try String(contentsOf: path, encoding: .utf8).trimmingCharacters(in: trimCharacterSet)
            let res = argsString.components(separatedBy: "\n")
            app.launchArguments += res
        } catch {
            NSLog("Couldn't detect/set launch arguments...")
        }
    }

    open class func snapshot(_ name: String, waitForLoadingIndicator: Bool = true) {
        if waitForLoadingIndicator {
            waitForLoadingIndicatorToDisappear()
        }
        NSLog("snapshot: \(name)")
        if Snapshot.waitForAnimations {
            sleep(1)
        }
        guard let app = Snapshot.app else {
            NSLog("XCUIApplication is not set. Please call setupSnapshot(app) before snapshot().")
            return
        }
        let screenshot = app.windows.firstMatch.screenshot()
        guard var screenshotsDir = screenshotsDirectory else {
            NSLog("Screenshots directory not found")
            return
        }
        screenshotsDir.appendPathComponent("\(name).png")
        do {
            try screenshot.pngRepresentation.write(to: screenshotsDir)
        } catch {
            NSLog("Problem writing screenshot: \(name) to \(screenshotsDir.path)")
        }

        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
    }

    class func waitForLoadingIndicatorToDisappear() {
        guard let app = Snapshot.app else {
            NSLog("XCUIApplication is not set.")
            return
        }
        let query = app.statusBars.children(matching: .other).element(boundBy: 1).children(matching: .other)
        while query.count > 4 {
            sleep(1)
            NSLog("Number of loading indicators: \(query.count)")
        }
    }

    class func pathPrefix() throws -> URL? {
        let homeDir: URL
        #if targetEnvironment(simulator)
            guard let simulatorHostHome = ProcessInfo.processInfo.environment["SIMULATOR_HOST_HOME"] else {
                throw SnapshotError.cannotFindSimulatorHomeDirectory
            }
            guard let homeDirUrl = URL(string: "file://\(simulatorHostHome)") else {
                throw SnapshotError.cannotAccessSimulatorHomeDirectory(simulatorHostHome)
            }
            homeDir = homeDirUrl
        #else
            throw SnapshotError.cannotRunOnPhysicalDevice
        #endif
        return homeDir.appendingPathComponent("Library/Caches/tools.fastlane")
    }
}
