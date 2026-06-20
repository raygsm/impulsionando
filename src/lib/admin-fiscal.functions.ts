/**
 * Relatórios fiscais mensais (receitas + impostos) a partir de billing_invoices.
 * Apenas master/manager/support/admin.
 *
 * Cálculo de impostos é uma estimativa simples baseada em alíquotas configuráveis
 * via core_settings (chaves: fiscal.iss_rate, fiscal.pis_rate, fiscal.cofins_rate).
 * Defaults: ISS 5%, PIS 0,65%, COFINS 3%. Ajuste por município/regime no painel.
 *
 * Auditoria: toda geração/download/envio é registrado em `core_export_logs`
 * (kind = 'fiscal.report' | 'fiscal.csv' | 'fiscal.email', scope = 'admin.fiscal').
 */
import * as React from "react";
import { render as renderAsync } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_RATES = { iss: 0.05, pis: 0.0065, cofins: 0.03 };

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function monthLabel(year: number, month: number) {
  return `${MONTHS_PT[month - 1]}/${year}`;
}

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

async function audit(
  supabase: any,
  userId: string,
  kind: "fiscal.report" | "fiscal.csv" | "fiscal.email" | "fiscal.email.cron",
  params: Record<string, unknown>,
  row_count: number,
  notes?: string,
) {
  try {
    await supabase.from("core_export_logs").insert({
      user_id: userId,
      kind,
      scope: "admin.fiscal",
      params,
      row_count,
      notes: notes ?? null,
    });
  } catch (e) {
    // não bloqueia a operação principal
    console.warn("[audit fiscal] insert failed", e);
  }
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

    await audit(supabase, userId, "fiscal.report", { year: data.year, month: data.month }, totals.count);

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

function brlPretty(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildCsv(report: Awaited<ReturnType<typeof getMonthlyFiscalReport>>) {
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
  return { filename, csv: "\uFEFF" + lines.join("\n") };
}

export const exportMonthlyFiscalCsv = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; month: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const report = await getMonthlyFiscalReport({ data });
    const { filename, csv } = buildCsv(report);

    await audit(
      supabase,
      userId,
      "fiscal.csv",
      { year: data.year, month: data.month, filename },
      report.totals.count,
      "download",
    );

    return { filename, csv };
  });

export const listFiscalAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("core_export_logs")
      .select("id, user_id, kind, params, row_count, notes, created_at")
      .like("kind", "fiscal.%")
      .eq("scope", "admin.fiscal")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)));
    const { data: users } = userIds.length
      ? await supabaseAdmin
          .from("user_profiles")
          .select("user_id, email, full_name")
          .in("user_id", userIds as string[])
      : { data: [] };
    const uMap = new Map<string, any>((users ?? []).map((u: any) => [u.user_id, u]));

    return (rows ?? []).map((r) => ({
      ...r,
      user_email: r.user_id ? uMap.get(r.user_id)?.email ?? null : null,
      user_name: r.user_id ? uMap.get(r.user_id)?.full_name ?? null : null,
    }));
  });

export const getAccountantEmail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("core_settings")
      .select("value")
      .eq("key", "fiscal.accountant_email")
      .maybeSingle();
    const raw = (data?.value ?? null) as any;
    const email = typeof raw === "string" ? raw : raw?.email ?? null;
    return { email: email as string | null };
  });

export const setAccountantEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => {
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid email");
    return { email };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("core_settings")
      .upsert(
        { key: "fiscal.accountant_email", value: data.email, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) throw error;
    return { ok: true };
  });

/**
 * Núcleo do envio — usado pela ação manual (com auth) e pelo cron.
 * Gera CSV, faz upload em `fiscal-reports`, cria signed URL e enfileira e-mail.
 */
