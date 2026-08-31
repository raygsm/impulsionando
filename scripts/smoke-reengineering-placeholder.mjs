#!/usr/bin/env node
/**
 * Phase 2 — smoke the clean-host reengineering placeholder (no secrets).
 *
 * Defaults:
 *   PLACEHOLDER_DIRECT_URL=http://2.25.123.224:8088/health
 *   PLACEHOLDER_TRAEFIK_URL=http://2.25.123.224/health
 *   PLACEHOLDER_TRAEFIK_HOST=placeholder.staging.local
 *   PLACEHOLDER_EXPECT_SHA= (optional — fail if gitSha mismatches when set)
 *   PLACEHOLDER_SKIP_TRAEFIK=1 to skip Host-header path
 *
 * Usage: npm run phase2:smoke:placeholder
 *
 * Note: undici/fetch forbids overriding `Host`; Traefik check uses `curl`.
 */
import { spawnSync } from "node:child_process";

const DIRECT =
  process.env.PLACEHOLDER_DIRECT_URL || "http://2.25.123.224:8088/health";
const TRAEFIK =
  process.env.PLACEHOLDER_TRAEFIK_URL || "http://2.25.123.224/health";
const HOST =
  process.env.PLACEHOLDER_TRAEFIK_HOST || "placeholder.staging.local";
const EXPECT = (process.env.PLACEHOLDER_EXPECT_SHA || "").trim();
const SKIP_TRAEFIK = process.env.PLACEHOLDER_SKIP_TRAEFIK === "1";

async function getJsonFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    return { status: res.status, text, body };
  } finally {
    clearTimeout(t);
  }
}

/** curl preserves Host header (fetch cannot). */
function getJsonCurl(url, host) {
  const r = spawnSync(
    "curl",
    ["-sS", "-m", "12", "-w", "\n%{http_code}", "-H", `Host: ${host}`, url],
    { encoding: "utf8" },
  );
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`curl exit ${r.status}: ${r.stderr || r.stdout}`);
  }
  const out = (r.stdout || "").trimEnd();
  const nl = out.lastIndexOf("\n");
  const text = nl >= 0 ? out.slice(0, nl) : out;
  const status = Number(nl >= 0 ? out.slice(nl + 1) : "0");
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status, text, body };
}

function assertHealth(label, { status, body }) {
  if (status !== 200) throw new Error(`${label}: HTTP ${status}`);
  if (!body || body.ok !== true) throw new Error(`${label}: ok!=true`);
  if (!body.gitSha || body.gitSha === "unknown") {
    throw new Error(`${label}: missing gitSha`);
  }
  if (EXPECT) {
    const short = EXPECT.slice(0, 8);
    const got = String(body.gitSha);
    if (got !== EXPECT && got !== short && !EXPECT.startsWith(got)) {
      throw new Error(`${label}: gitSha=${got} expected ${EXPECT}`);
    }
  }
  return body.gitSha;
}

const failures = [];
let directSha;
let traefikSha;

try {
  const direct = await getJsonFetch(DIRECT);
  directSha = assertHealth("direct", direct);
  console.log(`OK direct ${DIRECT} gitSha=${directSha}`);
} catch (e) {
  failures.push(String(e?.message ?? e));
  console.error(`FAIL direct: ${e?.message ?? e}`);
}

if (!SKIP_TRAEFIK) {
  try {
    const traefik = getJsonCurl(TRAEFIK, HOST);
    traefikSha = assertHealth("traefik", traefik);
    console.log(`OK traefik Host=${HOST} gitSha=${traefikSha}`);
  } catch (e) {
    failures.push(String(e?.message ?? e));
    console.error(`FAIL traefik: ${e?.message ?? e}`);
  }
} else {
  console.log("SKIP traefik (PLACEHOLDER_SKIP_TRAEFIK=1)");
}

if (directSha && traefikSha && directSha !== traefikSha) {
  failures.push(`SHA mismatch direct=${directSha} traefik=${traefikSha}`);
}

if (failures.length) {
  console.error(`phase2:smoke:placeholder FAIL (${failures.length})`);
  process.exit(1);
}

console.log("phase2:smoke:placeholder OK");
