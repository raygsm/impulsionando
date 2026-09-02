#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const tests = ["tests/reengineering/job-queue.contract.test.ts"];

let failed = false;
for (const file of tests) {
  const res = spawnSync("npx", ["vitest", "run", file], { stdio: "inherit", shell: true });
  if (res.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
