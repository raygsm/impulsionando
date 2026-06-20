/**
 * Relatórios fiscais mensais (receitas + impostos) a partir de billing_invoices.
 * Apenas usuários com papel `admin` (público padrão do sistema).
 *
 * Recursos:
 *  - Cálculo configurável de ISS/PIS/COFINS via `core_settings`
 *  - Filtro mês/ano + auditoria em `core_export_logs`
 *  - Agenda mensal configurável (dia/hora/fuso) em `core_settings`
 *  - Modo de e-mail: link assinado (padrão) ou resumo inline + link assinado
 *  - Status por período em `fiscal_email_runs` (pending/sent/failed)
 *  - Reenvio automático/manual com auditoria
 */
import * as React from "react";
import { render as renderAsync } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_RATES = { iss: 0.05, pis: 0.0065, cofins: 0.03 };

export const DEFAULT_SCHEDULE = {
  day: 1, // dia do mês (1-28)
  hour: 6, // 0-23
  minute: 0, // 0-59
  tz: "America/Sao_Paulo", // IANA
  email_mode: "link" as "link" | "inline",
  // Retry / backoff (aplicado pelo cron e pelo botão "reenviar")
  max_attempts: 3,
  backoff_minutes: 60,
  // Expiração padrão do link assinado (horas)
  link_expiry_hours: 168, // 7 dias
};

function isValidTz(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch { return false; }
}

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
    .eq("role", "admin");
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
  userId: string | null,
  kind:
    | "fiscal.report"
    | "fiscal.csv"
    | "fiscal.email"
    | "fiscal.email.cron"
    | "fiscal.email.retry"
    | "fiscal.email.skipped"
    | "fiscal.schedule.update"
    | "fiscal.preview"
    | "fiscal.preview.csv"
    | "fiscal.link.regenerated"
    | "fiscal.link.copied"
    | "fiscal.link.opened"
    | "fiscal.email.test"
    | "fiscal.email.test.failed",
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
    console.warn("[audit fiscal] insert failed", e);
  }
}

// ───────────────────────── Relatório ─────────────────────────

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
    "invoice_id", "paid_at", "company_name", "company_document",
    "period_start", "period_end", "gross", "iss", "pis", "cofins", "total_tax", "net",
  ];
  const lines = [header.join(";")];
  for (const r of report.rows) {
    lines.push([
      r.invoice_id, r.paid_at ?? "", r.company_name, r.company_document,
      r.period_start, r.period_end, brl(r.gross), brl(r.iss), brl(r.pis),
      brl(r.cofins), brl(r.total_tax), brl(r.net),
    ].map(csvEscape).join(";"));
  }
  lines.push("");
  lines.push([
    "TOTAIS", "", `${report.totals.count} faturas`, "", "", "",
    brl(report.totals.gross), brl(report.totals.iss), brl(report.totals.pis),
    brl(report.totals.cofins), brl(report.totals.total_tax), brl(report.totals.net),
  ].map(csvEscape).join(";"));
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
      supabase, userId, "fiscal.csv",
      { year: data.year, month: data.month, filename },
      report.totals.count, "download",
    );
    return { filename, csv };
  });

// ───────────────────────── Auditoria ─────────────────────────

