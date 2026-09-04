#!/usr/bin/env node
/**
 * Phase 7 — pilot verify (staging by default; prod-shaped only under explicit flags).
 *
 * Usage:
 *   npm run phase7:pilot:verify                    # DRY_RUN=1 default — plan only
 *   DRY_RUN=0 npm run phase7:pilot:verify          # live against *.stg
 *
 * Loads `.env.staging` then `~/.config/impulsionando/staging-operator-secrets.env`
 * (operator secrets override:true). Never prints Bearer tokens or other secrets.
 *
 * Env (names only):
 *   PHASE3_API_BASE              — default api.stg
 *   PHASE7_EXPECTED_GIT_SHA      — optional /health gitSha assert
 *   PHASE7_PILOT_BEARER | PHASE6_AI_BEARER | PHASE5G_OPS_BEARER
 *   PHASE7_PILOT_TENANT_ID | PHASE6_AI_TENANT_ID     — allow path
 *   PHASE7_DENY_TENANT_ID | PHASE6_AI_DENY_TENANT_ID — deny path
 *   PHASE7_PILOT_HOSTNAME        — required with PHASE7_ALLOW_PROD=1 for non-stg base
 *   PHASE7_ALLOW_PROD=1          — opt-in for non-staging API (still warns; prefer staging)
 *   PHASE7_SKIP_AI_MATRIX=1      — skip AI gateway allow/deny
 *   PHASE7_SKIP_MEMBERSHIP=1     — skip Phase 4 membership smokes
 *
 * Does NOT flip DNS, SSH, or touch legacy VPS.
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
  config({ path: OPERATOR_SECRETS_PATH, override: true });
}

const dryRun = process.env.DRY_RUN !== "0";
if (!process.env.PHASE3_API_BASE) {
  process.env.PHASE3_API_BASE = STAGING_API_DEFAULT;
}

const base = process.env.PHASE3_API_BASE.replace(/\/$/, "");
const pilotHostname = (process.env.PHASE7_PILOT_HOSTNAME || "").trim();
const allowProd = process.env.PHASE7_ALLOW_PROD === "1";
const isStagingLike =
  base.includes("stg.impulsionando") ||
  base.includes("localhost") ||
  base.includes("127.0.0.1");

function refuseNonStaging() {
  if (isStagingLike) return;
  if (!allowProd || !pilotHostname) {
    console.error(
      JSON.stringify({
        ok: false,
        error:
          "Refusing non-staging API base — set PHASE7_ALLOW_PROD=1 and PHASE7_PILOT_HOSTNAME (prefer *.stg)",
        apiBaseLooksStaging: false,
        allowProdSet: allowProd,
        pilotHostnameSet: Boolean(pilotHostname),
      }),
    );
    process.exit(1);
  }
  console.warn(
    "WARN: PHASE7_ALLOW_PROD=1 — targeting non-staging API. Prefer api.stg. No DNS flips from this script.",
  );
  console.warn(`WARN: PHASE7_PILOT_HOSTNAME is set (value not printed). Proceed with extreme care.`);
}

refuseNonStaging();

const allowTenantId =
  (process.env.PHASE7_PILOT_TENANT_ID || process.env.PHASE6_AI_TENANT_ID || "").trim();
const denyTenantId =
  (process.env.PHASE7_DENY_TENANT_ID || process.env.PHASE6_AI_DENY_TENANT_ID || "").trim();
const hasBearer = Boolean(
  process.env.PHASE7_PILOT_BEARER ||
    process.env.PHASE6_AI_BEARER ||
    process.env.PHASE5G_OPS_BEARER,
);

/** @typedef {{ id: string, status: 'PASS'|'FAIL'|'SKIP'|'PLAN', detail?: string }} Row */
/** @type {Row[]} */
const rows = [];

function skip(id, reason) {
  console.log(`\n── ${id} ── SKIP — ${reason}`);
  rows.push({ id, status: "SKIP", detail: reason });
}

function plan(id, detail) {
  console.log(`\n── ${id} ── PLAN — ${detail}`);
  rows.push({ id, status: "PLAN", detail });
}

/**
 * @param {string} id
 * @param {string} scriptRel
 * @param {Record<string, string>} [extraEnv]
 */
