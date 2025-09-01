# node-accessibility

A NodeJS module with native Swift code for macOS Accessibility API integration, providing TypeScript interfaces for seamless window management and automation.

## Features

- **macOS Accessibility API**: List and focus windows programmatically
- **Permission Management**: Request and wait for accessibility permissions
- **Native Swift Performance**: Leverage Swift's performance for system operations
- **TypeScript Support**: Full TypeScript definitions for type safety and IntelliSense
- **Async Support**: Properly typed async functions with Promise support
- **Cross-Platform Ready**: Designed for macOS (Swift runtime required)

## Installation

```bash
npm install @paperline/node-accessibility
```

## Usage

### TypeScript/ES6 Imports

```typescript
import { 
  checkAccessibilityPermission, 
  awaitAccessibilityPermission,
  listWindows, 
  focusWindow 
} from '@paperline/node-accessibility';

// Check if accessibility permissions are granted
if (!checkAccessibilityPermission()) {
  console.log('Requesting accessibility permissions...');
  
  // Request permissions and wait up to 60 seconds
  const granted = await awaitAccessibilityPermission(60000);
  if (!granted) {
    console.log('Permissions required - restart app after granting');
    return;
  }
}

// List all Safari windows
const windows = await listWindows('com.apple.Safari');
console.log('Safari windows:', windows);

// Focus a specific window
if (windows.length > 0) {
  await focusWindow('com.apple.Safari', windows[0]);
}
```

### CommonJS Require

```javascript
const { 
  checkAccessibilityPermission, 
  awaitAccessibilityPermission,
  listWindows, 
  focusWindow 
} = require('@paperline/node-accessibility');

// Check permissions and use async/await
async function main() {
  if (!checkAccessibilityPermission()) {
    const granted = await awaitAccessibilityPermission(60000);
    if (!granted) return;
  }
  
  const windows = await listWindows('com.apple.finder');
  if (windows.length > 0) {
    await focusWindow('com.apple.finder', windows[0]);
  }
}

main();
```

## API Reference

### `checkAccessibilityPermission(): boolean`
Check if accessibility permissions are granted.
- **Returns:** `true` if permissions are granted, `false` otherwise

### `requestAccessibilityPermission(): boolean`
Request accessibility permissions with system dialog.
- **Returns:** Current permission state (may require app restart to detect changes)

### `awaitAccessibilityPermission(timeout: number): Promise<boolean>`
Request permissions and wait for them to be granted.
- **Parameters:** `timeout` in milliseconds (default: 30000)
- **Returns:** Promise that resolves to `true` if granted, `false` if timeout

### `listWindows(bundleId: string): Promise<string[]>`
List all windows for a specific application.
- **Parameters:** Application bundle ID (e.g., "com.apple.Safari")
- **Returns:** Promise that resolves to array of window titles

### `focusWindow(bundleId: string, windowTitle: string): Promise<string>`
Focus a specific window.
- **Parameters:** Application bundle ID and exact window title
- **Returns:** Promise that resolves to success message

## Common Bundle IDs

- **Finder**: `com.apple.finder`
- **Safari**: `com.apple.Safari`
- **Chrome**: `com.google.Chrome`
- **VS Code**: `com.microsoft.VSCode`
- **Terminal**: `com.apple.Terminal`
- **iPhone Simulator**: `com.apple.iphonesimulator`
- **Xcode**: `com.apple.dt.Xcode`

## Permission Setup

1. **First run**: Your app will show a system dialog requesting accessibility permissions
2. **Grant permissions**: Click "Open System Preferences" and add your app to the Accessibility list
3. **Restart**: You may need to restart your application for permissions to be detected
4. **Verify**: Use `checkAccessibilityPermission()` to confirm permissions are granted

## Examples

See the [examples](./examples/) directory for comprehensive usage examples:
- **Basic Usage**: Complete TypeScript example with 7 different accessibility scenarios
- **Permission handling**: Request and wait for permissions
- **Window management**: List and focus windows across multiple applications

## Development

### Building the Package

```bash
# Build both Swift and TypeScript
pnpm run build

# Build Swift only (debug)
pnpm run build:swift:debug

# Build TypeScript only
pnpm run build:ts

# Development build (debug mode)
pnpm run build:debug

# Watch mode for development
pnpm run dev
```

### Testing

```bash
pnpm run test
```

### Cleaning

```bash
pnpm run clean
```

## Requirements

- Node.js 16+
- macOS (for Accessibility API)
- Swift runtime (included with macOS)
- TypeScript 5.8+ (for development)
- Accessibility permissions (granted on first use)

## License

[MIT](LICENSE)