export const listFiscalAuditLogs = createServerFn({ method: "GET" })
  .inputValidator((data?: {
    from?: string;
    to?: string;
    user_email?: string;
    recipient?: string;
    kind?: string;
    limit?: number;
  }) => data ?? {})
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.max(1, Math.min(data.limit ?? 500, 5000));

    let query = supabaseAdmin
      .from("core_export_logs")
      .select("id, user_id, kind, params, row_count, notes, created_at")
      .like("kind", "fiscal.%")
      .eq("scope", "admin.fiscal")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);
    if (data.kind) query = query.eq("kind", data.kind);

    const { data: rows, error } = await query;
    if (error) throw error;

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)));
    const { data: users } = userIds.length
      ? await supabaseAdmin
          .from("user_profiles")
          .select("user_id, email, display_name")
          .in("user_id", userIds as string[])
      : { data: [] };
    const uMap = new Map<string, any>((users ?? []).map((u: any) => [u.user_id, u]));

    let result = (rows ?? []).map((r) => ({
      ...r,
      user_email: r.user_id ? uMap.get(r.user_id)?.email ?? null : null,
      user_name: r.user_id ? uMap.get(r.user_id)?.display_name ?? null : null,
      recipient: (r.params as any)?.recipient ?? null,
    }));

    if (data.user_email) {
      const needle = data.user_email.toLowerCase();
      result = result.filter((r) => (r.user_email ?? "").toLowerCase().includes(needle));
    }
    if (data.recipient) {
      const needle = data.recipient.toLowerCase();
      result = result.filter((r) => (r.recipient ?? "").toLowerCase().includes(needle));
    }
    return result;
  });

// ───────────────────────── Contador / agenda ─────────────────────────

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
        {
          key: "fiscal.accountant_email",
          label: "E-mail do contador (relatório fiscal)",
          value: data.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    if (error) throw error;
    return { ok: true };
  });

async function readSchedule(supabaseAdmin: any) {
  const { data } = await supabaseAdmin
    .from("core_settings")
    .select("key, value")
    .in("key", [
      "fiscal.cron.day", "fiscal.cron.hour", "fiscal.cron.minute",
      "fiscal.cron.tz", "fiscal.email_mode",
      "fiscal.retry.max_attempts", "fiscal.retry.backoff_minutes",
      "fiscal.link.expiry_hours",
    ]);
  const out = { ...DEFAULT_SCHEDULE };
  for (const r of data ?? []) {
    const raw = (r.value as any);
    const v = typeof raw === "string" ? raw : raw?.value ?? raw;
    if (r.key === "fiscal.cron.day") {
      const n = Number(v); if (Number.isInteger(n) && n >= 1 && n <= 28) out.day = n;
    } else if (r.key === "fiscal.cron.hour") {
      const n = Number(v); if (Number.isInteger(n) && n >= 0 && n <= 23) out.hour = n;
    } else if (r.key === "fiscal.cron.minute") {
      const n = Number(v); if (Number.isInteger(n) && n >= 0 && n <= 59) out.minute = n;
    } else if (r.key === "fiscal.cron.tz") {
      if (typeof v === "string" && isValidTz(v)) out.tz = v;
    } else if (r.key === "fiscal.email_mode") {
      if (v === "link" || v === "inline") out.email_mode = v;
    } else if (r.key === "fiscal.retry.max_attempts") {
      const n = Number(v); if (Number.isInteger(n) && n >= 1 && n <= 10) out.max_attempts = n;
    } else if (r.key === "fiscal.retry.backoff_minutes") {
      const n = Number(v); if (Number.isInteger(n) && n >= 5 && n <= 1440) out.backoff_minutes = n;
    } else if (r.key === "fiscal.link.expiry_hours") {
      const n = Number(v); if (Number.isInteger(n) && n >= 1 && n <= 720) out.link_expiry_hours = n;
    }
  }
  return out;
}

export const getFiscalScheduleSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return readSchedule(supabaseAdmin);
  });

