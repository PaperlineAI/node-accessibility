# Build Documentation

## Overview

This package uses a hybrid approach combining Swift native code with TypeScript/JavaScript. The build process compiles Swift code into a native module and bundles it with the TypeScript output for distribution.

## Build Process

### 1. Swift Compilation
- **Command**: `npm run build:swift` or `npm run build:swift:debug`
- **Output**: Creates `.build/release/Module.node` or `.build/debug/Module.node`
- **Dependencies**: Also creates `libNodeAPI.dylib` and other Swift runtime libraries

### 2. TypeScript Compilation
- **Command**: `npm run build:ts`
- **Output**: Creates JavaScript files and type definitions in `dist/`

### 3. Native Module Bundling
- **Command**: `npm run copy:native` or `npm run copy:native:debug`
- **Output**: Copies `Module.node` and `libNodeAPI.dylib` to `dist/`
- **Purpose**: Bundles native dependencies with the compiled TypeScript for distribution

## Build Commands

### Production Build
```bash
pnpm run build
```
This runs: `build:swift` → `build:ts` → `copy:native`

### Development Build
```bash
pnpm run build:debug
```
This runs: `build:swift:debug` → `build:ts` → `copy:native:debug`

### Development with Watch Mode
```bash
pnpm run dev
```
This runs: `build:swift:debug` → `build:ts:dev` (with file watching)

### Individual Steps
```bash
# Swift compilation only
pnpm run build:swift          # Release build
pnpm run build:swift:debug    # Debug build

# TypeScript compilation only
pnpm run build:ts             # Standard build
pnpm run build:ts:dev         # Watch mode
pnpm run build:ts:fast        # Fast build (no DTS)

# Copy native files to dist
pnpm run copy:native          # From release build
pnpm run copy:native:debug    # From debug build

# Swift rebuilds (clean + build)
pnpm run rebuild:release      # Clean rebuild (release)
pnpm run rebuild:debug        # Clean rebuild (debug)

# Clean all build artifacts
pnpm run clean
```

## Directory Structure

```
node-axkit/
├── dist/                    # Distribution files (created by build)
│   ├── index.js            # Compiled TypeScript
│   ├── index.d.ts          # Type definitions
│   ├── Module.node         # Native Swift module
│   └── libNodeAPI.dylib    # Swift runtime library
├── .build/                 # Swift build artifacts
│   ├── release/            # Release build artifacts
│   └── debug/              # Debug build artifacts
├── Sources/AXKit/          # Swift source code
├── scripts/                # Build utilities
│   └── copy-native.js      # Native file copying script
└── Package.swift           # Swift package definition
```

## Module Loading Strategy

The module loading follows this priority order:

1. **Environment override** (`NODE_AXKIT_MODULE_PATH`)
2. **Primary bundled location** (`dist/Module.node`) ← **Main distribution path**
3. **Development fallbacks** (`.build/debug/` or `.build/release/`)
4. **Legacy fallback locations** (`build/`, `native/`, `lib/`)

## Dependencies

### Runtime Dependencies
- **Module.node**: The main native module containing Swift code
- **libNodeAPI.dylib**: Swift runtime library for Node.js integration
- **System libraries**: AppKit, Foundation, etc. (provided by macOS)

### Build Dependencies
- **node-swift**: Swift-to-Node.js bridge
- **TypeScript**: For compiling the TypeScript wrapper
- **Swift toolchain**: For compiling Swift code

## Platform Support

Currently supported:
- **macOS**: Full support (arm64, x86_64)

Future support planned:
- **Linux**: Planned
- **Windows**: Planned

## Troubleshooting

### Module Not Found
If you get "Native module not found" errors:
1. Run `pnpm run build` to ensure all files are built
2. Check that `dist/Module.node` exists
3. Verify that `dist/libNodeAPI.dylib` exists

### Dynamic Library Errors
If you get "Library not loaded" errors:
1. Ensure both `Module.node` and `libNodeAPI.dylib` are in the same directory
2. Run `pnpm run copy:native` to refresh the bundled files
3. Check that the files have execute permissions

### Build Errors
If Swift compilation fails:
1. Ensure Xcode Command Line Tools are installed
2. Verify Swift toolchain is available
3. Check that all Swift dependencies are resolved
4. Try cleaning and rebuilding: `pnpm run clean && pnpm run build`

## Development Workflow

### For Library Development
1. Make changes to Swift code in `Sources/AXKit/`
2. Run `pnpm run build:debug` for faster compilation
3. Test changes with `pnpm run test`
4. Use `pnpm run dev` for watch mode during development
5. Run `pnpm run build` for production-ready build

### For Package Distribution
1. Run `pnpm run build` to create production build
2. Files in `dist/` are ready for distribution
3. The `files` array in `package.json` determines what gets published
4. Use `pnpm publish` to publish to npm registry

## Environment Variables

- `NODE_AXKIT_MODULE_PATH`: Override path to native module
- `NODE_ENV=development`: Prefers debug builds in development
- `DEBUG=1`: Enables debug mode

## Notes

- The bundling approach ensures that consumers don't need to build Swift code
- All native dependencies are included in the `dist/` directory
- The module loader provides automatic fallbacks for development scenarios
- Build artifacts in `.build/` are not included in the published package 