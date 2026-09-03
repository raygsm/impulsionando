#!/usr/bin/env node
/**
 * Phase 6 Wave 2 staging verify — close matrix (staging only).
 *
 * Usage:
 *   DRY_RUN=0 npm run phase6:staging:verify
 *
 * Loads `.env.staging` then `~/.config/impulsionando/staging-operator-secrets.env`
 * (override:false). Never prints secret values. Does not SSH / promote.
 *
 * Env (names):
 *   PHASE6_AI_BEARER | PHASE5G_OPS_BEARER
 *   PHASE6_AI_TENANT_ID          — allow path for agents/effects
 *   PHASE6_AI_DENY_TENANT_ID     — deny path (actor must NOT be member)
 *   PHASE3_API_BASE              — default api.stg
 */
import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";
const OPERATOR_SECRETS_PATH = join(
  homedir(),
  ".config",
  "impulsionando",
  "staging-operator-secrets.env",
);

const root = process.cwd();
const scriptsDir = dirname(fileURLToPath(import.meta.url));
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });
if (existsSync(OPERATOR_SECRETS_PATH)) {
  config({ path: OPERATOR_SECRETS_PATH, override: false });
}
if (!process.env.PHASE3_API_BASE) {
  process.env.PHASE3_API_BASE = STAGING_API_DEFAULT;
}

const base = process.env.PHASE3_API_BASE.replace(/\/$/, "");
if (!base.includes("stg.impulsionando") && !base.includes("localhost") && !base.includes("127.0.0.1")) {
  console.error("phase6:staging:verify FAIL — refusing non-staging API base");
  process.exit(1);
}

/** @typedef {{ id: string, status: 'PASS'|'FAIL'|'SKIP', detail?: string }} Row */
/** @type {Row[]} */
const rows = [];

function runSmoke(id, extraEnv = {}) {
  const scriptPath = resolve(scriptsDir, "smoke-reengineering-ai-gateway.mjs");
  console.log(`\n── ${id} ──`);
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: {
      ...process.env,
      DRY_RUN: "0",
      ...extraEnv,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * 1024 * 1024,
  });
  const out = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
  if (out) {
    const lines = out.split("\n");
    const capped = lines.length > 100 ? [...lines.slice(0, 50), "…", ...lines.slice(-30)] : lines;
    console.log(capped.join("\n"));
  }
  if (res.status === 0) {
    rows.push({ id, status: "PASS" });
  } else {
    rows.push({
      id,
      status: "FAIL",
      detail: `exit=${res.status ?? "null"}`,
    });
  }
}

function skip(id, reason) {
  console.log(`\n── ${id} ── SKIP — ${reason}`);
  rows.push({ id, status: "SKIP", detail: reason });
}

const bearer = process.env.PHASE6_AI_BEARER || process.env.PHASE5G_OPS_BEARER;
if (!bearer) {
  console.log(
    JSON.stringify({
      ok: false,
      error:
        "Set PHASE6_AI_BEARER (or PHASE5G_OPS_BEARER) in operator secrets — value never logged",
    }),
  );
  process.exit(1);
}

// Full gateway matrix (capabilities/policy/tools/metrics/chat + optional agents/effects)
runSmoke("6A-6F-gateway-matrix", {
  PHASE6_AI_TENANT_ID: process.env.PHASE6_AI_TENANT_ID || "",
  PHASE6_SMOKE_MODE: "full",
});

if (process.env.PHASE6_AI_DENY_TENANT_ID) {
  runSmoke("6D-agents-deny", {
    PHASE6_AI_TENANT_ID: "",
    PHASE6_AI_DENY_TENANT_ID: process.env.PHASE6_AI_DENY_TENANT_ID,
    PHASE6_SMOKE_MODE: "deny-only",
  });
} else {
  skip("6D-agents-deny", "set PHASE6_AI_DENY_TENANT_ID for cross-tenant deny proof");
}

const failed = rows.filter((r) => r.status === "FAIL");
const passed = rows.filter((r) => r.status === "PASS");
const skipped = rows.filter((r) => r.status === "SKIP");
const ok = failed.length === 0 && passed.length > 0;

console.log(
  JSON.stringify(
    {
      ok,
      suite: "phase6:staging:verify",
      base,
      passed: passed.length,
      failed: failed.length,
      skipped: skipped.length,
      rows,
      note: "Does not mark Phase 6 CLOSED — update STATUS after PASS + promote evidence",
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
