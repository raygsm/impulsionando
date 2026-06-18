#!/usr/bin/env node
/**
 * Generates an auditor-friendly security report from the live DB schema and
 * diffs it against scripts/security-baseline.json.
 *
 * Outputs:
 *   $OUT_DIR/security-report.json
 *   $OUT_DIR/security-report.md
 *   $OUT_DIR/pr-comment.md           (shorter body for PR comments)
 *   $GITHUB_STEP_SUMMARY (when in CI)
 *
 * Exit code 0 always — reporting only. CI gate is scripts/check-security-findings.mjs.
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
  try {
    return execSync(`psql -At -F '|' -c ${JSON.stringify(oneLine)}`, { encoding: "utf8" }).trim();
  } catch (err) {
    console.error("psql query failed:", err.message);
    return "";
  }
}

function rows(sql) {
  const out = q(sql);
  if (!out) return [];
  return out.split("\n").map((line) => line.split("|"));
}

// ---------- Findings: ERRORS ----------
const rlsDisabled = rows(`
  SELECT t.schemaname, t.tablename, c.oid::text
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ORDER BY t.tablename
`).map(([schema, table, oid]) => ({
  id: `rls-disabled:${schema}.${table}`,
  schema, table, oid,
  evidence: `pg_class.oid=${oid} relrowsecurity=false`,
  remediation: `ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;`,
}));

const anonPii = rows(`
  SELECT DISTINCT c.relname, col.column_name, p.polname, p.oid::text
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
`).map(([table, column, policy, policy_oid]) => ({
  id: `anon-pii:${table}.${column}@${policy}`,
  table, column, policy, policy_oid,
  evidence: `policy "${policy}" (oid=${policy_oid}) grants anon SELECT and column "${column}" matches PII heuristic`,
  remediation: `REVOKE SELECT (${column}) ON public.${table} FROM anon; -- or scope the policy off anon`,
}));

// ---------- Findings: WARNINGS ----------
const permissiveWrites = rows(`
  SELECT c.relname,
         p.polname,
         p.polcmd,
         p.oid::text,
         COALESCE(pg_get_expr(p.polqual, p.polrelid), ''),
         COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '')
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND p.polcmd IN ('a','w','d')
    AND (pg_get_expr(p.polqual, p.polrelid) = 'true'
         OR pg_get_expr(p.polwithcheck, p.polrelid) = 'true')
  ORDER BY c.relname, p.polname
`).map(([table, policy, cmd, oid, using, withCheck]) => ({
  id: `permissive-write:${table}@${policy}`,
  table, policy, cmd, policy_oid: oid,
  using_expr: using, with_check_expr: withCheck,
  evidence: `policy "${policy}" (oid=${oid}) cmd=${cmd} USING=${using || "—"} WITH CHECK=${withCheck || "—"}`,
  remediation: `Replace 'true' qualifier with an auth.uid()/has_role/user_has_permission predicate.`,
}));

// ---------- Full policy inventory (auditor context) ----------
const allPolicies = rows(`
  SELECT n.nspname,
         c.relname,
         p.polname,
         p.oid::text,
         CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                      WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                      WHEN '*' THEN 'ALL' ELSE p.polcmd::text END,
         array_to_string(ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.polroles)), ','),
         COALESCE(pg_get_expr(p.polqual, p.polrelid), ''),
         COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '')
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public','storage')
  ORDER BY n.nspname, c.relname, p.polname
`).map(([schema, table, policy, oid, cmd, roles, using, withCheck]) => ({
  schema, table, policy, policy_oid: oid, cmd, roles, using_expr: using, with_check_expr: withCheck,
}));

// ---------- Optional: Supabase linter output ----------
let supabaseLinter = "";
try {
  // If a SUPABASE_PROJECT_REF + access token is present, fetch linter output.
  // Otherwise we just embed pg_policies dump above as the evidence trail.
  if (process.env.SUPABASE_LINTER_JSON) {
    supabaseLinter = readFileSync(process.env.SUPABASE_LINTER_JSON, "utf8");
  }
} catch {}

// ---------- Aggregate / diff ----------
const anonPiiTables = new Set(anonPii.map((r) => r.table)).size;

const live = {
  errors: rlsDisabled.length + anonPiiTables,
  warnings: permissiveWrites.length,
  rls_disabled: rlsDisabled,
  anon_pii_columns: anonPii,
  permissive_writes: permissiveWrites,
  all_policies_count: allPolicies.length,
  generated_at: new Date().toISOString(),
};

let baseline = { errors: 0, warnings: 0 };
try { baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")); } catch {}

const diff = {
  errors: live.errors - baseline.errors,
  warnings: live.warnings - baseline.warnings,
};
const regressed = diff.errors > 0 || diff.warnings > 0;
const status = regressed ? "❌ REGRESSION" : "✅ OK";

writeFileSync(join(OUT_DIR, "security-report.json"),
  JSON.stringify({ baseline, live, diff, status, all_policies: allPolicies }, null, 2));

function tableMd(items, cols) {
  if (!items.length) return "_none_\n";
  const head = `| ${cols.join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |\n`;
  const body = items.map((r) => `| ${cols.map((c) => String(r[c] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`).join("\n");
  return head + body + "\n";
}

function detail(items) {
  if (!items.length) return "_none_\n";
  return items.map((f) => `- **${f.id}**\n  - evidence: \`${f.evidence}\`\n  - remediation: \`${f.remediation}\``).join("\n") + "\n";
}

const diffSign = (n) => (n > 0 ? `+${n}` : n < 0 ? String(n) : "0");

// ---------- PR comment body (concise) ----------
const prBody = `<!-- security-baseline-report -->
## 🔐 Security Baseline — ${status}

| Level    | Baseline | Live | Diff |
| -------- | -------: | ---: | ---: |
| errors   | ${baseline.errors}   | ${live.errors}   | ${diffSign(diff.errors)} |
| warnings | ${baseline.warnings} | ${live.warnings} | ${diffSign(diff.warnings)} |

**RLS-disabled tables:** ${rlsDisabled.length} · **Anon PII columns:** ${anonPii.length} · **Permissive writes:** ${permissiveWrites.length}

${regressed
  ? "> ⚠️ **New findings beyond the accepted baseline.** Full audit (with policy IDs + evidence) is in the `security-baseline-reports` artifact (`security-report.md`)."
  : "> ✅ No regressions vs `scripts/security-baseline.json`."
}

<details><summary>Top findings</summary>

**RLS disabled**
${tableMd(rlsDisabled.slice(0, 10), ["schema", "table", "id"])}
**Anon SELECT on PII columns**
${tableMd(anonPii.slice(0, 10), ["table", "column", "policy"])}
**Permissive writes**
${tableMd(permissiveWrites.slice(0, 10), ["table", "policy", "cmd"])}
</details>

_Generated ${live.generated_at} · run [#${process.env.GITHUB_RUN_ID || "local"}](${process.env.GITHUB_SERVER_URL || ""}/${process.env.GITHUB_REPOSITORY || ""}/actions/runs/${process.env.GITHUB_RUN_ID || ""})_
`;

writeFileSync(join(OUT_DIR, "pr-comment.md"), prBody);

// ---------- Full report (auditor-grade) ----------
const md = `# Security Findings Report — ${status}

**Generated:** ${live.generated_at}
**Baseline file:** \`scripts/security-baseline.json\` (errors=${baseline.errors}, warnings=${baseline.warnings})

## Summary vs baseline

| Level    | Baseline | Live | Diff |
| -------- | -------: | ---: | ---: |
| errors   | ${baseline.errors}   | ${live.errors}   | ${diffSign(diff.errors)} |
| warnings | ${baseline.warnings} | ${live.warnings} | ${diffSign(diff.warnings)} |

---

## ERROR — Public tables with RLS disabled (${rlsDisabled.length})

${tableMd(rlsDisabled, ["id", "schema", "table", "oid"])}

### Evidence & remediation
${detail(rlsDisabled)}

---

## ERROR — Anon SELECT on PII-named columns (${anonPii.length})

${tableMd(anonPii, ["id", "table", "column", "policy", "policy_oid"])}

### Evidence & remediation
${detail(anonPii)}

---

## WARN — Permissive write policies (USING/WITH CHECK = true) (${permissiveWrites.length})

${tableMd(permissiveWrites, ["id", "table", "policy", "cmd", "policy_oid"])}

### Evidence & remediation
${detail(permissiveWrites)}

---

## Full policy inventory — public + storage schemas (${allPolicies.length})

Use this as the evidence trail to trace any finding back to a concrete \`pg_policy\` row (policy_oid).

${tableMd(allPolicies, ["schema", "table", "policy", "policy_oid", "cmd", "roles", "using_expr", "with_check_expr"])}

${supabaseLinter ? `---\n\n## Supabase linter output (raw)\n\n\`\`\`json\n${supabaseLinter}\n\`\`\`\n` : ""}
`;

writeFileSync(join(OUT_DIR, "security-report.md"), md);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, prBody);
}

console.log(prBody);
console.log(`Report written to ${OUT_DIR}/security-report.{json,md} and pr-comment.md`);
if (regressed && process.env.FAIL_ON_REGRESSION === "1") process.exit(2);
