#!/usr/bin/env node
/**
 * Run all Phase 4B contract tests (no secrets).
 */
import { spawnSync } from "node:child_process";

const suites = [
  "test:reengineering:tenant-resolve",
  "test:reengineering:tenant-membership",
  "test:reengineering:tenant-entitlements",
  "test:reengineering:tenant-host",
];

let ok = true;
for (const script of suites) {
  const r = spawnSync("npm", ["run", script], { stdio: "inherit", shell: true });
  if (r.status !== 0) ok = false;
}

process.exit(ok ? 0 : 1);
