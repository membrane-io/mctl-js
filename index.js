"use strict";

const path = require("path");

module.exports.mctlPath = path.join(
  __dirname,
  `../bin/mctl${process.platform === "win32" ? ".exe" : ""}`
);
