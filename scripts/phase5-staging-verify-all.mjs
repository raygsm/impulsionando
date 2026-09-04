#!/usr/bin/env node
/**
 * Phase 5 residual staging verify — one entrypoint after Dashboard SQL apply.
 *
 * Usage:
 *   npm run phase5:staging:verify
 *
 * Loads `.env.staging` first (override), then
 * `~/.config/impulsionando/staging-operator-secrets.env` with override:true
 * so refreshed operator JWTs win over stale `.env.staging` bearers
 * (WEBHOOK_SECRET_REENGINEERING_SMOKE, PHASE5G_OPS_BEARER, …). Never prints secrets.
 * Defaults PHASE3_API_BASE to api.stg. Does not SSH.
 *
 * Staging only (project aamorcqznimmleafavai). Never targets prod.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";
const WEBHOOK_SECRET_ENV = "WEBHOOK_SECRET_REENGINEERING_SMOKE";
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
const operatorSecretsLoaded = existsSync(OPERATOR_SECRETS_PATH);
if (operatorSecretsLoaded) {
  // Operator secrets win so Phase 7 / 5G smokes use refreshed JWTs.
  config({ path: OPERATOR_SECRETS_PATH, override: true });
}

if (!process.env.PHASE3_API_BASE) {
  process.env.PHASE3_API_BASE = STAGING_API_DEFAULT;
}

const base = process.env.PHASE3_API_BASE.replace(/\/$/, "");

/** @typedef {{ id: string, status: 'PASS'|'FAIL'|'SKIP', detail?: string }} Row */

/** @type {Row[]} */
const rows = [];

function hasJobAuth() {
  if (process.env.JOB_SMOKE_ACCESS_TOKEN || process.env.TENANT_MEMBERSHIP_SMOKE_ACCESS_TOKEN) {
    return true;
  }
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  return Boolean(email && password && url && anon);
}

function hasServiceRole() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function assertNotProdUrl() {
  const url = process.env.SUPABASE_URL || "";
  if (url.includes(PROD_REF)) {
    console.error("phase5:staging:verify FAIL — SUPABASE_URL targets prod; refusing");
    process.exit(1);
  }
  if (url && !url.includes(STAGING_REF)) {
    console.warn(`WARN — SUPABASE_URL does not mention staging ref ${STAGING_REF}`);
  }
  if (!base.includes("stg.impulsionando") && !base.includes("localhost") && !base.includes("127.0.0.1")) {
    console.warn("WARN — PHASE3_API_BASE does not look like staging/local");
  }
}

/**
 * @param {string} id
 * @param {string} scriptRel
 * @param {Record<string, string>} [extraEnv]
 */
function runSmoke(id, scriptRel, extraEnv = {}) {
  const scriptPath = resolve(scriptsDir, scriptRel);
  if (!existsSync(scriptPath)) {
    rows.push({ id, status: "SKIP", detail: `script missing: ${scriptRel}` });
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
    // Never echo env values; child scripts already avoid secrets. Truncate noise.
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
      detail: `exit=${res.status ?? "null"}${res.error ? ` ${res.error.message}` : ""}`,
    });
  }
}

function skip(id, reason) {
  console.log(`\n── ${id} ── SKIP — ${reason}`);
  rows.push({ id, status: "SKIP", detail: reason });
}

