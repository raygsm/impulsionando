#!/usr/bin/env node
/**
 * Apply staging DB patch (Phase 4 RPC + optional seq GRANT).
 *
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.staging pointing at
 * project aamorcqznimmleafavai — NOT prod.
 *
 * Usage:
 *   npm run staging:apply:db-patch
 *
 * If no DB URL: prints instructions to run SQL in Supabase Dashboard.
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
  "staging/phase4-resolve-tenant-rpc.sql",
);

function fail(msg) {
  console.error(`staging:apply:db-patch FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(sqlPath)) fail(`SQL file missing: ${sqlPath}`);

if (!dbUrl) {
  console.log(`
No DATABASE_URL in .env.staging — apply manually:

1. Open https://supabase.com/dashboard/project/${STAGING_REF}/sql/new
2. Paste contents of: scripts/staging/phase4-resolve-tenant-rpc.sql
3. Run
4. Verify: npm run phase4:smoke:tenant-resolve

To enable this script: add to .env.staging (gitignored):
  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
(from Dashboard → Settings → Database → Connection string → URI)
`);
  process.exit(0);
}

if (dbUrl.includes(PROD_REF)) fail(`DATABASE_URL targets prod ${PROD_REF}`);
if (!dbUrl.includes(STAGING_REF) && !dbUrl.includes("aamorcqznimmleafavai")) {
  console.warn(
    `WARN — DATABASE_URL does not mention staging ref ${STAGING_REF}; confirm before continuing`,
  );
}

const sql = readFileSync(sqlPath, "utf8");
const psql = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (psql.status !== 0) {
  console.error(psql.stderr || psql.stdout);
  fail(`psql exited ${psql.status}`);
}

console.log("staging:apply:db-patch OK — SQL applied");
console.log(psql.stdout?.trim() || "(no stdout)");
console.log("\nNext: npm run phase4:smoke:tenant-resolve");