export const setFiscalScheduleSettings = createServerFn({ method: "POST" })
  .inputValidator((data: {
    day: number; hour: number; minute: number; tz: string;
    email_mode: "link" | "inline";
    max_attempts?: number;
    backoff_minutes?: number;
    link_expiry_hours?: number;
  }) => {
    const errors: Record<string, string> = {};
    if (!Number.isInteger(data.day) || data.day < 1 || data.day > 28)
      errors.day = "Dia precisa ser inteiro entre 1 e 28.";
    if (!Number.isInteger(data.hour) || data.hour < 0 || data.hour > 23)
      errors.hour = "Hora precisa estar entre 0 e 23.";
    if (!Number.isInteger(data.minute) || data.minute < 0 || data.minute > 59)
      errors.minute = "Minuto precisa estar entre 0 e 59.";
    if (!data.tz || typeof data.tz !== "string" || !isValidTz(data.tz))
      errors.tz = "Fuso IANA inválido (ex.: America/Sao_Paulo).";
    if (data.email_mode !== "link" && data.email_mode !== "inline")
      errors.email_mode = "Modo inválido.";
    if (data.max_attempts !== undefined &&
        (!Number.isInteger(data.max_attempts) || data.max_attempts < 1 || data.max_attempts > 10))
      errors.max_attempts = "Máx. de tentativas entre 1 e 10.";
    if (data.backoff_minutes !== undefined &&
        (!Number.isInteger(data.backoff_minutes) || data.backoff_minutes < 5 || data.backoff_minutes > 1440))
      errors.backoff_minutes = "Backoff entre 5 e 1440 min.";
    if (data.link_expiry_hours !== undefined &&
        (!Number.isInteger(data.link_expiry_hours) || data.link_expiry_hours < 1 || data.link_expiry_hours > 720))
      errors.link_expiry_hours = "Expiração do link entre 1h e 720h (30 dias).";
    if (Object.keys(errors).length) {
      const e: any = new Error("validation:" + JSON.stringify(errors));
      e.validation = errors;
      throw e;
    }
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const payload: any[] = [
      { key: "fiscal.cron.day", label: "Dia do envio mensal", value: data.day, updated_at: now },
      { key: "fiscal.cron.hour", label: "Hora do envio mensal", value: data.hour, updated_at: now },
      { key: "fiscal.cron.minute", label: "Minuto do envio mensal", value: data.minute, updated_at: now },
      { key: "fiscal.cron.tz", label: "Fuso horário do envio mensal", value: data.tz, updated_at: now },
      { key: "fiscal.email_mode", label: "Modo do e-mail fiscal", value: data.email_mode, updated_at: now },
    ];
    if (data.max_attempts !== undefined)
      payload.push({ key: "fiscal.retry.max_attempts", label: "Máx. tentativas (envio fiscal)", value: data.max_attempts, updated_at: now });
    if (data.backoff_minutes !== undefined)
      payload.push({ key: "fiscal.retry.backoff_minutes", label: "Backoff entre tentativas (min)", value: data.backoff_minutes, updated_at: now });
    if (data.link_expiry_hours !== undefined)
      payload.push({ key: "fiscal.link.expiry_hours", label: "Expiração padrão do link assinado (h)", value: data.link_expiry_hours, updated_at: now });
    const { error } = await supabaseAdmin
      .from("core_settings")
      .upsert(payload, { onConflict: "key" });
    if (error) throw error;
    await audit(supabase, userId, "fiscal.schedule.update", data, 0);
    return { ok: true };
  });

// ───────────────────────── Status por período ─────────────────────────

export const getFiscalPeriodStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; month: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: runs } = await supabaseAdmin
      .from("fiscal_email_runs")
      .select("id, status, recipient, triggered_by, email_mode, attempt, error_message, message_id, csv_path, signed_url_expires_at, created_at, updated_at")
      .eq("year", data.year)
      .eq("month", data.month)
      .order("created_at", { ascending: false })
      .limit(20);
    return {
      latest: (runs ?? [])[0] ?? null,
      history: runs ?? [],
    };
  });

/**
 * Lista runs com status "failed" (mais recente por período), com cálculo
 * de próximo retry/backoff e flag de limite de tentativas atingido.
 */