async function sendFiscalReportInternal(opts: {
  year: number;
  month: number;
  recipient: string;
  triggeredBy: "user" | "cron";
  userId?: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Reaproveita lógica de cálculo construindo direto pela admin (sem JWT no cron).
  const { startIso, endIso } = monthBounds(opts.year, opts.month);
  const rates = await loadRates(supabaseAdmin);
  const { data: invoices, error } = await supabaseAdmin
    .from("billing_invoices")
    .select("id, company_id, amount, status, paid_at, period_start, period_end")
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

  const rows = (invoices ?? []).map((inv: any) => {
    const c = cMap.get(inv.company_id);
    const gross = Number(inv.amount ?? 0);
    const iss = gross * rates.iss;
    const pis = gross * rates.pis;
    const cofins = gross * rates.cofins;
    const total_tax = iss + pis + cofins;
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
      total_tax,
      net: gross - total_tax,
    };
  });
  const totals = rows.reduce(
    (acc: any, r: any) => {
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

  const report = {
    year: opts.year,
    month: opts.month,
    rates,
    rows,
    totals,
    generated_at: new Date().toISOString(),
  };
  const { filename, csv } = buildCsv(report as any);

  // Upload CSV
  const path = `${opts.year}/${String(opts.month).padStart(2, "0")}/${Date.now()}-${filename}`;
  const { error: upErr } = await supabaseAdmin.storage
    .from("fiscal-reports")
    .upload(path, new Blob([csv], { type: "text/csv;charset=utf-8" }), {
      upsert: true,
      contentType: "text/csv;charset=utf-8",
    });
  if (upErr) throw upErr;

  const EXPIRES_SEC = 60 * 60 * 24 * 7; // 7 dias
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("fiscal-reports")
    .createSignedUrl(path, EXPIRES_SEC);
  if (signErr || !signed?.signedUrl) throw signErr ?? new Error("sign failed");

  const expiresAt = new Date(Date.now() + EXPIRES_SEC * 1000).toLocaleDateString("pt-BR");
  const dashboardUrl = "https://impulsionando.lovable.app/admin/fiscal";
  const monthStr = monthLabel(opts.year, opts.month);

  // Renderiza o template
  const { TEMPLATES } = await import("@/lib/email-templates/registry");
  const tpl = TEMPLATES["fiscal-report-monthly"];
  if (!tpl) throw new Error("template fiscal-report-monthly not registered");
  const templateData = {
    monthLabel: monthStr,
    totalCount: totals.count,
    grossBRL: brlPretty(totals.gross),
    taxBRL: brlPretty(totals.total_tax),
    netBRL: brlPretty(totals.net),
    csvUrl: signed.signedUrl,
    dashboardUrl,
    expiresAt,
  };
  const element = React.createElement(tpl.component, templateData);
  const html = await renderAsync(element);
  const plainText = await renderAsync(element, { plainText: true });
  const subject = typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;

  const messageId = crypto.randomUUID();
  const SITE_NAME = "impulsionando";
  const SENDER_DOMAIN = "notify.www.impulsionando.com.br";
  const FROM_DOMAIN = "www.impulsionando.com.br";

  // Log pending
  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: "fiscal-report-monthly",
    recipient_email: opts.recipient,
    status: "pending",
  });

  const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: opts.recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: "transactional",
      label: "fiscal-report-monthly",
      idempotency_key: `fiscal-${opts.year}-${opts.month}-${opts.recipient}`,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqErr) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "fiscal-report-monthly",
      recipient_email: opts.recipient,
      status: "failed",
      error_message: enqErr.message,
    });
    throw enqErr;
  }

  // Audit (cron usa user_id=null com notes='cron')
  await supabaseAdmin.from("core_export_logs").insert({
    user_id: opts.userId ?? null,
    kind: opts.triggeredBy === "cron" ? "fiscal.email.cron" : "fiscal.email",
    scope: "admin.fiscal",
    params: {
      year: opts.year,
      month: opts.month,
      recipient: opts.recipient,
      path,
      message_id: messageId,
    },
    row_count: totals.count,
    notes: opts.triggeredBy,
  });

  return { ok: true, message_id: messageId, recipient: opts.recipient, csv_path: path };
}

export const sendMonthlyFiscalEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { year: number; month: number; recipient?: string }) => {
    if (!Number.isInteger(data.year) || !Number.isInteger(data.month)) {
      throw new Error("invalid period");
    }
    if (data.recipient !== undefined) {
      const email = String(data.recipient).trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("invalid email");
      }
      return { ...data, recipient: email || undefined };
    }
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let recipient = data.recipient;
    if (!recipient) {
      const { data: setting } = await supabaseAdmin
        .from("core_settings")
        .select("value")
        .eq("key", "fiscal.accountant_email")
        .maybeSingle();
      const raw = (setting?.value ?? null) as any;
      recipient = typeof raw === "string" ? raw : raw?.email ?? undefined;
    }
    if (!recipient) throw new Error("e-mail do contador não configurado");
    return sendFiscalReportInternal({
      year: data.year,
      month: data.month,
      recipient,
      triggeredBy: "user",
      userId,
    });
  });

/**
 * Acionada pelo cron mensal (sem auth). Não exportar via createServerFn,
 * para evitar endpoint público; o cron HTTP chama o route handler que chama esta função.
 */
export async function runMonthlyFiscalEmailCron() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: setting } = await supabaseAdmin
    .from("core_settings")
    .select("value")
    .eq("key", "fiscal.accountant_email")
    .maybeSingle();
  const raw = (setting?.value ?? null) as any;
  const recipient = typeof raw === "string" ? raw : raw?.email ?? null;
  if (!recipient) {
    return { ok: false, skipped: "accountant_email_not_configured" as const };
  }
  // Mês anterior (UTC)
  const now = new Date();
  const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth() + 1;
  return sendFiscalReportInternal({
    year,
    month,
    recipient,
    triggeredBy: "cron",
    userId: null,
  });
}
