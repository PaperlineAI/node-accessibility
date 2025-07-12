#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

interface FileConfig {
  src: string;
  desc: string;
  optional?: boolean;
}

/**
 * Copy the native Module.node file and its dependencies to the dist directory
 */
function copyNativeModule(sourceDir: string): boolean {
  const buildDir = path.join(".build", sourceDir);
  const destDir = "dist";

  const filesToCopy: FileConfig[] = [
    { src: "Module.node", desc: "native module" },
    { src: "libNodeAPI.dylib", desc: "NodeAPI library" },
    { src: "libModule.dylib", desc: "Module library", optional: true },
  ];

  // Ensure dist directory exists
  fs.mkdirSync(destDir, { recursive: true });

  let copiedFiles = 0;
  let totalSize = 0;

  for (const file of filesToCopy) {
    const sourceFile = path.join(buildDir, file.src);
    const destFile = path.join(destDir, file.src);

    try {
      if (!fs.existsSync(sourceFile)) {
        if (file.optional) {
          console.log(`⚠️  Optional ${file.desc} not found at ${sourceFile}`);
          continue;
        } else {
          console.log(`⚠️  No ${sourceDir} build found at ${sourceFile}`);
          return false;
        }
      }

      fs.copyFileSync(sourceFile, destFile);

      const stats = fs.statSync(destFile);
      const fileSizeKB = Math.round(stats.size / 1024);
      totalSize += fileSizeKB;

      console.log(`✅ Copied ${file.desc} to dist/ (${fileSizeKB} KB)`);
      copiedFiles++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to copy ${file.desc}:`, errorMessage);
      return false;
    }
  }

  if (copiedFiles > 0) {
    console.log(`🎉 Successfully copied ${copiedFiles} file(s) to dist/ (${totalSize} KB total)`);
    return true;
  } else {
    console.log(`❌ No files were copied for ${sourceDir} build`);
    return false;
  }
}

// Main execution
const buildType = process.argv[2] || "release";
const success = copyNativeModule(buildType);

process.exit(success ? 0 : 1);
