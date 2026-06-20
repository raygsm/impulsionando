/**
 * Relatórios fiscais mensais (receitas + impostos) a partir de billing_invoices.
 * Apenas master/manager/support/admin.
 *
 * Cálculo de impostos é uma estimativa simples baseada em alíquotas configuráveis
 * via core_settings (chaves: fiscal.iss_rate, fiscal.pis_rate, fiscal.cofins_rate).
 * Defaults: ISS 5%, PIS 0,65%, COFINS 3%. Ajuste por município/regime no painel.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_RATES = { iss: 0.05, pis: 0.0065, cofins: 0.03 };

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["master", "manager", "support", "admin"]);
  if (!data || data.length === 0) throw new Error("forbidden");
}

async function loadRates(supabaseAdmin: any) {
  const { data } = await supabaseAdmin
    .from("core_settings")
    .select("key, value")
    .in("key", ["fiscal.iss_rate", "fiscal.pis_rate", "fiscal.cofins_rate"]);
  const rates = { ...DEFAULT_RATES };
  for (const row of data ?? []) {
    const v = Number(row.value);
    if (!Number.isFinite(v) || v < 0 || v > 1) continue;
    if (row.key === "fiscal.iss_rate") rates.iss = v;
    if (row.key === "fiscal.pis_rate") rates.pis = v;
    if (row.key === "fiscal.cofins_rate") rates.cofins = v;
  }
  return rates;
}

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export const getMonthlyFiscalReport = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; month: number }) => {
    if (!Number.isInteger(data.year) || data.year < 2020 || data.year > 2100) {
      throw new Error("invalid year");
    }
    if (!Number.isInteger(data.month) || data.month < 1 || data.month > 12) {
      throw new Error("invalid month");
    }
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { startIso, endIso } = monthBounds(data.year, data.month);
    const rates = await loadRates(supabaseAdmin);

    const { data: invoices, error } = await supabaseAdmin
      .from("billing_invoices")
      .select(
        "id, company_id, contract_id, amount, status, paid_at, due_date, period_start, period_end, created_at",
      )
      .eq("status", "paid")
      .gte("paid_at", startIso)
      .lt("paid_at", endIso)
      .order("paid_at", { ascending: true });
    if (error) throw error;

    const companyIds = Array.from(new Set((invoices ?? []).map((i) => i.company_id)));
    const { data: companies } = companyIds.length
      ? await supabaseAdmin
          .from("companies")
          .select("id, legal_name, document, name")
          .in("id", companyIds)
      : { data: [] };
    const cMap = new Map<string, any>((companies ?? []).map((c: any) => [c.id, c]));

    const rows = (invoices ?? []).map((inv) => {
      const c = cMap.get(inv.company_id);
      const gross = Number(inv.amount ?? 0);
      const iss = gross * rates.iss;
      const pis = gross * rates.pis;
      const cofins = gross * rates.cofins;
      const totalTax = iss + pis + cofins;
      return {
        invoice_id: inv.id,
        paid_at: inv.paid_at,
        company_id: inv.company_id,
        company_name: c?.legal_name ?? c?.name ?? "—",
        company_document: c?.document ?? "",
        period_start: inv.period_start,
        period_end: inv.period_end,
        gross,
        iss,
        pis,
        cofins,
        total_tax: totalTax,
        net: gross - totalTax,
      };
    });

    const totals = rows.reduce(
      (acc, r) => {
        acc.gross += r.gross;
        acc.iss += r.iss;
        acc.pis += r.pis;
        acc.cofins += r.cofins;
        acc.total_tax += r.total_tax;
        acc.net += r.net;
        acc.count += 1;
        return acc;
      },
      { gross: 0, iss: 0, pis: 0, cofins: 0, total_tax: 0, net: 0, count: 0 },
    );

    return {
      year: data.year,
      month: data.month,
      rates,
      rows,
      totals,
      generated_at: new Date().toISOString(),
    };
  });

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function brl(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export const exportMonthlyFiscalCsv = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; month: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const report = await getMonthlyFiscalReport({ data });

    const header = [
      "invoice_id",
      "paid_at",
      "company_name",
      "company_document",
      "period_start",
      "period_end",
      "gross",
      "iss",
      "pis",
      "cofins",
      "total_tax",
      "net",
    ];
    const lines = [header.join(";")];
    for (const r of report.rows) {
      lines.push(
        [
          r.invoice_id,
          r.paid_at ?? "",
          r.company_name,
          r.company_document,
          r.period_start,
          r.period_end,
          brl(r.gross),
          brl(r.iss),
          brl(r.pis),
          brl(r.cofins),
          brl(r.total_tax),
          brl(r.net),
        ]
          .map(csvEscape)
          .join(";"),
      );
    }
    lines.push("");
    lines.push(
      [
        "TOTAIS",
        "",
        `${report.totals.count} faturas`,
        "",
        "",
        "",
        brl(report.totals.gross),
        brl(report.totals.iss),
        brl(report.totals.pis),
        brl(report.totals.cofins),
        brl(report.totals.total_tax),
        brl(report.totals.net),
      ]
        .map(csvEscape)
        .join(";"),
    );

    const filename = `fiscal-${report.year}-${String(report.month).padStart(2, "0")}.csv`;
    // BOM para abrir corretamente no Excel BR
    return { filename, csv: "\uFEFF" + lines.join("\n") };
  });
