"use strict";
/**
 * PostToolUse hook: format the file Claude just wrote with the repo's prettier.
 *
 * Reads the hook payload from stdin and uses prettier's Node API directly, so
 * it needs neither `jq` (not installed here) nor any particular shell.
 * Formatting must never block an edit, so every failure path exits quietly.
 */
const fs = require("fs");
const path = require("path");

const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
]);

(async () => {
  try {
    // Strip a UTF-8 BOM; some Windows shells prepend one when piping.
    const raw = fs.readFileSync(0, "utf8").replace(/^\uFEFF/, "");
    if (!raw.trim()) return;

    const payload = JSON.parse(raw);
    const file =
      (payload.tool_response && payload.tool_response.filePath) ||
      (payload.tool_input && payload.tool_input.file_path);

    if (!file) return;
    if (!EXTENSIONS.has(path.extname(file).toLowerCase())) return;
    if (!fs.existsSync(file)) return;

    const prettier = require("prettier");
    const source = fs.readFileSync(file, "utf8");
    const config = await prettier.resolveConfig(file);
    const formatted = await prettier.format(source, {
      ...config,
      filepath: file,
    });

    if (formatted !== source) {
      fs.writeFileSync(file, formatted);
    }
  } catch {
    // Never fail an edit because formatting could not run.
  }
})();
