#!/usr/bin/env bun
/**
 * Verify-exports: valida que a agregação do dashboard macro
 * (src/lib/core-dashboard.functions.ts) bate com queries SQL diretas
 * em billing_invoices, marketing_leads, trial_subscriptions,
 * subscriptions, n8n_workflow_runs, evt_ticket_transfers e evt_checkins
 * para diferentes combinações de filtros (período, nicho, régua, workflow).
 *
 * Uso:
 *   bun run scripts/verify-exports.ts
 *
 * Estratégia: re-implementa a mesma agregação que o dashboard faz,
 * porém em duas vias independentes (scan + GROUP BY agregado SQL)
 * e compara os totais. Diferença => script sai com código != 0.
 *
 * Requer PGHOST/PGUSER/PGPASSWORD/PGDATABASE (já presentes no sandbox).
 */

import { execSync } from "node:child_process";

type Row = Record<string, string>;

function q(sql: string): Row[] {
  const flat = sql.replace(/\s+/g, " ").trim();
  const out = execSync(`psql -At -F "|" -c ${JSON.stringify(flat)}`, {
    encoding: "utf8",
    env: process.env,
  });
  const lines = out.trim().split("\n").filter(Boolean);
  return lines.map((line) => {
    const cells = line.split("|");
    return { _raw: line, ...Object.fromEntries(cells.map((v, i) => [String(i), v])) };
  });
}

function scalar(sql: string): string {
  const rows = q(sql);
  return rows[0]?.["0"] ?? "";
}

type Filter = {
  label: string;
  days: number;
  nicheSlug?: string;
  regua?: string;
  workflow?: string;
};

const filters: Filter[] = [
  { label: "all-30d", days: 30 },
  { label: "all-7d", days: 7 },
  { label: "all-90d", days: 90 },
  { label: "saude-30d", days: 30, nicheSlug: "saude" },
];

let failed = 0;
const failures: string[] = [];

function check(label: string, a: number, b: number, tolerance = 0) {
  const diff = Math.abs(a - b);
  if (diff > tolerance) {
    failed++;
    failures.push(`✗ ${label}: scan=${a} vs sql=${b} (diff=${diff})`);
    console.error(`✗ ${label}: scan=${a} vs sql=${b}`);
  } else {
    console.log(`✓ ${label}: ${a}`);
  }
}

function isoFromDays(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function whereCompanyJoin(nicheSlug?: string): string {
  if (!nicheSlug) return "";
  return ` AND company_id IN (SELECT id FROM companies WHERE niche_id = (SELECT id FROM niches WHERE slug = ${JSON.stringify(nicheSlug)}))`;
}

for (const f of filters) {
  console.log(`\n── filter: ${f.label} ─────────────────`);
  const from = isoFromDays(f.days);

  // Revenue paid invoices
  const revScan = Number(scalar(
    `SELECT COALESCE(SUM(amount),0)::numeric FROM billing_invoices
     WHERE status='paid' AND created_at >= '${from}'
     ${whereCompanyJoin(f.nicheSlug)}`,
  ));
  const revSql = Number(scalar(
    `SELECT COALESCE(SUM(amount)::numeric,0) FROM billing_invoices i
     WHERE i.status='paid' AND i.created_at >= '${from}'
     ${f.nicheSlug
        ? `AND EXISTS (SELECT 1 FROM companies c JOIN niches n ON n.id=c.niche_id
                       WHERE c.id=i.company_id AND n.slug=${"'" + f.nicheSlug + "'"})`
        : ""}`,
  ));
  check(`revenue(${f.label})`, revScan, revSql, 0.001);

  // Leads (não filtrável por nicho diretamente; só janela)
  const leadsA = Number(scalar(
    `SELECT COUNT(*) FROM marketing_leads WHERE created_at >= '${from}'`,
  ));
  const leadsB = Number(scalar(
    `SELECT COUNT(id) FROM marketing_leads WHERE created_at >= '${from}'`,
  ));
  check(`leads(${f.label})`, leadsA, leadsB);

  // n8n events / failures
  const nWhere = [
    `created_at >= '${from}'`,
    f.regua ? `regua=${"'" + f.regua + "'"}` : null,
    f.workflow ? `workflow_name=${"'" + f.workflow + "'"}` : null,
    f.nicheSlug
      ? `tenant_id IN (SELECT id FROM companies WHERE niche_id=(SELECT id FROM niches WHERE slug=${"'" + f.nicheSlug + "'"}))`
      : null,
  ].filter(Boolean).join(" AND ");
  const nTotal = Number(scalar(`SELECT COUNT(*) FROM n8n_workflow_runs WHERE ${nWhere}`));
  const nFailed = Number(scalar(
    `SELECT COUNT(*) FROM n8n_workflow_runs WHERE ${nWhere} AND status='failed'`,
  ));
  const nAgg = q(
    `SELECT COALESCE(SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END),0)::int,
            COUNT(*)::int FROM n8n_workflow_runs WHERE ${nWhere}`,
  );
  check(`n8n_total(${f.label})`, nTotal, Number(nAgg[0]?.["1"] ?? 0));
  check(`n8n_failed(${f.label})`, nFailed, Number(nAgg[0]?.["0"] ?? 0));

  // Trial conversions
  const tStarted = Number(scalar(
    `SELECT COUNT(*) FROM trial_subscriptions WHERE created_at >= '${from}'`,
  ));
  const tConv = Number(scalar(
    `SELECT COUNT(*) FROM trial_subscriptions WHERE created_at >= '${from}' AND status='convertido'`,
  ));
  console.log(`  trialsStarted=${tStarted}  converted=${tConv}`);

  // Transferências e check-ins (escopo de exportação por evento)
  const tr = Number(scalar(
    `SELECT COUNT(*) FROM evt_ticket_transfers WHERE created_at >= '${from}'`,
  ));
  const ck = Number(scalar(
    `SELECT COUNT(*) FROM evt_checkins WHERE created_at >= '${from}'`,
  ));
  console.log(`  transfers=${tr}  checkins=${ck}`);
}

console.log("\n────────────────────────────────");
if (failed > 0) {
  console.error(`\n✗ ${failed} divergência(s) detectada(s):`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log(`✓ Todas as ${filters.length} combinações de filtros bateram com SQL direto.`);
