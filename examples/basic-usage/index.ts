import {
  awaitAccessibilityPermission,
  checkAccessibilityPermission,
  focusWindow,
  listWindows,
  requestAccessibilityPermission,
} from "@paperline/node-accessibility";

/**
 * Example 1: Basic permission check
 */
async function basicPermissionCheck(): Promise<void> {
  console.log("🔍 Example 1: Basic Permission Check");

  const hasPermission = checkAccessibilityPermission();
  console.log(`  Accessibility permissions: ${hasPermission ? "✅ Granted" : "❌ Not granted"}`);

  if (!hasPermission) {
    console.log(
      "  💡 Use requestAccessibilityPermission() or awaitAccessibilityPermission() to request permissions",
    );
  }

  console.log();
}

/**
 * Example 2: Request permissions with immediate return
 */
async function requestPermissionsImmediate(): Promise<void> {
  console.log("📋 Example 2: Request Permissions (Immediate)");

  if (checkAccessibilityPermission()) {
    console.log("  ✅ Permissions already granted");
    return;
  }

  console.log("  Requesting permissions (shows dialog, returns immediately)...");
  const granted = requestAccessibilityPermission();

  if (granted) {
    console.log("  ✅ Permissions granted immediately");
  } else {
    console.log("  ❌ Permissions not granted - you may need to restart the application");
  }

  console.log();
}

/**
 * Example 3: Request permissions with timeout waiting
 */
async function requestPermissionsWithWait(): Promise<void> {
  console.log("⏳ Example 3: Request Permissions (Wait for Grant)");

  if (checkAccessibilityPermission()) {
    console.log("  ✅ Permissions already granted");
    return;
  }

  console.log("  Requesting permissions and waiting up to 30 seconds...");
  console.log("  💡 A dialog will appear - grant permissions in System Preferences");

  const granted = await awaitAccessibilityPermission(30_000);

  if (granted) {
    console.log("  ✅ Permissions granted!");
  } else {
    console.log("  ❌ Timeout reached - restart the application if you granted permissions");
  }

  console.log();
}

/**
 * Example 4: List windows for a specific application
 */
async function listApplicationWindows(): Promise<string[]> {
  console.log("📋 Example 4: List Application Windows");

  if (!checkAccessibilityPermission()) {
    console.log("  ❌ Accessibility permissions required");
    return [];
  }

  try {
    // List Simulator windows (commonly available on macOS development machines)
    const bundleId = "com.apple.iphonesimulator";
    console.log(`  Listing windows for: ${bundleId}`);

    const windows = await listWindows(bundleId);
    console.log(`  Found ${windows.length} windows:`);

    windows.forEach((window, index) => {
      console.log(`    ${index + 1}. "${window}"`);
    });

    return windows;
  } catch (error) {
    console.error("  ❌ Error listing windows:", error instanceof Error ? error.message : error);
    return [];
  } finally {
    console.log();
  }
}

/**
 * Example 5: Focus a specific window
 */
async function focusSpecificWindow(): Promise<void> {
  console.log("🎯 Example 5: Focus Specific Window");

  if (!checkAccessibilityPermission()) {
    console.log("  ❌ Accessibility permissions required");
    return;
  }

  try {
    const bundleId = "com.apple.iphonesimulator";
    const windows = await listWindows(bundleId);

    if (windows.length === 0) {
      console.log("  ℹ️  No windows found for iPhone Simulator");
      console.log("  💡 Try opening the iPhone Simulator app first");
      return;
    }

    // Focus the first window
    const windowToFocus = windows[0];
    console.log(`  Focusing window: "${windowToFocus}"`);

    const result = await focusWindow(bundleId, windowToFocus);
    console.log(`  ✅ ${result}`);
  } catch (error) {
    console.error("  ❌ Error focusing window:", error instanceof Error ? error.message : error);
  } finally {
    console.log();
  }
}

/**
 * Example 6: Focus a random window
 */
async function focusRandomWindow(): Promise<void> {
  console.log("🎲 Example 6: Focus Random Window");

  if (!checkAccessibilityPermission()) {
    console.log("  ❌ Accessibility permissions required");
    return;
  }

  try {
    const bundleId = "com.apple.iphonesimulator";
    const windows = await listWindows(bundleId);

    if (windows.length === 0) {
      console.log("  ℹ️  No windows found for iPhone Simulator");
      return;
    }

    // Focus a random window
    const randomIndex = Math.floor(Math.random() * windows.length);
    const windowToFocus = windows[randomIndex];
    console.log(
      `  Focusing random window (${randomIndex + 1}/${windows.length}): "${windowToFocus}"`,
    );

    const result = await focusWindow(bundleId, windowToFocus);
    console.log(`  ✅ ${result}`);
  } catch (error) {
    console.error("  ❌ Error focusing window:", error instanceof Error ? error.message : error);
  } finally {
    console.log();
  }
}

/**
 * Example 7: Work with multiple applications
 */
async function workWithMultipleApps(): Promise<void> {
  console.log("🏢 Example 7: Work with Multiple Applications");

  if (!checkAccessibilityPermission()) {
    console.log("  ❌ Accessibility permissions required");
    return;
  }

  const apps = [
    { name: "Finder", bundleId: "com.apple.finder" },
    { name: "Safari", bundleId: "com.apple.Safari" },
    { name: "iPhone Simulator", bundleId: "com.apple.iphonesimulator" },
    { name: "Terminal", bundleId: "com.apple.Terminal" },
  ];

  for (const app of apps) {
    try {
      console.log(`  Checking ${app.name} (${app.bundleId})...`);
      const windows = await listWindows(app.bundleId);
      console.log(`    Found ${windows.length} windows`);

      if (windows.length > 0) {
        console.log(`    Windows: ${windows.map((w) => `"${w}"`).join(", ")}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log();
}

/**
 * Main function to run all examples
 */
async function main(): Promise<void> {
  console.log("🚀 Node Accessibility API Examples\n");

  try {
    // Run all examples
    await basicPermissionCheck();
    await requestPermissionsImmediate();

    // Only run advanced examples if permissions are granted
    if (checkAccessibilityPermission()) {
      await listApplicationWindows();
      await focusSpecificWindow();
      await focusRandomWindow();
      await workWithMultipleApps();
    } else {
      console.log("⚠️  Skipping advanced examples - accessibility permissions not granted");
      console.log(
        "💡 Run requestPermissionsWithWait() or grant permissions manually in System Preferences",
      );
    }

    console.log("✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Example failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the examples
main();
