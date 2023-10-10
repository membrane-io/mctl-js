// @ts-check
"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process = require("child_process");

const download = require("./download");

const fsExists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const exec = util.promisify(child_process.exec);

const forceInstall = process.argv.includes("--force");
if (forceInstall) {
  console.log("--force, ignoring caches");
}

// Use the same mctl version number as this npm package
const VERSION = require("./package.json").version;
const BIN_PATH = path.join(__dirname, "bin");

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled rejection: ", promise, "reason:", reason);
});

async function getTarget() {
  const arch = process.env.npm_config_arch || os.arch();

  switch (os.platform()) {
    case "darwin":
      return arch === "arm64" ? "macos-arm" : "macos-x86";
    case "win32":
      return arch === "x64" ? "windows" : null;
    case "linux":
      return arch === "x64" ? "linux-x86" : null;
    default:
      throw new Error("Unknown platform: " + os.platform());
  }
}

async function main() {
  const binExists = await fsExists(BIN_PATH);
  if (!forceInstall && binExists) {
    console.log("bin/ folder already exists, exiting");
    process.exit(0);
  }

  if (!binExists) {
    await mkdir(BIN_PATH);
  }

  const target = await getTarget();
  if (!target) {
    const arch = process.env.npm_config_arch || os.arch();
    console.error(
      `Unsupported architechture "${arch}" for platform "${os.platform()}"`
    );
    process.exit(1);
  }
  const opts = {
    version: VERSION,
    token: process.env["GITHUB_TOKEN"],
    target: await getTarget(),
    destDir: BIN_PATH,
    force: forceInstall,
  };
  try {
    await download(opts);
  } catch (err) {
    console.error(`Downloading mctl failed: ${err.stack}`);
    process.exit(1);
  }
}

main();