async function probeLedgerSelect() {
  const id = "5B ledger SELECT probe";
  if (!hasServiceRole()) {
    skip(id, "missing SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  console.log(`\n── ${id} ──`);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const table = await admin
    .from("reengineering_job_effects")
    .select("scope_key", { head: true, count: "exact" })
    .limit(1);

  if (!table.error) {
    console.log(JSON.stringify({ ok: true, proof: "table", count: table.count ?? null }));
    rows.push({ id, status: "PASS", detail: "proof=table" });
    return;
  }

  const rpc = await admin.rpc("get_reengineering_job_effect", {
    p_scope_key: "__phase5_verify_probe__",
  });
  // PGRST116 / empty is OK — means EXECUTE grant works; 42501/PGRST202 is FAIL
  if (!rpc.error) {
    console.log(JSON.stringify({ ok: true, proof: "rpc", row: null }));
    rows.push({ id, status: "PASS", detail: "proof=rpc" });
    return;
  }

  const code = table.error.code || rpc.error.code || "unknown";
  const msg = table.error.message || rpc.error.message || "";
  console.log(JSON.stringify({ ok: false, tableCode: table.error.code, rpcCode: rpc.error.code }));
  if (code === "42501" || code === "PGRST202" || /permission denied|schema cache/i.test(msg)) {
    rows.push({
      id,
      status: "FAIL",
      detail: `${code} — apply PHASE5-PENDING-DASHBOARD.sql section 5B GRANT`,
    });
  } else {
    rows.push({ id, status: "FAIL", detail: code });
  }
}

function printMatrix() {
  console.log("\n════════════════════════════════════════");
  console.log("Phase 5 staging verify — PASS/FAIL matrix");
  console.log(`API base: ${base}`);
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
  assertNotProdUrl();
  console.log(
    JSON.stringify({
      ok: true,
      script: "phase5:staging:verify",
      apiBase: base,
      stagingRefExpected: STAGING_REF,
      operatorSecretsLoaded,
      // Presence flags only — never print secret values.
      hasWebhookSecret: Boolean(process.env[WEBHOOK_SECRET_ENV]),
      hasOpsBearer: Boolean(process.env.PHASE5G_OPS_BEARER),
      hasStagingBasicAuth: Boolean(
        process.env.STAGING_BASIC_AUTH_USER && process.env.STAGING_BASIC_AUTH_PASS,
      ),
      note: "Secrets never printed. No SSH.",
      at: new Date().toISOString(),
    }),
  );

  // 1) Optional 5B ledger SELECT probe
  await probeLedgerSelect();

  // 2) Job smokes (live poison)
  if (!hasJobAuth()) {
    skip(
      "5B job-enqueue-consume",
      "missing JOB_SMOKE_ACCESS_TOKEN or TEST_USER_EMAIL/PASSWORD + anon",
    );
    skip("5B job-duplicate", "missing job auth env (same as enqueue)");
  } else {
    runSmoke("5B job-enqueue-consume", "smoke-reengineering-job-enqueue-consume.mjs");
    runSmoke("5B job-duplicate", "smoke-reengineering-job-duplicate.mjs");
  }

  if (!hasServiceRole()) {
    skip("5B job-poison-dlq", "missing SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  } else {
    runSmoke("5B job-poison-dlq", "smoke-reengineering-job-poison-dlq.mjs", { DRY_RUN: "0" });
  }

  // 3) Event outbox — contracts by default; live when PHASE5C_SMOKE_LIVE=1
  {
    const rel = "smoke-reengineering-event-outbox.mjs";
    if (!existsSync(resolve(scriptsDir, rel))) {
      skip("5C event-outbox", "script missing");
    } else if (process.env.PHASE5C_SMOKE_LIVE === "1") {
      runSmoke("5C event-outbox", rel, { PHASE5C_SMOKE_LIVE: "1" });
    } else {
      runSmoke("5C event-outbox", rel);
    }
  }

  // 4) Webhook ingress if secret set
  if (!process.env[WEBHOOK_SECRET_ENV]) {
    skip("5D webhook-ingress", `missing ${WEBHOOK_SECRET_ENV}`);
  } else {
    runSmoke("5D webhook-ingress", "smoke-reengineering-webhook-ingress.mjs", { DRY_RUN: "0" });
  }

  // 5) Ops metrics if bearer set
  if (!process.env.PHASE5G_OPS_BEARER) {
    skip("5G ops-metrics", "missing PHASE5G_OPS_BEARER");
  } else {
    runSmoke("5G ops-metrics", "smoke-reengineering-ops-metrics.mjs", { DRY_RUN: "0" });
  }

  // 6) CRM journey — DRY_RUN contracts, or live if allowlist set
  {
    const allowlist = process.env.JOURNEY_RECIPIENT_ALLOWLIST;
    if (allowlist) {
      runSmoke("5F crm-journey", "smoke-reengineering-crm-journey.mjs", {
        DRY_RUN: "0",
        PHASE5F_SMOKE_LIVE: "1",
      });
    } else {
      runSmoke("5F crm-journey", "smoke-reengineering-crm-journey.mjs", {
        DRY_RUN: "1",
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
