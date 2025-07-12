import AppKit
import ApplicationServices
import NodeAPI

// Define custom errors for better handling and clear feedback.
enum FocusError: Error, LocalizedError {
    case noAccessibilityPermission
    case appNotRunning(String)
    case couldNotGetWindows(String)
    case noWindowFound(String)

    var errorDescription: String? {
        switch self {
        case .noAccessibilityPermission:
            return
                "Accessibility permission not granted. Please grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility."
        case .appNotRunning(let bundleId):
            return "App with bundle ID '\(bundleId)' is not running."
        case .couldNotGetWindows(let bundleId):
            return "Could not read windows of app with bundle ID '\(bundleId)'."
        case .noWindowFound(let titleSnippet):
            return "No matching window found for title snippet '\(titleSnippet)'."
        }
    }
}

/// Structure representing a window with its properties
struct WindowInfo {
    let title: String
    let index: Int
}

/// A structure to encapsulate the logic for accessibility operations
struct AccessibilityManager {
    /// Checks if the script has accessibility permissions
    static func checkAccessibilityPermission() -> Bool {
        return AXIsProcessTrusted()
    }

    /// Requests accessibility permission by showing the system dialog
    static func requestAccessibilityPermission() -> Bool {
        let options = ["AXTrustedCheckOptionPrompt": true] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    /// Requests accessibility permission and waits for it to be granted with a timeout
    static func awaitAccessibilityPermission(timeout: Int = 30_000) async -> Bool {
        // First check if already granted
        if checkAccessibilityPermission() {
            return true
        }

        // Show the dialog
        let options = ["AXTrustedCheckOptionPrompt": true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)

        // Give the system a moment to process the dialog
        try? await Task.sleep(nanoseconds: 100_000_000)  // 100ms

        // Check immediately after the dialog
        if checkAccessibilityPermission() {
            return true
        }

        // Poll for permission with timeout
        let startTime = Date()
        let timeoutInterval = TimeInterval(timeout) / 1000.0  // Convert ms to seconds

        while Date().timeIntervalSince(startTime) < timeoutInterval {
            if checkAccessibilityPermission() {
                return true
            }

            // Wait 500ms before checking again
            try? await Task.sleep(nanoseconds: 500_000_000)
        }

        return false  // Timeout reached
    }

    /// Finds a running application by bundle ID
    static func findApplication(bundleId: String) throws -> NSRunningApplication {
        guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: bundleId).first else {
            throw FocusError.appNotRunning(bundleId)
        }
        return app
    }

    /// Gets all windows for an application
    static func getWindows(for app: NSRunningApplication) throws -> [AXUIElement] {
        let appElement = AXUIElementCreateApplication(app.processIdentifier)
        var windowsCF: CFTypeRef?
        let result = AXUIElementCopyAttributeValue(appElement, kAXWindowsAttribute as CFString, &windowsCF)
        guard result == .success, let windows = windowsCF as? [AXUIElement] else {
            throw FocusError.couldNotGetWindows(app.bundleIdentifier ?? "unknown")
        }
        return windows
    }

    /// Gets the title of a window
    static func getWindowTitle(_ window: AXUIElement) -> String? {
        var titleCF: CFTypeRef?
        guard AXUIElementCopyAttributeValue(window, kAXTitleAttribute as CFString, &titleCF) == .success,
            let title = titleCF as? String
        else {
            return nil
        }
        return title
    }

    /// Lists all windows for an application
    static func listWindows(bundleId: String) throws -> [WindowInfo] {
        guard checkAccessibilityPermission() else {
            throw FocusError.noAccessibilityPermission
        }

        let app = try findApplication(bundleId: bundleId)
        let windows = try getWindows(for: app)

        var windowList: [WindowInfo] = []
        for (index, window) in windows.enumerated() {
            let title = getWindowTitle(window) ?? "<No title>"
            windowList.append(WindowInfo(title: title, index: index))
        }

        return windowList
    }

    /// Focuses a specific window by title
    static func focusWindow(bundleId: String, windowTitle: String) throws {
        guard checkAccessibilityPermission() else {
            throw FocusError.noAccessibilityPermission
        }

        let app = try findApplication(bundleId: bundleId)
        let windows = try getWindows(for: app)

        for window in windows {
            guard let title = getWindowTitle(window) else { continue }

            // Exact match (case insensitive)
            if title.lowercased() == windowTitle.lowercased() {
                AXUIElementPerformAction(window, kAXRaiseAction as CFString)
                app.activate(options: [.activateAllWindows])
                return
            }
        }

        throw FocusError.noWindowFound(windowTitle)
    }
}

#NodeModule(exports: [
    "listWindows": try NodeFunction { (bundleId: String) in
        print("listing windows for \(bundleId)...")
        let windows = try AccessibilityManager.listWindows(bundleId: bundleId)
        let windowTitles = windows.map { $0.title as any NodeValueConvertible }
        return windowTitles
    },
    "focusWindow": try NodeFunction { (bundleId: String, windowTitle: String) in
        print("focusing window '\(windowTitle)' for \(bundleId)...")
        try AccessibilityManager.focusWindow(bundleId: bundleId, windowTitle: windowTitle)
        return "Successfully focused window '\(windowTitle)'"
    },
    "checkAccessibilityPermission": try NodeFunction { () in
        return AccessibilityManager.checkAccessibilityPermission()
    },
    "requestAccessibilityPermission": try NodeFunction { () in
        return AccessibilityManager.requestAccessibilityPermission()
    },
    "awaitAccessibilityPermission": try NodeFunction { (timeout: Int) in
        return await AccessibilityManager.awaitAccessibilityPermission(timeout: timeout)
    },
])