export const listFailedFiscalRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const schedule = await readSchedule(supabaseAdmin);
    const { data: runs } = await supabaseAdmin
      .from("fiscal_email_runs")
      .select("id, year, month, status, recipient, attempt, error_message, csv_path, signed_url_expires_at, created_at, updated_at, triggered_by, email_mode")
      .order("created_at", { ascending: false })
      .limit(300);
    const seen = new Set<string>();
    const failed: any[] = [];
    const now = Date.now();
    for (const r of runs ?? []) {
      const key = `${r.year}-${r.month}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (r.status !== "failed") continue;
      const lastTs = new Date(r.updated_at ?? r.created_at).getTime();
      const nextRetryTs = lastTs + schedule.backoff_minutes * 60_000;
      const remainingMinutes = Math.max(0, Math.ceil((nextRetryTs - now) / 60_000));
      const maxReached = (r.attempt ?? 0) >= schedule.max_attempts;
      failed.push({
        ...r,
        next_retry_at: new Date(nextRetryTs).toISOString(),
        remaining_minutes: remainingMinutes,
        backoff_ready: remainingMinutes === 0,
        max_attempts_reached: maxReached,
        max_attempts: schedule.max_attempts,
        backoff_minutes: schedule.backoff_minutes,
      });
    }
    return {
      runs: failed,
      schedule: { max_attempts: schedule.max_attempts, backoff_minutes: schedule.backoff_minutes },
    };
  });



// ───────────────────────── Envio ─────────────────────────

async function sendFiscalReportInternal(opts: {
  year: number;
  month: number;
  recipient: string;
  triggeredBy: "user" | "cron" | "retry";
  userId?: string | null;
  emailMode?: "link" | "inline";
  expirySeconds?: number;
  test?: boolean;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const isTest = !!opts.test;

  // Conta tentativas anteriores (apenas para sends reais)
  let attempt = 1;
  let runId: string | null = null;
  if (!isTest) {
    const { data: prev } = await supabaseAdmin
      .from("fiscal_email_runs")
      .select("attempt")
      .eq("year", opts.year)
      .eq("month", opts.month)
      .order("created_at", { ascending: false })
      .limit(1);
    attempt = ((prev ?? [])[0]?.attempt ?? 0) + 1;
  }

  // Resolve email_mode
  const schedule = await readSchedule(supabaseAdmin);
  const emailMode = opts.emailMode ?? schedule.email_mode;

  // Cria registro pendente (somente para sends reais)
  if (!isTest) {
    const { data: runRow, error: runErr } = await supabaseAdmin
      .from("fiscal_email_runs")
      .insert({
        year: opts.year,
        month: opts.month,
        recipient: opts.recipient,
        status: "pending",
        triggered_by: opts.triggeredBy,
        email_mode: emailMode,
        attempt,
        user_id: opts.userId ?? null,
      })
      .select("id")
      .single();
    if (runErr) throw runErr;
    runId = runRow!.id as string;
  }


  try {
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
        gross, iss, pis, cofins, total_tax, net: gross - total_tax,
      };
    });
    const totals = rows.reduce(
      (acc: any, r: any) => {
        acc.gross += r.gross; acc.iss += r.iss; acc.pis += r.pis;
        acc.cofins += r.cofins; acc.total_tax += r.total_tax; acc.net += r.net;
        acc.count += 1; return acc;
      },
      { gross: 0, iss: 0, pis: 0, cofins: 0, total_tax: 0, net: 0, count: 0 },
    );

    const report = {
      year: opts.year, month: opts.month, rates, rows, totals,
      generated_at: new Date().toISOString(),
    };
    const { filename, csv } = buildCsv(report as any);

    const path = `${opts.year}/${String(opts.month).padStart(2, "0")}/${Date.now()}-${filename}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("fiscal-reports")
      .upload(path, new Blob([csv], { type: "text/csv;charset=utf-8" }), {
        upsert: true, contentType: "text/csv;charset=utf-8",
      });
    if (upErr) throw upErr;

    const defaultSec = Math.max(3600, Math.min(720, schedule.link_expiry_hours) * 3600);
    const EXPIRES_SEC = opts.expirySeconds && opts.expirySeconds > 0
      ? Math.max(3600, Math.min(opts.expirySeconds, 720 * 3600))
      : defaultSec;
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("fiscal-reports")
      .createSignedUrl(path, EXPIRES_SEC);
    if (signErr || !signed?.signedUrl) throw signErr ?? new Error("sign failed");

    const expiresIso = new Date(Date.now() + EXPIRES_SEC * 1000).toISOString();
    const expiresAt = new Date(expiresIso).toLocaleDateString("pt-BR");
    const dashboardUrl = "https://impulsionando.lovable.app/admin/fiscal";
    const monthStr = monthLabel(opts.year, opts.month);

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
      mode: emailMode,
      inlineRows: emailMode === "inline"
        ? rows.map((r: any) => ({
            paid_at: r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—",
            company_name: r.company_name,
            company_document: r.company_document,
            gross: brlPretty(r.gross),
            tax: brlPretty(r.total_tax),
            net: brlPretty(r.net),
          }))
        : [],
    };
    const element = React.createElement(tpl.component as any, templateData);
    const html = await renderAsync(element);
    const plainText = await renderAsync(element, { plainText: true });
    const rawSubject = typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;
    const subject = isTest ? `[TESTE] ${rawSubject}` : rawSubject;

    const messageId = crypto.randomUUID();
    const SITE_NAME = "impulsionando";
    const SENDER_DOMAIN = "notify.www.impulsionando.com.br";
    const FROM_DOMAIN = "www.impulsionando.com.br";

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "fiscal-report-monthly",
      recipient_email: opts.recipient,
      status: "pending",
    });

    const idemSuffix = isTest ? `test-${messageId}` : `${attempt}`;
    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: opts.recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject, html, text: plainText,
        purpose: "transactional",
        label: isTest ? "fiscal-report-monthly-test" : "fiscal-report-monthly",
        idempotency_key: `fiscal-${opts.year}-${opts.month}-${opts.recipient}-${idemSuffix}`,
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

    // marca como enviado (apenas sends reais)
    if (!isTest && runId) {
      await supabaseAdmin
        .from("fiscal_email_runs")
        .update({
          status: "sent",
          message_id: messageId,
          csv_path: path,
          signed_url_expires_at: expiresIso,
          error_message: null,
        })
        .eq("id", runId);
    }

    await supabaseAdmin.from("core_export_logs").insert({
      user_id: opts.userId ?? null,
      kind: isTest
        ? "fiscal.email.test"
        : opts.triggeredBy === "cron"
          ? "fiscal.email.cron"
          : opts.triggeredBy === "retry"
            ? "fiscal.email.retry"
            : "fiscal.email",
      scope: "admin.fiscal",
      params: {
        year: opts.year, month: opts.month, recipient: opts.recipient,
        path, message_id: messageId, email_mode: emailMode, attempt,
        signed_url: signed.signedUrl,
        signed_url_expires_at: expiresIso,
        expiry_hours: Math.round(EXPIRES_SEC / 3600),
        test: isTest || undefined,
      },
      row_count: totals.count,
      notes: isTest ? "test" : opts.triggeredBy,
    });

    return {
      ok: true, run_id: runId, message_id: messageId,
      recipient: opts.recipient, csv_path: path, email_mode: emailMode,
      signed_url: signed.signedUrl, signed_url_expires_at: expiresIso,
      test: isTest,
    };
  } catch (e: any) {
    if (!isTest && runId) {
      await supabaseAdmin
        .from("fiscal_email_runs")
        .update({
          status: "failed",
          error_message: String(e?.message ?? e).slice(0, 1000),
        })
        .eq("id", runId);
    }
    throw e;
  }
}


