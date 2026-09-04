#!/usr/bin/env node
/**
 * Phase 7 Wave 0 — staging cutover rehearsal harness (*.stg only).
 *
 * Usage:
 *   npm run phase7:staging:rehearse              # DRY_RUN=1 default
 *   DRY_RUN=0 npm run phase7:staging:rehearse    # live staging smokes
 *
 * Loads `.env.staging` then `~/.config/impulsionando/staging-operator-secrets.env`
 * (operator secrets override:true so refreshed bearers win). Never prints secret values.
 * Does not SSH / promote / touch prod DNS.
 *
 * Optional env (names only):
 *   PHASE7_EXPECTED_GIT_SHA — assert /health gitSha matches (full SHA)
 *   PHASE3_API_BASE — default api.stg
 *   PHASE7_SKIP_PHASE5 / PHASE7_SKIP_PHASE6 — set to 1 to skip nested verify
 *   PHASE7_RUN_PILOT_VERIFY=1 — with DRY_RUN=0, run phase7-pilot-verify.mjs
 */
import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";
const TENANT_WEB_DEFAULT = "https://tenant.stg.impulsionando.com.br";
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
  // Operator secrets win — local refreshed JWTs must not lose to stale .env.staging bearers.
  config({ path: OPERATOR_SECRETS_PATH, override: true });
}

const dryRun = process.env.DRY_RUN !== "0";
if (!process.env.PHASE3_API_BASE) {
  process.env.PHASE3_API_BASE = STAGING_API_DEFAULT;
}

const base = process.env.PHASE3_API_BASE.replace(/\/$/, "");
if (!base.includes("stg.impulsionando") && !base.includes("localhost") && !base.includes("127.0.0.1")) {
  console.error("phase7:staging:rehearse FAIL — refusing non-staging API base");
  process.exit(1);
}

/** @typedef {{ id: string, status: 'PASS'|'FAIL'|'SKIP', detail?: string }} Row */
/** @type {Row[]} */
const rows = [];

function skip(id, reason) {
  console.log(`\n── ${id} ── SKIP — ${reason}`);
  rows.push({ id, status: "SKIP", detail: reason });
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
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
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
  const id = "7A API /health + gitSha";
  console.log(`\n── ${id} ──`);
  try {
    const res = await fetch(`${base}/health`);
    const body = await res.json().catch(() => ({}));
    const gitSha = typeof body.gitSha === "string" ? body.gitSha : "";
    const expected = process.env.PHASE7_EXPECTED_GIT_SHA || "";
    if (!res.ok || body.ok !== true) {
      rows.push({ id, status: "FAIL", detail: `http=${res.status}` });
      console.log(JSON.stringify({ ok: false, http: res.status, hasGitSha: Boolean(gitSha) }));
      return;
    }
    if (expected && gitSha !== expected) {
      rows.push({
        id,
        status: "FAIL",
        detail: `gitSha mismatch (expected set via PHASE7_EXPECTED_GIT_SHA)`,
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

async function probeTenantWeb() {
  const id = "7A tenant-web health";
  const url = (process.env.PHASE7_TENANT_WEB_BASE || TENANT_WEB_DEFAULT).replace(/\/$/, "");
  if (!url.includes("stg.impulsionando") && !url.includes("localhost")) {
    skip(id, "tenant-web base not staging/local");
    return;
  }
  console.log(`\n── ${id} ──`);
  try {
    const candidates = [`${url}/health`, `${url}/api/health`, url];
    let ok = false;
    let lastStatus = 0;
    for (const u of candidates) {
      const res = await fetch(u, { redirect: "manual" });
      lastStatus = res.status;
      if (res.status >= 200 && res.status < 500) {
        ok = res.status < 400 || res.status === 401 || res.status === 403;
        if (res.status >= 200 && res.status < 400) {
          ok = true;
          break;
        }
      }
    }
    if (ok) {
      console.log(JSON.stringify({ ok: true, lastStatus }));
      rows.push({ id, status: "PASS", detail: `http=${lastStatus}` });
    } else {
      rows.push({ id, status: "FAIL", detail: `http=${lastStatus}` });
    }
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
  console.log("Phase 7 staging rehearse — PASS/FAIL matrix");
  console.log(`API base: ${base}`);
  console.log(`DRY_RUN: ${dryRun ? "1" : "0"}`);
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
  console.log("────────────────────────────────────────");
  console.log(`PASS=${pass}  FAIL=${fail}  SKIP=${skipped}  total=${rows.length}`);
  console.log("════════════════════════════════════════\n");
}

async function main() {
  console.log(
    JSON.stringify({
      ok: true,
      script: "phase7:staging:rehearse",
      apiBase: base,
      dryRun,
      operatorSecretsLoaded: existsSync(OPERATOR_SECRETS_PATH),
      note: "Secrets never printed. No SSH. Staging only. Phase 7 cutover NOT started by this script.",
      at: new Date().toISOString(),
    }),
  );

  await probeHealth();
  await probeTenantWeb();

  // Nested Phase 5 / 6 matrices — DRY_RUN=1 skips live child by using dry where supported
  if (process.env.PHASE7_SKIP_PHASE5 === "1") {
    skip("7A nested phase5:staging:verify", "PHASE7_SKIP_PHASE5=1");
  } else if (dryRun) {
    skip(
      "7A nested phase5:staging:verify",
      "DRY_RUN=1 — set DRY_RUN=0 for live nested verify",
    );
  } else {
    runNodeScript("7A nested phase5:staging:verify", "phase5-staging-verify-all.mjs", {
      DRY_RUN: "0",
    });
  }

  if (process.env.PHASE7_SKIP_PHASE6 === "1") {
    skip("7A nested phase6:staging:verify", "PHASE7_SKIP_PHASE6=1");
  } else if (dryRun) {
    skip(
      "7A nested phase6:staging:verify",
      "DRY_RUN=1 — set DRY_RUN=0 for live nested verify",
    );
  } else {
    runNodeScript("7A nested phase6:staging:verify", "phase6-staging-verify-all.mjs", {
      DRY_RUN: "0",
    });
  }

  // 7B pilot verify — real SKIP only when script missing; live when DRY_RUN=0 + PHASE7_RUN_PILOT_VERIFY=1
  {
    const pilotScript = "phase7-pilot-verify.mjs";
    const pilotPath = resolve(scriptsDir, pilotScript);
    if (!existsSync(pilotPath)) {
      skip("7B phase7:pilot:verify", `script missing: ${pilotScript}`);
    } else if (dryRun) {
      skip(
        "7B phase7:pilot:verify",
        "DRY_RUN=1 — set DRY_RUN=0 and PHASE7_RUN_PILOT_VERIFY=1 to run",
      );
    } else if (process.env.PHASE7_RUN_PILOT_VERIFY !== "1") {
      skip(
        "7B phase7:pilot:verify",
        "PHASE7_RUN_PILOT_VERIFY≠1 — opt-in required (staging preferred; no prod DNS)",
      );
    } else {
      runNodeScript("7B phase7:pilot:verify", pilotScript, {
        DRY_RUN: "0",
      });
    }
  }

  printMatrix();
  const failed = rows.some((r) => r.status === "FAIL");
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
