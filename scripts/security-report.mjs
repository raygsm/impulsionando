#!/usr/bin/env node
/**
 * Generates an auditor-friendly security report from the live DB schema and
 * diffs it against scripts/security-baseline.json.
 *
 * Outputs:
 *   /mnt/documents/security-report.json   (or $OUT_DIR/security-report.json)
 *   $OUT_DIR/security-report.md           (human-readable summary + diff)
 *   Writes the same summary to $GITHUB_STEP_SUMMARY when running in CI.
 *
 * Exit code 0 always — this is reporting, not enforcement.
 * The CI gate is scripts/check-security-findings.mjs (security:check).
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, "security-baseline.json");
const OUT_DIR = process.env.OUT_DIR || "/tmp/security-report";
mkdirSync(OUT_DIR, { recursive: true });

const PII_NAMES = [
  "email","phone","document","cpf","cnpj","whatsapp","owner_name",
  "legal_name","payer_email","payer_doc","payer_whatsapp","signer_email",
  "signer_doc","taxpayer_cpf","contact_email","contact_phone","contact_whatsapp",
];

function q(sql) {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  return execSync(`psql -At -F '|' -c ${JSON.stringify(oneLine)}`, { encoding: "utf8" }).trim();
}

function rows(sql) {
  const out = q(sql);
  if (!out) return [];
  return out.split("\n").map((line) => line.split("|"));
}

const rlsDisabled = rows(`
  SELECT t.schemaname, t.tablename
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ORDER BY t.tablename
`).map(([schema, table]) => ({ schema, table }));

const anonPii = rows(`
  SELECT DISTINCT c.relname, col.column_name
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
  ORDER BY c.relname, col.column_name
`).map(([table, column]) => ({ table, column }));

const permissiveWrites = rows(`
  SELECT c.relname, p.polname, p.polcmd
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND p.polcmd IN ('a','w','d')
    AND (pg_get_expr(p.polqual, p.polrelid) = 'true'
         OR pg_get_expr(p.polwithcheck, p.polrelid) = 'true')
  ORDER BY c.relname, p.polname
`).map(([table, policy, cmd]) => ({ table, policy, cmd }));

// Match the aggregation used by scripts/check-security-findings.mjs so the
// report's "errors/warnings" align with the CI gate. We display the detailed
// rows below for auditor context.
const anonPiiTables = new Set(anonPii.map((r) => r.table)).size;

const live = {
  errors: rlsDisabled.length + anonPiiTables,
  warnings: permissiveWrites.length,
  rls_disabled: rlsDisabled,
  anon_pii_columns: anonPii,
  permissive_writes: permissiveWrites,
  generated_at: new Date().toISOString(),
};

let baseline = { errors: 0, warnings: 0 };
try { baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")); } catch {}

const diff = {
  errors: live.errors - baseline.errors,
  warnings: live.warnings - baseline.warnings,
};
const status = diff.errors > 0 || diff.warnings > 0 ? "❌ REGRESSION" : "✅ OK";

writeFileSync(join(OUT_DIR, "security-report.json"),
  JSON.stringify({ baseline, live, diff, status }, null, 2));

function table(rows, cols) {
  if (!rows.length) return "_none_\n";
  const head = `| ${cols.join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |\n`;
  const body = rows.map((r) => `| ${cols.map((c) => r[c] ?? "").join(" | ")} |`).join("\n");
  return head + body + "\n";
}

const md = `# Security Findings Report — ${status}

**Generated:** ${live.generated_at}

## Summary vs baseline (\`scripts/security-baseline.json\`)

| Level    | Baseline | Live | Diff |
| -------- | -------: | ---: | ---: |
| errors   | ${baseline.errors}   | ${live.errors}   | ${diff.errors >= 0 ? "+" : ""}${diff.errors} |
| warnings | ${baseline.warnings} | ${live.warnings} | ${diff.warnings >= 0 ? "+" : ""}${diff.warnings} |

## ERROR — Public tables with RLS disabled (${rlsDisabled.length})
${table(rlsDisabled, ["schema", "table"])}
## ERROR — Anon SELECT on PII-named columns (${anonPii.length})
${table(anonPii, ["table", "column"])}
## WARN — Permissive write policies (USING/WITH CHECK = true) (${permissiveWrites.length})
${table(permissiveWrites, ["table", "policy", "cmd"])}
`;

writeFileSync(join(OUT_DIR, "security-report.md"), md);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}

console.log(md);
console.log(`Report written to ${OUT_DIR}/security-report.{json,md}`);