function runNodeScript(id, scriptRel, extraEnv = {}) {
  const scriptPath = resolve(scriptsDir, scriptRel);
  if (!existsSync(scriptPath)) {
    skip(id, `script missing: ${scriptRel}`);
    return;
  }
  console.log(`\n── ${id} ──`);
  const env = { ...process.env, ...extraEnv };
  // Map PHASE7_PILOT_BEARER onto PHASE6_AI_BEARER for shared AI smoke (never log).
  if (process.env.PHASE7_PILOT_BEARER && !env.PHASE6_AI_BEARER) {
    env.PHASE6_AI_BEARER = process.env.PHASE7_PILOT_BEARER;
  }
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * 1024 * 1024,
  });
  const out = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
  if (out) {
    const lines = out.split("\n");
    const capped = lines.length > 80 ? [...lines.slice(0, 40), "…", ...lines.slice(-20)] : lines;
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

async function probeHealth() {
  const id = "7B /health + gitSha";
  const expected = (process.env.PHASE7_EXPECTED_GIT_SHA || "").trim();
  if (dryRun) {
    plan(
      id,
      `GET ${base}/health` +
        (expected ? " + assert PHASE7_EXPECTED_GIT_SHA" : " (no SHA assert)"),
    );
    return;
  }
  console.log(`\n── ${id} ──`);
  try {
    const res = await fetch(`${base}/health`);
    const body = await res.json().catch(() => ({}));
    const gitSha = typeof body.gitSha === "string" ? body.gitSha : "";
    if (!res.ok || body.ok !== true) {
      rows.push({ id, status: "FAIL", detail: `http=${res.status}` });
      console.log(JSON.stringify({ ok: false, http: res.status, hasGitSha: Boolean(gitSha) }));
      return;
    }
    if (expected && gitSha !== expected) {
      rows.push({
        id,
        status: "FAIL",
        detail: "gitSha mismatch (PHASE7_EXPECTED_GIT_SHA)",
      });
      console.log(JSON.stringify({ ok: false, gitShaPrefix: gitSha.slice(0, 12) }));
      return;
    }
    console.log(
      JSON.stringify({
        ok: true,
        http: res.status,
        gitShaPrefix: gitSha ? gitSha.slice(0, 12) : null,
        expectedAssert: Boolean(expected),
      }),
    );
    rows.push({
      id,
      status: "PASS",
      detail: gitSha ? `gitSha=${gitSha.slice(0, 12)}…` : "gitSha missing (warn)",
    });
  } catch (err) {
    rows.push({
      id,
      status: "FAIL",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function printMatrix() {
  console.log("\n════════════════════════════════════════");
  console.log("Phase 7 pilot verify — PASS/FAIL matrix");
  console.log(`API base: ${base}`);
  console.log(`DRY_RUN: ${dryRun ? "1" : "0"}`);
  console.log(`stagingLike: ${isStagingLike}`);
  console.log("════════════════════════════════════════");
  const width = Math.max(...rows.map((r) => r.id.length), 8);
  for (const r of rows) {
    const pad = r.id.padEnd(width);
    const extra = r.detail ? `  (${r.detail})` : "";
    console.log(`${pad}  ${r.status}${extra}`);
  }
  const pass = rows.filter((r) => r.status === "PASS").length;
  const fail = rows.filter((r) => r.status === "FAIL").length;
  const skipped = rows.filter((r) => r.status === "SKIP").length;
  const planned = rows.filter((r) => r.status === "PLAN").length;
  console.log("────────────────────────────────────────");
  console.log(
    `PASS=${pass}  FAIL=${fail}  SKIP=${skipped}  PLAN=${planned}  total=${rows.length}`,
  );
  console.log("════════════════════════════════════════\n");
}

async function main() {
  console.log(
    JSON.stringify({
      ok: true,
      script: "phase7:pilot:verify",
      apiBase: base,
      dryRun,
      stagingLike: isStagingLike,
      allowProd,
      pilotHostnameConfigured: Boolean(pilotHostname),
      bearerConfigured: hasBearer,
      allowTenantConfigured: Boolean(allowTenantId),
      denyTenantConfigured: Boolean(denyTenantId),
      operatorSecretsLoaded: existsSync(OPERATOR_SECRETS_PATH),
      note: "Secrets never printed. Prefer staging. No DNS / no legacy VPS.",
      at: new Date().toISOString(),
    }),
  );

  await probeHealth();

  // --- AI allow/deny matrix (reuse smoke-reengineering-ai-gateway.mjs) ---
  if (process.env.PHASE7_SKIP_AI_MATRIX === "1") {
    skip("7B AI gateway allow", "PHASE7_SKIP_AI_MATRIX=1");
    skip("7B AI gateway deny", "PHASE7_SKIP_AI_MATRIX=1");
  } else if (!hasBearer) {
    skip(
      "7B AI gateway allow",
      "no PHASE7_PILOT_BEARER / PHASE6_AI_BEARER / PHASE5G_OPS_BEARER",
    );
    skip("7B AI gateway deny", "no bearer configured");
  } else if (dryRun) {
    plan(
      "7B AI gateway allow",
      `spawn smoke-reengineering-ai-gateway.mjs mode=full` +
        (allowTenantId ? " + agents/effects allow tenant" : " (no allow tenant id)"),
    );
    if (denyTenantId) {
      plan(
        "7B AI gateway deny",
        "spawn smoke-reengineering-ai-gateway.mjs mode=deny-only",
      );
    } else {
      skip(
        "7B AI gateway deny",
        "set PHASE7_DENY_TENANT_ID or PHASE6_AI_DENY_TENANT_ID",
      );
    }
  } else {
    runNodeScript("7B AI gateway allow", "smoke-reengineering-ai-gateway.mjs", {
      DRY_RUN: "0",
      PHASE6_SMOKE_MODE: "full",
      PHASE6_AI_TENANT_ID: allowTenantId,
      PHASE6_AI_DENY_TENANT_ID: "",
    });
    if (denyTenantId) {
      runNodeScript("7B AI gateway deny", "smoke-reengineering-ai-gateway.mjs", {
        DRY_RUN: "0",
        PHASE6_SMOKE_MODE: "deny-only",
        PHASE6_AI_TENANT_ID: "",
        PHASE6_AI_DENY_TENANT_ID: denyTenantId,
      });
    } else {
      skip(
        "7B AI gateway deny",
        "set PHASE7_DENY_TENANT_ID or PHASE6_AI_DENY_TENANT_ID",
      );
    }
  }

  // --- Phase 4 membership smokes (optional; host-based) ---
  if (process.env.PHASE7_SKIP_MEMBERSHIP === "1") {
    skip("7B membership allow", "PHASE7_SKIP_MEMBERSHIP=1");
    skip("7B membership deny", "PHASE7_SKIP_MEMBERSHIP=1");
  } else {
    const allowScript = "smoke-reengineering-tenant-membership-allow.mjs";
    const denyScript = "smoke-reengineering-tenant-membership-deny.mjs";
    const hostHint = pilotHostname
      ? "PHASE7_PILOT_HOSTNAME → TENANT_MEMBERSHIP_SMOKE_HOST"
      : "uses TENANT_MEMBERSHIP_SMOKE_HOST / script defaults";

    if (dryRun) {
      if (existsSync(resolve(scriptsDir, allowScript))) {
        plan("7B membership allow", `spawn ${allowScript} (${hostHint})`);
      } else {
        skip("7B membership allow", `script missing: ${allowScript}`);
      }
      if (existsSync(resolve(scriptsDir, denyScript))) {
        plan("7B membership deny", `spawn ${denyScript}`);
      } else {
        skip("7B membership deny", `script missing: ${denyScript}`);
      }
    } else {
      const membershipEnv = {};
      if (pilotHostname) {
        membershipEnv.TENANT_MEMBERSHIP_SMOKE_HOST = pilotHostname;
      }
      // Prefer pilot bearer as access token when membership smokes need it.
      if (process.env.PHASE7_PILOT_BEARER) {
        membershipEnv.TENANT_MEMBERSHIP_SMOKE_ACCESS_TOKEN =
          process.env.PHASE7_PILOT_BEARER;
      }
      runNodeScript("7B membership allow", allowScript, membershipEnv);
      runNodeScript("7B membership deny", denyScript, membershipEnv);
    }
  }

  printMatrix();
  const failed = rows.some((r) => r.status === "FAIL");
  // DRY_RUN plan-only is success if nothing failed to plan
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
