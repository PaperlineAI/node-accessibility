# Basic Usage Example

This example demonstrates how to use the `@microcursor/node-axkit` package for macOS Accessibility API integration.

## Setup

1. **Install the package** (from the root of the node-axkit repository):
   ```bash
   cd examples/basic-usage
   npm install
   ```

2. **Build the main package** (if not already built):
   ```bash
   cd ../..
   pnpm run build
   ```

## Running the Example

### TypeScript
```bash
npm start
# or
npx tsx index.ts
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

## What This Example Demonstrates

The example includes **7 different accessibility scenarios**:

### 1. **Basic Permission Check**
- Check if accessibility permissions are currently granted
- Provide guidance for requesting permissions

### 2. **Request Permissions (Immediate)**
- Show the system dialog for permissions
- Handle immediate response (may require app restart)

### 3. **Request Permissions (With Wait)**
- Show the system dialog and wait for permissions
- Handle timeout scenarios gracefully

### 4. **List Application Windows**
- List all windows for iPhone Simulator
- Display window titles and count

### 5. **Focus Specific Window**
- Focus the first available window
- Handle cases where no windows are available

### 6. **Focus Random Window**
- Focus a randomly selected window
- Demonstrate working with multiple windows

### 7. **Work with Multiple Applications**
- Check windows for various common macOS apps
- Handle different application states

## Key Features Showcased

- ✅ **Permission Management**: Complete permission workflow
- ✅ **Window Listing**: List windows for any macOS application
- ✅ **Window Focusing**: Focus specific windows programmatically
- ✅ **Multiple Apps**: Work with different applications simultaneously
- ✅ **Type Safety**: Full TypeScript definitions and IntelliSense
- ✅ **Async Support**: Promise-based API with proper error handling
- ✅ **Timeout Handling**: Graceful timeout management
- ✅ **Error Handling**: Comprehensive error catching and user guidance

## Expected Output

The example will demonstrate:
1. **Permission Status**: Current accessibility permission state
2. **Permission Requests**: System dialog interactions
3. **Window Listing**: Available windows for various applications
4. **Window Focusing**: Successful window focus operations
5. **Multi-App Support**: Working with Finder, Safari, Simulator, etc.
6. **Error Handling**: Graceful handling of missing apps or permissions

## Prerequisites

- **macOS**: Required for Accessibility API
- **Node.js 16+**: For running the example
- **TypeScript**: For type-safe development
- **Accessibility Permissions**: May need to be granted during first run

## Common Bundle IDs Used

The example works with these applications:
- **Finder**: `com.apple.finder`
- **Safari**: `com.apple.Safari`
- **iPhone Simulator**: `com.apple.iphonesimulator`
- **Terminal**: `com.apple.Terminal`

## Files

- `package.json` - Example project configuration
- `index.ts` - TypeScript example with 7 accessibility scenarios
- `README.md` - This documentation 