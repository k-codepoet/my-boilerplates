const fs = require("fs");
const path = require("path");
const os = require("os");

const BINARY_NAME = "mycli";

function getPlatformPackage() {
  const platform = os.platform();
  const arch = os.arch();

  const platformMap = {
    darwin: "darwin",
    linux: "linux",
    win32: "win32",
  };

  const archMap = {
    x64: "x64",
    arm64: "arm64",
  };

  const mappedPlatform = platformMap[platform];
  const mappedArch = archMap[arch];

  if (!mappedPlatform || !mappedArch) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  return `@mycli/cli-${mappedPlatform}-${mappedArch}`;
}

function getBinaryPath() {
  const packageName = getPlatformPackage();
  const binaryName = process.platform === "win32" ? `${BINARY_NAME}.exe` : BINARY_NAME;

  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packagePath);
    return path.join(packageDir, "bin", binaryName);
  } catch {
    // Fallback: check local bin directory
    const localBinary = path.join(__dirname, binaryName);
    if (fs.existsSync(localBinary)) {
      return localBinary;
    }
    throw new Error(
      `Could not find binary for ${packageName}. Please ensure the package is installed.`
    );
  }
}

// Run install check if executed directly
if (require.main === module) {
  try {
    const binaryPath = getBinaryPath();
    if (fs.existsSync(binaryPath)) {
      console.log(`Binary found: ${binaryPath}`);
    }
  } catch (error) {
    console.warn(`Warning: ${error.message}`);
    console.warn("Binary will be downloaded on first run if available.");
  }
}

module.exports = { getBinaryPath, getPlatformPackage };
