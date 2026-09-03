#!/usr/bin/env node
/**
 * Apply Phase 5B ledger SELECT grants on staging only.
 *
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.staging pointing at
 * project aamorcqznimmleafavai — NOT prod.
 *
 * Usage:
 *   npm run staging:apply:phase5b-ledger-grants
 *
 * If no DB URL: prints Dashboard instructions (operator paste).
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.STAGING_DATABASE_URL ||
  "";

const sqlPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "staging/phase5b-job-ledger-grants.sql",
);

function fail(msg) {
  console.error(`staging:apply:phase5b-ledger-grants FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(sqlPath)) fail(`SQL file missing: ${sqlPath}`);

if (!dbUrl) {
  console.log(`
No DATABASE_URL in .env.staging — apply manually on staging only:

1. Open https://supabase.com/dashboard/project/${STAGING_REF}/sql/new
2. Paste contents of: scripts/staging/phase5b-job-ledger-grants.sql
   (same as supabase/migrations/20260902131000_phase5b_job_ledger_service_role_select.sql)
3. Run
4. Re-run: npm run phase5:smoke:job-enqueue-consume
   (expect proof=table or proof=rpc, not 42501)

One-liner when DATABASE_URL is set (staging pooler URI, never prod):
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/staging/phase5b-job-ledger-grants.sql

Do NOT apply on prod ${PROD_REF}.
`);
  process.exit(0);
}

if (dbUrl.includes(PROD_REF)) fail(`DATABASE_URL targets prod ${PROD_REF}`);
if (!dbUrl.includes(STAGING_REF) && !dbUrl.includes("aamorcqznimmleafavai")) {
  console.warn(
    `WARN — DATABASE_URL does not mention staging ref ${STAGING_REF}; confirm before continuing`,
  );
}

readFileSync(sqlPath, "utf8");
const psql = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (psql.status !== 0) {
  console.error(psql.stderr || psql.stdout);
  fail(`psql exited ${psql.status}`);
}

console.log("staging:apply:phase5b-ledger-grants OK — SQL applied");
console.log(psql.stdout?.trim() || "(no stdout)");
console.log("\nNext: npm run phase5:smoke:job-enqueue-consume");