export const sendMonthlyFiscalEmail = createServerFn({ method: "POST" })
  .inputValidator((data: {
    year: number; month: number; recipient?: string;
    email_mode?: "link" | "inline";
    expiry_hours?: number;
  }) => {
    if (!Number.isInteger(data.year) || !Number.isInteger(data.month)) {
      throw new Error("invalid period");
    }
    if (data.expiry_hours !== undefined) {
      if (!Number.isInteger(data.expiry_hours) || data.expiry_hours < 1 || data.expiry_hours > 720)
        throw new Error("Expiração do link entre 1h e 720h.");
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
        .select("value").eq("key", "fiscal.accountant_email").maybeSingle();
      const raw = (setting?.value ?? null) as any;
      recipient = typeof raw === "string" ? raw : raw?.email ?? undefined;
    }
    if (!recipient) throw new Error("e-mail do contador não configurado");
    return sendFiscalReportInternal({
      year: data.year, month: data.month, recipient,
      triggeredBy: "user", userId, emailMode: data.email_mode,
      expirySeconds: data.expiry_hours ? data.expiry_hours * 3600 : undefined,
    });
  });

export const resendMonthlyFiscalEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { year: number; month: number; force?: boolean; expiry_hours?: number }) => {
    if (!Number.isInteger(data.year) || !Number.isInteger(data.month)) {
      throw new Error("invalid period");
    }
    if (data.expiry_hours !== undefined) {
      if (!Number.isInteger(data.expiry_hours) || data.expiry_hours < 1 || data.expiry_hours > 720)
        throw new Error("Expiração do link entre 1h e 720h.");
    }
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const schedule = await readSchedule(supabaseAdmin);

    const { data: runs } = await supabaseAdmin
      .from("fiscal_email_runs")
      .select("status, recipient, attempt, updated_at, created_at")
      .eq("year", data.year)
      .eq("month", data.month)
      .order("created_at", { ascending: false })
      .limit(1);
    const last = (runs ?? [])[0];
    if (!data.force && (!last || last.status !== "failed")) {
      throw new Error("Reenvio automático só disponível quando o último envio falhou.");
    }
    // Limite de tentativas (somente em retry não-forçado)
    if (!data.force && last) {
      if ((last.attempt ?? 0) >= schedule.max_attempts) {
        throw new Error(
          `Limite de ${schedule.max_attempts} tentativas atingido. Use "Forçar novo envio" para retomar manualmente.`,
        );
      }
      const lastTs = new Date(last.updated_at ?? last.created_at).getTime();
      const waitMs = schedule.backoff_minutes * 60_000;
      const elapsed = Date.now() - lastTs;
      if (elapsed < waitMs) {
        const remain = Math.ceil((waitMs - elapsed) / 60_000);
        throw new Error(`Aguarde ${remain} min de backoff antes de reenviar (ou use "Forçar novo envio").`);
      }
    }

    let recipient = last?.recipient as string | undefined;
    if (!recipient) {
      const { data: setting } = await supabaseAdmin
        .from("core_settings")
        .select("value").eq("key", "fiscal.accountant_email").maybeSingle();
      const raw = (setting?.value ?? null) as any;
      recipient = typeof raw === "string" ? raw : raw?.email ?? undefined;
    }
    if (!recipient) throw new Error("e-mail do contador não configurado");

    return sendFiscalReportInternal({
      year: data.year, month: data.month, recipient,
      triggeredBy: "retry", userId,
      expirySeconds: data.expiry_hours ? data.expiry_hours * 3600 : undefined,
    });
  });

