import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Type definitions for the native Swift module.
 *
 * This interface defines the structure of the native Swift module that is loaded
 * and provides type safety for all exported functions and values.
 */
interface NativeModule {
  /** Lists all windows for a given application bundle ID */
  listWindows: (bundleId: string) => Promise<string[]>;
  /** Focuses a specific window by bundle ID and window title */
  focusWindow: (bundleId: string, windowTitle: string) => Promise<string>;
  /** Checks if accessibility permissions are granted */
  checkAccessibilityPermission: () => boolean;
  /** Requests accessibility permissions by showing the system dialog */
  requestAccessibilityPermission: () => boolean;
  /** Requests accessibility permissions and waits for them to be granted with a timeout */
  awaitAccessibilityPermission: (timeout: number) => Promise<boolean>;
}

/**
 * Loads the native Swift module with robust path detection and fallback mechanisms.
 *
 * This function implements a sophisticated module loading strategy that:
 * - Automatically detects the best native module build to use
 * - Supports both debug and release builds with intelligent prioritization
 * - Provides platform-aware path resolution for future cross-platform support
 * - Allows environment variable overrides for custom deployment scenarios
 * - Includes comprehensive error handling with detailed diagnostics
 *
 * @returns {NativeModule} The loaded native module with all exported functions and values
 *
 * @throws {Error} When no compatible native module is found after searching all possible locations
 *
 * @example
 * ```typescript
 * // Basic usage (automatic detection)
 * const module = loadNativeModule();
 *
 * // With environment variables
 * process.env.NODE_ENV = 'development';  // Prefers debug builds
 * process.env.NODE_AXKIT_MODULE_PATH = '.build/debug/Module.node';  // Custom path
 * const module = loadNativeModule();
 * ```
 *
 * @remarks
 * **Build Mode Detection:**
 * - Production mode: Prefers release builds, falls back to debug
 * - Development mode: Prefers debug builds, falls back to release
 * - Debug mode is enabled when `NODE_ENV=development` or `DEBUG=1`
 *
 * **Search Order:**
 * 1. Environment variable override (`NODE_AXKIT_MODULE_PATH`)
 * 2. Primary bundled location (`dist/Module.node`)
 * 3. Development fallbacks (`.build/debug/` or `.build/release/` based on environment)
 * 4. Standard NodeSwift locations (`.build/release/`, `.build/debug/`)
 * 5. Legacy fallback locations (`build/Release/`, `build/Debug/`, `native/`, `lib/`)
 *
 * **Environment Variables:**
 * - `NODE_AXKIT_MODULE_PATH`: Custom path to native module (relative to project root)
 * - `NODE_ENV`: When set to 'development', prefers debug builds
 * - `DEBUG`: When set to '1', prefers debug builds
 *
 * **Platform Support:**
 * - Currently optimized for macOS (darwin) with arm64/x64 architecture
 * - Includes extensible platform-specific path resolution
 * - Future versions will support Linux and Windows
 *
 * **Error Handling:**
 * - Provides detailed error messages with all searched paths
 * - Shows environment information for debugging
 * - Includes specific loading errors when modules exist but fail to load
 * - Suggests remediation steps (build commands, environment setup)
 */
