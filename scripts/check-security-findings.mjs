#!/usr/bin/env node
/**
 * CI guard: fails the build if any **policy** introduces new ERROR-level
 * security findings or if the count of WARN-level findings grows above
 * the baseline captured in scripts/security-baseline.json.
 *
 * Strategy:
 *  - Reads scripts/security-baseline.json: { errors: 0, warnings: <N> }
 *  - Runs a SQL audit query against the current database to count:
 *      * RLS-disabled public tables                                 (error)
 *      * Tables with anon SELECT policy AND PII-named columns        (error)
 *      * Policies USING (true) for UPDATE/DELETE/INSERT              (warn)
 *  - Exits non-zero if the live counts exceed the baseline.
 *
 * Required env: PGHOST / PGUSER / PGPASSWORD / PGDATABASE (Supabase managed)
 *
 * Usage:
 *   node scripts/check-security-findings.mjs
 *   node scripts/check-security-findings.mjs --update-baseline   # write a new baseline
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, "security-baseline.json");

const PII_NAMES = [
  "email","phone","document","cpf","cnpj","whatsapp","owner_name",
  "legal_name","payer_email","payer_doc","payer_whatsapp","signer_email",
  "signer_doc","taxpayer_cpf","contact_email","contact_phone","contact_whatsapp",
];

const SQL = `
WITH
  rls_disabled AS (
    SELECT count(*) AS n
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  ),
  anon_pii AS (
    SELECT count(DISTINCT p.polrelid) AS n
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname AND col.table_name = c.relname
    WHERE n.nspname = 'public'
      AND p.polcmd = 'r'
      AND 'anon'::regrole = ANY (p.polroles)
      AND col.column_name IN (${PII_NAMES.map((c) => `'${c}'`).join(",")})
      AND has_column_privilege('anon', c.oid, col.column_name, 'SELECT')
  ),
  permissive_writes AS (
    SELECT count(*) AS n
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND p.polcmd IN ('a','w','d')
      AND (pg_get_expr(p.polqual, p.polrelid) = 'true'
           OR pg_get_expr(p.polwithcheck, p.polrelid) = 'true')
  )
SELECT
  (SELECT n FROM rls_disabled)      AS rls_disabled,
  (SELECT n FROM anon_pii)          AS anon_pii_columns,
  (SELECT n FROM permissive_writes) AS permissive_writes;
`;

function runQuery() {
  const json = execSync(
    `psql -At -F$'\\t' -c "SELECT row_to_json(t) FROM (${SQL.replace(/\n/g, " ")}) t"`,
    { encoding: "utf8" }
  ).trim();
  return JSON.parse(json);
}

const updateBaseline = process.argv.includes("--update-baseline");
const live = runQuery();
const errors = Number(live.rls_disabled) + Number(live.anon_pii_columns);
const warnings = Number(live.permissive_writes);

console.log("Live security counts:", { ...live, errors, warnings });

if (updateBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify({ errors, warnings }, null, 2) + "\n");
  console.log(`Baseline updated -> ${BASELINE_PATH}`);
  process.exit(0);
}

let baseline = { errors: 0, warnings: 0 };
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
} catch {
  console.warn("No baseline file; creating with current values.");
  writeFileSync(BASELINE_PATH, JSON.stringify({ errors, warnings }, null, 2) + "\n");
  process.exit(0);
}

let failed = false;
if (errors > baseline.errors) {
  console.error(
    `❌ Security regression: ${errors} ERROR-level findings (baseline ${baseline.errors}).`
  );
  failed = true;
}
if (warnings > baseline.warnings) {
  console.error(
    `❌ Security regression: ${warnings} WARN-level findings (baseline ${baseline.warnings}).`
  );
  failed = true;
}

if (failed) {
  console.error(
    "Re-run with --update-baseline only after reviewing and accepting the new findings."
  );
  process.exit(1);
}

console.log("✅ Security check passed (no new findings vs baseline).");
