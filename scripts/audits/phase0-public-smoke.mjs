#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const maxBodyBytes = 5 * 1024 * 1024;
const manifestUrl = new URL("../../infra/phase0/public-smoke-targets.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

function validateTarget(target) {
  if (!target?.id || !target?.url || !Array.isArray(target.expectedStatus)) {
    throw new Error(`Invalid target: ${JSON.stringify(target)}`);
  }
  const url = new URL(target.url);
  if (url.protocol !== "https:") throw new Error(`Only HTTPS is allowed: ${target.url}`);
  return { ...target, url: url.toString() };
}

const targets = manifest.targets.map(validateTarget);

if (dryRun) {
  console.log(JSON.stringify({ mode: "dry-run", targets }, null, 2));
  process.exit(0);
}

async function fingerprintBody(response) {
  if (!response.body) return { bytes: 0, sha256: createHash("sha256").digest("hex") };

  const reader = response.body.getReader();
  const hash = createHash("sha256");
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBodyBytes) {
      await reader.cancel("Phase 0 smoke body limit reached");
      throw new Error(`Response exceeds ${maxBodyBytes} bytes`);
    }
    hash.update(value);
  }

  return { bytes, sha256: hash.digest("hex") };
}

async function probe(target) {
  const startedAt = Date.now();
  try {
    const response = await fetch(target.url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "impulsionando-phase0-readonly-smoke/1" },
    });
    const fingerprint = await fingerprintBody(response);
    return {
      id: target.id,
      url: target.url,
      ok: target.expectedStatus.includes(response.status),
      status: response.status,
      expectedStatus: target.expectedStatus,
      location: response.headers.get("location"),
      contentType: response.headers.get("content-type"),
      bytes: fingerprint.bytes,
      sha256: fingerprint.sha256,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      id: target.id,
      url: target.url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    };
  }
}

const results = await Promise.all(targets.map(probe));
const output = {
  generatedAt: new Date().toISOString(),
  mode: "read-only-public-get",
  passed: results.filter((result) => result.ok).length,
  failed: results.filter((result) => !result.ok).length,
  results,
};

console.log(JSON.stringify(output, null, 2));
process.exitCode = output.failed === 0 ? 0 : 1;