// ───────────────────────── Preview ─────────────────────────

export const previewMonthlyFiscalEmail = createServerFn({ method: "POST" })
  .inputValidator((data: {
    year: number; month: number;
    email_mode?: "link" | "inline";
    recipient?: string;
  }) => {
    if (!Number.isInteger(data.year) || !Number.isInteger(data.month)) {
      throw new Error("invalid period");
    }
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const schedule = await readSchedule(supabaseAdmin);
    const emailMode = data.email_mode ?? schedule.email_mode;

    const report = await getMonthlyFiscalReport({ data: { year: data.year, month: data.month } });
    const monthStr = monthLabel(data.year, data.month);
    const fakeExpiry = new Date(Date.now() + schedule.link_expiry_hours * 3600 * 1000)
      .toLocaleDateString("pt-BR");

    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const tpl = TEMPLATES["fiscal-report-monthly"];
    if (!tpl) throw new Error("template fiscal-report-monthly not registered");

    const templateData = {
      monthLabel: monthStr,
      totalCount: report.totals.count,
      grossBRL: brlPretty(report.totals.gross),
      taxBRL: brlPretty(report.totals.total_tax),
      netBRL: brlPretty(report.totals.net),
      csvUrl: "https://example.invalid/preview.csv",
      dashboardUrl: "https://impulsionando.lovable.app/admin/fiscal",
      expiresAt: fakeExpiry,
      mode: emailMode,
      inlineRows: emailMode === "inline"
        ? report.rows.map((r: any) => ({
            paid_at: r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—",
            company_name: r.company_name,
            company_document: r.company_document,
            gross: brlPretty(r.gross),
            tax: brlPretty(r.total_tax),
            net: brlPretty(r.net),
          }))
        : [],
    };
    const element = React.createElement(tpl.component as any, templateData);
    const html = await renderAsync(element);
    const subject = typeof tpl.subject === "function" ? tpl.subject(templateData) : tpl.subject;
    await audit(supabase, userId, "fiscal.preview",
      { year: data.year, month: data.month, email_mode: emailMode }, report.totals.count);
    return { html, subject, email_mode: emailMode, expires_at: fakeExpiry };
  });

