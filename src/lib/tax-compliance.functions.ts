import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tax & Compliance Cockpit — Fase 35.
 * Cockpit fiscal Impulsionando:
 *  - NF-e (core_fiscal_invoices): emitidas, pendentes, falhas, canceladas — 90d
 *  - Saúde do emissor (core_fiscal_issuer_config)
 *  - Obrigações fiscais (contab_obligations) vencendo/em atraso
 *  - Calendário fiscal recorrente (contab_fiscal_calendar) — próximas no mês
 *  - Eventos recentes com erro (core_fiscal_invoice_events)
 */
export const getTaxCompliance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const since90 = new Date(now.getTime() - 90 * 86400000).toISOString();
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    const [invRes, issuerRes, oblRes, calRes, evtRes] = await Promise.all([
      supabaseAdmin
        .from("core_fiscal_invoices")
        .select("id, status, service_amount, iss_amount, net_amount, issued_at, created_at, attempt_count, last_attempt_at, beneficiary_legal_name, nf_number, provider, environment, status_message")
        .gte("created_at", since90)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from("core_fiscal_issuer_config")
        .select("id, legal_name, cnpj, is_active, provider, environment, next_rps_number, tax_regime, iss_rate")
        .limit(50),
      supabaseAdmin
        .from("contab_obligations")
        .select("id, title, obligation_type, due_date, status, amount, competence")
        .lte("due_date", in30)
        .neq("status", "pago")
        .order("due_date", { ascending: true })
        .limit(500),
      supabaseAdmin
        .from("contab_fiscal_calendar")
        .select("id, title, obligation_type, recurrence, day_of_month, applies_to_regime, scope, is_active")
        .eq("is_active", true)
        .limit(500),
      supabaseAdmin
        .from("core_fiscal_invoice_events")
        .select("id, invoice_id, event_type, message, created_at")
        .gte("created_at", since90)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const invoices = invRes.data ?? [];
    const issuers = issuerRes.data ?? [];
    const obligations = oblRes.data ?? [];
    const calendar = calRes.data ?? [];
    const events = evtRes.data ?? [];

    // ===== NF-e KPIs =====
    const issued = invoices.filter((i) => i.issued_at);
    const pending = invoices.filter((i) => ["draft", "pending", "processing", "queued"].includes((i.status ?? "").toLowerCase()));
    const failed = invoices.filter((i) => ["failed", "rejected", "error"].includes((i.status ?? "").toLowerCase()));
    const cancelled = invoices.filter((i) => (i.status ?? "").toLowerCase() === "cancelled" || (i.status ?? "").toLowerCase() === "canceled");

    const totalServiceAmount = issued.reduce((s, i) => s + Number(i.service_amount ?? 0), 0);
    const totalNetAmount = issued.reduce((s, i) => s + Number(i.net_amount ?? 0), 0);
    const totalIss = issued.reduce((s, i) => s + Number(i.iss_amount ?? 0), 0);

    // ===== Stuck (>24h pendente com tentativas) =====
    const stuck = pending.filter((i) => {
      const ref = i.last_attempt_at ?? i.created_at;
      if (!ref) return false;
      return Date.now() - new Date(ref).getTime() > 24 * 3600 * 1000;
    });

    // ===== Emissor saúde =====
    const activeIssuers = issuers.filter((i) => i.is_active);
    const issuerHealth = issuers.map((i) => ({
      id: i.id,
      legalName: i.legal_name ?? "—",
      cnpj: i.cnpj ?? "—",
      isActive: !!i.is_active,
      provider: i.provider ?? "—",
      environment: i.environment ?? "—",
      taxRegime: i.tax_regime ?? "—",
      nextRpsNumber: i.next_rps_number ?? 0,
      issRate: Number(i.iss_rate ?? 0),
    }));

    // ===== Obrigações =====
    const obligationsOverdue = obligations.filter((o) => o.due_date && o.due_date < today);
    const obligationsDueSoon = obligations.filter((o) => o.due_date && o.due_date >= today && o.due_date <= in30);

    // ===== Eventos com erro =====
    const errorEvents = events.filter((e) => {
      const t = (e.event_type ?? "").toLowerCase();
      return t.includes("error") || t.includes("fail") || t.includes("reject");
    });

    // Top failure reasons
    const failureReasons = new Map<string, number>();
    for (const e of errorEvents) {
      const msg = (e.message ?? "sem mensagem").slice(0, 80);
      failureReasons.set(msg, (failureReasons.get(msg) ?? 0) + 1);
    }
    const topFailures = Array.from(failureReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Calendar próximos no mês (apenas recurrence monthly com day_of_month)
    const currentDay = now.getDate();
    const upcomingCalendar = calendar
      .filter((c) => (c.recurrence ?? "").toLowerCase() === "mensal" || (c.recurrence ?? "").toLowerCase() === "monthly")
      .map((c) => {
        const dom = c.day_of_month ?? 0;
        const daysAway = dom >= currentDay ? dom - currentDay : (30 - currentDay) + dom;
        return { ...c, daysAway };
      })
      .filter((c) => c.daysAway <= 30)
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 20);

    const kpis = {
      invoices90d: invoices.length,
      issued: issued.length,
      pending: pending.length,
      failed: failed.length,
      cancelled: cancelled.length,
      stuck: stuck.length,
      successRate: invoices.length > 0
        ? Math.round((issued.length / invoices.length) * 100)
        : 0,
      totalServiceAmount: Math.round(totalServiceAmount),
      totalNetAmount: Math.round(totalNetAmount),
      totalIss: Math.round(totalIss),
      activeIssuers: activeIssuers.length,
      totalIssuers: issuers.length,
      obligationsOverdue: obligationsOverdue.length,
      obligationsDueSoon: obligationsDueSoon.length,
      errorEvents90d: errorEvents.length,
    };

    return {
      generatedAt: now.toISOString(),
      kpis,
      issuerHealth,
      stuckInvoices: stuck.slice(0, 30).map((i) => ({
        id: i.id,
        beneficiary: i.beneficiary_legal_name ?? "—",
        status: i.status ?? "—",
        attempts: i.attempt_count ?? 0,
        amount: Number(i.service_amount ?? 0),
        lastAttempt: i.last_attempt_at,
        message: i.status_message ?? "—",
      })),
      obligationsOverdue: obligationsOverdue.slice(0, 30),
      obligationsDueSoon: obligationsDueSoon.slice(0, 30),
      upcomingCalendar,
      topFailures,
    };
  });