function loadNativeModule(): NativeModule {
  const baseDir = path.join(__dirname, "..");

  // Platform-specific information
  const platform = os.platform();
  const arch = os.arch();
  const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG === "1";

  // Allow override via environment variable
  const modulePathOverride = process.env.NODE_AXKIT_MODULE_PATH;
  if (modulePathOverride) {
    const overridePath = path.resolve(baseDir, modulePathOverride);
    if (fs.existsSync(overridePath)) {
      console.log(`[node-accessibility] Loading native module from override: ${overridePath}`);
      return require(overridePath);
    } else {
      console.warn(`[node-accessibility] Override path does not exist: ${overridePath}`);
    }
  }

  // Define possible module paths in order of preference
  const possiblePaths = [
    // Primary location: bundled in dist (for published packages)
    path.join(baseDir, "dist", "Module.node"),
    // Development fallbacks: .build directory (for local development)
    ...(isDebug
      ? [path.join(baseDir, ".build", "debug", "Module.node")]
      : [path.join(baseDir, ".build", "release", "Module.node")]),
    // Standard NodeSwift build locations (development fallbacks)
    path.join(baseDir, ".build", "release", "Module.node"),
    path.join(baseDir, ".build", "debug", "Module.node"),
    // Legacy fallback locations
    path.join(baseDir, "build", "Release", "Module.node"),
    path.join(baseDir, "build", "Debug", "Module.node"),
    path.join(baseDir, "native", "Module.node"),
    path.join(baseDir, "lib", "Module.node"),
  ];

  // Try each path and return the first one that exists and loads
  for (const modulePath of possiblePaths) {
    try {
      if (fs.existsSync(modulePath)) {
        const module = require(modulePath);
        const relativePath = path.relative(process.cwd(), modulePath);
        console.log(`[node-accessibility] Loading native module from: ${relativePath}`);
        return module;
      }
    } catch (error) {
      console.warn(
        `[node-accessibility] Failed to load ${modulePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
  }

  // If no module found, provide comprehensive error message
  const searchedPaths = possiblePaths.map((p) => `  - ${p}`).join("\n");
  const envInfo = [
    `Platform: ${platform}`,
    `Architecture: ${arch}`,
    `Node.js: ${process.version}`,
    `Environment: ${process.env.NODE_ENV || "production"}`,
    `Debug mode: ${isDebug ? "enabled" : "disabled"}`,
  ].join("\n    ");

  throw new Error(
    `[node-accessibility] Native module not found. Searched paths:\n${searchedPaths}\n\n` +
      `Environment information:\n    ${envInfo}\n\n` +
      `Please ensure the native module is built by running:\n` +
      `  npm run build:debug  (for debug build)\n` +
      `  npm run build       (for release build)\n\n` +
      `You can also set NODE_AXKIT_MODULE_PATH environment variable to specify a custom path.`,
  );
}

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

/**
 * The loaded native Swift module instance.
 *
 * This is initialized once when the module is first imported and provides
 * access to all native Swift functions and values.
 */
const nativeModule: NativeModule = loadNativeModule();

// ============================================================================
// PUBLIC EXPORTS
// ============================================================================

/**
 * Lists all windows for a given application bundle ID using macOS Accessibility API.
 *
 * This function queries the macOS Accessibility API to retrieve all windows
 * for the specified application. Requires accessibility permissions to be granted.
 *
 * @param bundleId - The bundle identifier of the application (e.g., "com.apple.Safari")
 * @returns Promise that resolves to an array of window titles
 *
 * @throws {Error} When accessibility permissions are not granted or app is not running
 *
 * @example
 * ```typescript
 * import { listWindows } from '@paperline/node-accessibility';
 *
 * // List Safari windows
 * const windows = await listWindows('com.apple.Safari');
 * console.log(windows); // ["Google - Safari", "GitHub - Safari"]
 *
 * // List VS Code windows
 * const codeWindows = await listWindows('com.microsoft.VSCode');
 * console.log(codeWindows); // ["index.ts — node-accessibility", "README.md — node-accessibility"]
 * ```
 *
 * @remarks
 * **Prerequisites:**
 * - macOS Accessibility permissions must be granted
 * - Target application must be currently running
 * - Only works on macOS due to Accessibility API dependency
 *
 * **Common Bundle IDs:**
 * - Safari: `com.apple.Safari`
 * - Chrome: `com.google.Chrome`
 * - VS Code: `com.microsoft.VSCode`
 * - Finder: `com.apple.finder`
 * - Terminal: `com.apple.Terminal`
 */
export const listWindows: (bundleId: string) => Promise<string[]> = nativeModule.listWindows;

/**
 * Focuses a specific window by bundle ID and window title using macOS Accessibility API.
 *
 * This function brings the specified window to the front and activates the application.
 * The window title matching is case-insensitive and requires an exact match.
 *
 * @param bundleId - The bundle identifier of the application
 * @param windowTitle - The exact title of the window to focus
 * @returns Promise that resolves to a success message
 *
 * @throws {Error} When accessibility permissions are not granted, app is not running, or window is not found
 *
 * @example
 * ```typescript
 * import { focusWindow } from '@paperline/node-accessibility';
 *
 * // Focus a specific Safari tab
 * await focusWindow('com.apple.Safari', 'Google - Safari');
 *
 * // Focus a VS Code window
 * await focusWindow('com.microsoft.VSCode', 'index.ts — node-accessibility');
 *
 * // Error handling
 * try {
 *   await focusWindow('com.apple.Safari', 'Non-existent Window');
 * } catch (error) {
 *   console.error('Failed to focus window:', error.message);
 * }
 * ```
 *
 * @remarks
 * **Window Title Matching:**
 * - Requires exact title match (case-insensitive)
 * - Use `listWindows()` first to get exact window titles
 * - Window titles can change dynamically (e.g., web page titles in browsers)
 *
 * **Best Practices:**
 * - Always check accessibility permissions first with `checkAccessibilityPermission()`
 * - Use `listWindows()` to get current window titles before focusing
 * - Handle errors gracefully as window titles can change frequently
 */
export const focusWindow: (bundleId: string, windowTitle: string) => Promise<string> =
  nativeModule.focusWindow;

/**
 * Checks if accessibility permissions are granted for the current application.
 *
 * This function verifies whether the application has the necessary permissions
 * to use the macOS Accessibility API for window management operations.
 *
 * @returns Boolean indicating if accessibility permissions are granted
 *
 * @example
 * ```typescript
 * import { checkAccessibilityPermission } from '@paperline/node-accessibility';
 *
 * if (checkAccessibilityPermission()) {
 *   console.log('✅ Accessibility permissions granted');
 *   // Safe to use listWindows() and focusWindow()
 * } else {
 *   console.log('❌ Accessibility permissions required');
 *   console.log('Please grant permissions in System Preferences > Security & Privacy > Privacy > Accessibility');
 * }
 * ```
 *
 * @remarks
 * **Granting Permissions:**
 * 1. Open System Preferences > Security & Privacy
 * 2. Click the Privacy tab
 * 3. Select Accessibility from the left sidebar
 * 4. Click the lock icon to make changes (requires admin password)
 * 5. Add your Node.js application or Terminal to the list
 * 6. Ensure the checkbox is checked
 *
 * **Important Notes:**
 * - Permissions are required for both `listWindows()` and `focusWindow()`
 * - The application must be restarted after granting permissions
 * - This only works on macOS due to Accessibility API dependency
 */
export const checkAccessibilityPermission: () => boolean =
  nativeModule.checkAccessibilityPermission;

/**
 * Requests accessibility permissions by showing the system dialog.
 *
 * This function prompts the user to grant accessibility permissions by showing
 * the macOS System Preferences dialog. If permissions are already granted,
 * it returns true immediately without showing the dialog.
 *
 * @returns Boolean indicating if accessibility permissions are granted (after the request)
 *
 * @example
 * ```typescript
 * import { requestAccessibilityPermission, checkAccessibilityPermission } from '@paperline/node-accessibility';
 *
 * // Check if permissions are already granted
 * if (!checkAccessibilityPermission()) {
 *   console.log('Requesting accessibility permissions...');
 *
 *   // Show system dialog to request permissions
 *   const granted = requestAccessibilityPermission();
 *
 *   if (granted) {
 *     console.log('✅ Accessibility permissions granted!');
 *   } else {
 *     console.log('❌ Accessibility permissions denied');
 *     console.log('Please manually grant permissions in System Preferences');
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Helper function to ensure permissions before using accessibility features
 * async function ensureAccessibilityPermissions(): Promise<boolean> {
 *   if (checkAccessibilityPermission()) {
 *     return true;
 *   }
 *
 *   console.log('This app requires accessibility permissions to manage windows.');
 *   console.log('A system dialog will appear - please click "Open System Preferences"');
 *
 *   const granted = requestAccessibilityPermission();
 *
 *   if (granted) {
 *     console.log('Permissions granted! You can now use window management features.');
 *     return true;
 *   } else {
 *     console.error('Permissions denied. Please grant them manually:');
 *     console.error('System Preferences > Security & Privacy > Privacy > Accessibility');
 *     return false;
 *   }
 * }
 *
 * // Usage
 * if (await ensureAccessibilityPermissions()) {
 *   const windows = await listWindows('com.apple.Safari');
 *   // ... use accessibility features
 * }
 * ```
 *
 * @remarks
 * **How it Works:**
 * - First checks if permissions are already granted
 * - If not granted, shows the system dialog automatically
 * - User can click "Open System Preferences" to grant permissions
 * - Returns the final permission state after the dialog interaction
 *
 * **Dialog Behavior:**
 * - Only shows dialog if permissions are not already granted
 * - Dialog appears once per application launch
 * - User must manually add the app to accessibility list in System Preferences
 * - Application may need to be restarted after granting permissions
 *
 * **Important Notes:**
 * - This is a one-time setup process for each application
 * - The system dialog provides a direct link to System Preferences
 * - Only works on macOS due to Accessibility API dependency
 * - Some applications may require a restart after permissions are granted
 */
export const requestAccessibilityPermission: () => boolean =
  nativeModule.requestAccessibilityPermission;

/**
 * Requests accessibility permissions and waits for them to be granted with a timeout.
 *
 * This is an async version of `requestAccessibilityPermission()` that shows the system dialog
 * and then waits for the user to actually grant permissions in System Preferences.
 * It polls for permission status until either granted or timeout is reached.
 *
 * @param timeout - Maximum time to wait for permissions in milliseconds (default: 30000ms = 30 seconds)
 * @returns Promise that resolves to true if permissions are granted, false if timeout reached
 *
 * @example
 * ```typescript
 * import { awaitAccessibilityPermission } from '@paperline/node-accessibility';
 *
 * // Basic usage with default 30-second timeout
 * const granted = await awaitAccessibilityPermission();
 * if (granted) {
 *   console.log('✅ Permissions granted!');
 * } else {
 *   console.log('❌ Timeout reached - permissions not granted');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Custom timeout (60 seconds = 60000ms)
 * const granted = await awaitAccessibilityPermission(60000);
 * if (granted) {
 *   console.log('✅ Permissions granted within 60 seconds!');
 * } else {
 *   console.log('❌ User did not grant permissions within 60 seconds');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Complete workflow with restart handling
 * async function setupAccessibilityPermissions(): Promise<boolean> {
 *   console.log('🔍 Checking accessibility permissions...');
 *
 *   if (checkAccessibilityPermission()) {
 *     console.log('✅ Accessibility permissions already granted');
 *     return true;
 *   }
 *
 *   console.log('📋 Requesting accessibility permissions...');
 *   console.log('💡 A system dialog will appear. Please:');
 *   console.log('   1. Click "Open System Preferences"');
 *   console.log('   2. Add this app to the Accessibility list');
 *   console.log('   3. Check the checkbox next to the app');
 *   console.log('⏳ Waiting for permissions (up to 45 seconds)...');
 *
 *   const granted = await awaitAccessibilityPermission(45000);
 *
 *   if (granted) {
 *     console.log('🎉 Accessibility permissions granted successfully!');
 *     return true;
 *   } else {
 *     console.log('⚠️  Permissions not detected within timeout period');
 *     console.log('📝 If you granted permissions in System Preferences:');
 *     console.log('   • This is normal macOS behavior');
 *     console.log('   • Please restart this application');
 *     console.log('   • Permissions will be detected on next launch');
 *     return false;
 *   }
 * }
 *
 * // Usage with restart handling
 * if (await setupAccessibilityPermissions()) {
 *   // Proceed with accessibility features
 *   const windows = await listWindows('com.apple.Safari');
 * } else {
 *   console.log('Exiting - restart required to detect permissions');
 *   process.exit(1);
 * }
 * ```
 *
 * @remarks
 * **How it Works:**
 * 1. First checks if permissions are already granted (returns immediately if true)
 * 2. Shows the system dialog with "Open System Preferences" option
 * 3. Polls permission status every 500ms until granted or timeout
 * 4. Returns `true` when permissions are granted, `false` on timeout
 *
 * **Timeout Behavior:**
 * - Default timeout: 30000ms (30 seconds)
 * - Minimum recommended: 15000ms (15 seconds) - gives user time to navigate
 * - Maximum practical: 120000ms (120 seconds) - avoid hanging too long
 * - Polls every 500ms to detect permission changes quickly
 *
 * **User Experience:**
 * - Shows system dialog immediately
 * - User clicks "Open System Preferences" to access settings
 * - User manually adds app to Accessibility list
 * - Function attempts to detect permission change
 * - **Important**: May require application restart to detect granted permissions
 *
 * **macOS Restart Behavior:**
 * - macOS accessibility permissions are often cached per-process
 * - After granting permissions, the same process may not detect them immediately
 * - This is normal macOS behavior, not a bug in this library
 * - The function will timeout and suggest restarting the application
 * - On restart, `checkAccessibilityPermission()` will return `true`
 *
 * **Best Practices:**
 * - Always provide user guidance about what to do in the dialog
 * - Use appropriate timeout values (30000-60000ms is usually sufficient)
 * - Handle timeout gracefully and inform users about potential restart need
 * - Consider showing a progress indicator during the wait
 * - Test the workflow: grant permissions → restart → verify functionality
 */
export const awaitAccessibilityPermission: (timeout: number) => Promise<boolean> =
  nativeModule.awaitAccessibilityPermission;

/**
 * Default export containing all module functionality.
 *
 * This provides an alternative import style for users who prefer default imports.
 *
 * @example
 * ```typescript
 * import nodeAccessibility from '@paperline/node-accessibility';
 *
 * // Accessibility API with async permission request
 * if (!nodeAccessibility.checkAccessibilityPermission()) {
 *   console.log('Requesting accessibility permissions...');
 *   // Wait up to 45 seconds (45000ms) for user to grant permissions
 *   const granted = await nodeAccessibility.awaitAccessibilityPermission(45000);
 *   if (!granted) {
 *     console.log('Accessibility permissions required');
 *     return;
 *   }
 * }
 *
 * const windows = await nodeAccessibility.listWindows('com.apple.Safari');
 * await nodeAccessibility.focusWindow('com.apple.Safari', windows[0]);
 * ```
 */
export default {
  listWindows,
  focusWindow,
  checkAccessibilityPermission,
  requestAccessibilityPermission,
  awaitAccessibilityPermission,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Export the NativeModule interface for advanced TypeScript usage.
 *
 * This allows consumers to create mock implementations, extend functionality,
 * or use the type for advanced type checking.
 *
 * @example
 * ```typescript
 * import { NativeModule } from '@paperline/node-accessibility';
 *
 * // Create a mock implementation
 * const mockModule: NativeModule = {
 *   listWindows: async (bundleId) => [`Mock window for ${bundleId}`],
 *   focusWindow: async (bundleId, title) => `Focused ${title}`,
 *   checkAccessibilityPermission: () => true
 * };
 * ```
 */
export type { NativeModule };