// ───────────────────────── Regenerar link assinado ─────────────────────────

export const regenerateFiscalReportSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { csv_path: string; expiry_hours?: number }) => {
    if (!data.csv_path || typeof data.csv_path !== "string") throw new Error("invalid path");
    const h = data.expiry_hours ?? 168;
    if (!Number.isInteger(h) || h < 1 || h > 720) throw new Error("Expiração entre 1h e 720h.");
    return { csv_path: data.csv_path, expiry_hours: h };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sec = data.expiry_hours * 3600;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("fiscal-reports")
      .createSignedUrl(data.csv_path, sec);
    if (error || !signed?.signedUrl) throw error ?? new Error("sign failed");
    const expires_at = new Date(Date.now() + sec * 1000).toISOString();
    await audit(supabase, userId, "fiscal.link.regenerated",
      { path: data.csv_path, expiry_hours: data.expiry_hours, signed_url: signed.signedUrl, signed_url_expires_at: expires_at }, 1);
    return { url: signed.signedUrl, expires_at };
  });

// ───────────────────────── Envio de teste ─────────────────────────

export const sendTestFiscalEmail = createServerFn({ method: "POST" })
  .inputValidator((data: {
    year: number; month: number; recipient: string;
    email_mode?: "link" | "inline"; expiry_hours?: number;
  }) => {
    if (!Number.isInteger(data.year) || !Number.isInteger(data.month))
      throw new Error("invalid period");
    const email = String(data.recipient ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("destinatário de teste inválido");
    if (data.expiry_hours !== undefined &&
        (!Number.isInteger(data.expiry_hours) || data.expiry_hours < 1 || data.expiry_hours > 720))
      throw new Error("Expiração entre 1h e 720h.");
    return { ...data, recipient: email };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    return sendFiscalReportInternal({
      year: data.year, month: data.month, recipient: data.recipient,
      triggeredBy: "user", userId, emailMode: data.email_mode,
      expirySeconds: data.expiry_hours ? data.expiry_hours * 3600 : undefined,
      test: true,
    });
  });

// ───────────────────────── Auditoria de link assinado ─────────────────────────

export const logFiscalLinkAction = createServerFn({ method: "POST" })
  .inputValidator((data: {
    action: "copied" | "opened";
    csv_path?: string;
    signed_url?: string;
    signed_url_expires_at?: string;
    year?: number; month?: number;
    source?: string;
  }) => {
    if (data.action !== "copied" && data.action !== "opened")
      throw new Error("invalid action");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    await audit(
      supabase, userId,
      data.action === "copied" ? "fiscal.link.copied" : "fiscal.link.opened",
      {
        path: data.csv_path,
        signed_url: data.signed_url,
        signed_url_expires_at: data.signed_url_expires_at,
        year: data.year, month: data.month,
        source: data.source ?? null,
      },
      1,
    );
    return { ok: true };
  });



// ───────────────────────── Cron ─────────────────────────

/**
 * Acionada pelo cron (sem auth). Decide se é o momento configurado pelo admin
 * (dia/hora/fuso) e respeita limite de tentativas/backoff antes de reenviar
 * em períodos com falha.
 */
export async function runMonthlyFiscalEmailCron() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const schedule = await readSchedule(supabaseAdmin);

  // Hora atual no fuso configurado
  let parts: Record<string, string>;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: schedule.tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date()).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  } catch {
    return { ok: false, skipped: "invalid_timezone" as const, tz: schedule.tz };
  }
  const localYear = Number(parts.year);
  const localMonth = Number(parts.month);
  const localDay = Number(parts.day);
  const localHour = Number(parts.hour === "24" ? "0" : parts.hour);

  if (localDay !== schedule.day || localHour !== schedule.hour) {
    return { ok: true, skipped: "not_scheduled_hour" as const, schedule };
  }

  // Mês anterior em relação ao "hoje local"
  const refYear = localMonth === 1 ? localYear - 1 : localYear;
  const refMonth = localMonth === 1 ? 12 : localMonth - 1;

  // Idempotência: já existe um run com sucesso ou pendente nas últimas 24h?
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("fiscal_email_runs")
    .select("id, status")
    .eq("year", refYear)
    .eq("month", refMonth)
    .gte("created_at", since24h)
    .in("status", ["sent", "pending"])
    .limit(1);
  if (recent && recent.length > 0) {
    return { ok: true, skipped: "already_processed" as const, year: refYear, month: refMonth };
  }

  // Política de retry: olha o último run do período (sem janela)
  const { data: lastRuns } = await supabaseAdmin
    .from("fiscal_email_runs")
    .select("status, attempt, updated_at, created_at")
    .eq("year", refYear)
    .eq("month", refMonth)
    .order("created_at", { ascending: false })
    .limit(1);
  const last = (lastRuns ?? [])[0];
  if (last && last.status === "failed") {
    if ((last.attempt ?? 0) >= schedule.max_attempts) {
      await supabaseAdmin.from("core_export_logs").insert({
        user_id: null, kind: "fiscal.email.skipped", scope: "admin.fiscal",
        params: { year: refYear, month: refMonth, reason: "max_attempts_reached",
          attempt: last.attempt, max_attempts: schedule.max_attempts },
        row_count: 0, notes: "cron",
      });
      return { ok: true, skipped: "max_attempts_reached" as const, attempt: last.attempt };
    }
    const lastTs = new Date(last.updated_at ?? last.created_at).getTime();
    if (Date.now() - lastTs < schedule.backoff_minutes * 60_000) {
      return { ok: true, skipped: "backoff_window" as const, backoff_minutes: schedule.backoff_minutes };
    }
  }

  const { data: setting } = await supabaseAdmin
    .from("core_settings")
    .select("value").eq("key", "fiscal.accountant_email").maybeSingle();
  const raw = (setting?.value ?? null) as any;
  const recipient = typeof raw === "string" ? raw : raw?.email ?? null;
  if (!recipient) {
    return { ok: false, skipped: "accountant_email_not_configured" as const };
  }

  return sendFiscalReportInternal({
    year: refYear, month: refMonth, recipient,
    triggeredBy: "cron", userId: null, emailMode: schedule.email_mode,
  });
}
