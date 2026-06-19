#!/usr/bin/env node
// Anexa um resumo da execução vitest ao histórico em public/qa-history.json.
// Uso: node scripts/append-quality-history.mjs <vitest.json>
// Imprime o novo histórico em stdout (até 50 execuções mais recentes).

import { readFileSync, existsSync } from "node:fs";

const HISTORY_PATH = "public/qa-history.json";
const MAX_ENTRIES = 50;

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: append-quality-history.mjs <vitest.json>");
  process.exit(2);
}

let report = null;
try {
  report = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (err) {
  console.error("failed to parse vitest JSON:", err.message);
  process.exit(2);
}

const numTotal = report.numTotalTests ?? 0;
const numPassed = report.numPassedTests ?? 0;
const numFailed = report.numFailedTests ?? 0;
const numFiles = report.numTotalTestSuites ?? (report.testResults?.length ?? 0);
const startTime = report.startTime ?? Date.now();
const endTime = report.testResults?.reduce(
  (max, r) => Math.max(max, r.endTime ?? r.perfStats?.end ?? 0),
  startTime,
) ?? startTime;
const durationMs = Math.max(0, endTime - startTime);

const entry = {
  ts: new Date(startTime).toISOString(),
  total: numTotal,
  passed: numPassed,
  failed: numFailed,
  files: numFiles,
  durationMs,
  success: report.success !== false && numFailed === 0,
  sha: process.env.GITHUB_SHA ?? null,
  ref: process.env.GITHUB_REF ?? null,
  runId: process.env.GITHUB_RUN_ID ?? null,
};

let history = [];
if (existsSync(HISTORY_PATH)) {
  try {
    history = JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
}

history.unshift(entry);
history = history.slice(0, MAX_ENTRIES);

process.stdout.write(JSON.stringify(history, null, 2));
