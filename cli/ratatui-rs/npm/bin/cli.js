#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { getBinaryPath } = require("./install.js");

const binaryPath = getBinaryPath();

try {
  execFileSync(binaryPath, process.argv.slice(2), { stdio: "inherit" });
} catch (error) {
  if (error.status !== undefined) {
    process.exit(error.status);
  }
  throw error;
}
