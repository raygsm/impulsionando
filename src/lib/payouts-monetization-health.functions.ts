import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Payouts & Monetization Rules Cockpit — Fase 78.
 * Modelos de monetização, fee/revshare rules, payouts, ledger,
 * cálculos de receita e regras de refund/reschedule.
 */
export const getPayoutsMonetizationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [modelsRes, feeRes, rsRes, evtRes, ledgerRes, schedRes, refRes, reschRes, calcRes] = await Promise.all([
      supabaseAdmin.from("core_monetization_models").select("id, company_id, model, monthly_fee_cents, setup_fee_cents, min_payout_cents, payout_frequency, is_active").limit(20000),
      supabaseAdmin.from("core_fee_rules").select("id, scope, method, percent_bps, fixed_cents, priority, active").limit(20000),
      supabaseAdmin.from("core_revshare_rates").select("id, event_type, percent_bps, is_active").limit(20000),
      supabaseAdmin.from("core_payout_events").select("id, company_id, event_type, gross_cents, fee_cents, net_cents, status, provider, occurred_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("core_payout_ledger").select("id, company_id, gross_cents, fee_cents, net_cents, event_count, status, provider, paid_at, period_start, period_end, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("core_payout_schedule_rules").select("id, scope, method, delay_days, reserve_bps, active").limit(10000),
      supabaseAdmin.from("core_refund_rules").select("id, company_id, auto_refund, manual_refund, allow_partial, allow_full, request_deadline_days").limit(10000),
      supabaseAdmin.from("core_reschedule_rules").select("id, company_id, min_hours_before, max_reschedule_count, fee_enabled, auto_reschedule").limit(10000),
      supabaseAdmin.from("core_revenue_calculations").select("id, status, method, gross_cents, gateway_fee_cents, impulsionando_fee_cents, affiliate_commission_cents, coproducer_commission_cents, reserve_cents, net_cents, captured_at, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = modelsRes.error || feeRes.error || rsRes.error || evtRes.error || ledgerRes.error || schedRes.error || refRes.error || reschRes.error || calcRes.error;
    if (err) throw new Error(err.message);

    const models = modelsRes.data ?? [];
    const fees = feeRes.data ?? [];
    const rs = rsRes.data ?? [];
    const events = evtRes.data ?? [];
    const ledger = ledgerRes.data ?? [];
    const sched = schedRes.data ?? [];
    const refunds = refRes.data ?? [];
    const resch = reschRes.data ?? [];
    const calcs = calcRes.data ?? [];

    const cents = (n: number) => Number(n || 0) / 100;

    // Models
    const modelsActive = models.filter((m) => m.is_active).length;
    const modelMap = new Map<string, number>();
    for (const m of models) { const k = m.model || "—"; modelMap.set(k, (modelMap.get(k) ?? 0) + 1); }
    const modelTypes = Array.from(modelMap, ([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count);
    const freqMap = new Map<string, number>();
    for (const m of models) { const k = m.payout_frequency || "—"; freqMap.set(k, (freqMap.get(k) ?? 0) + 1); }
    const frequencies = Array.from(freqMap, ([frequency, count]) => ({ frequency, count })).sort((a, b) => b.count - a.count);

    // Fee rules
    const feesActive = fees.filter((f) => f.active).length;
    const feeScopeMap = new Map<string, number>();
    for (const f of fees) { const k = f.scope || "—"; feeScopeMap.set(k, (feeScopeMap.get(k) ?? 0) + 1); }
    const feeScopes = Array.from(feeScopeMap, ([scope, count]) => ({ scope, count })).sort((a, b) => b.count - a.count);
    const avgPercentBps = fees.length ? fees.reduce((s, f) => s + Number(f.percent_bps || 0), 0) / fees.length : 0;

    // Revshare
    const rsActive = rs.filter((r) => r.is_active).length;
    const rsEventMap = new Map<string, { count: number; sumBps: number }>();
    for (const r of rs) {
      const k = r.event_type || "—";
      const cur = rsEventMap.get(k) ?? { count: 0, sumBps: 0 };
      cur.count++;
      cur.sumBps += Number(r.percent_bps || 0);
      rsEventMap.set(k, cur);
    }
    const rsEvents = Array.from(rsEventMap, ([event, v]) => ({ event, count: v.count, avgBps: v.count ? v.sumBps / v.count : 0 })).sort((a, b) => b.count - a.count).slice(0, 12);

    // Payout events
    const evtGross = events.reduce((s, e) => s + Number(e.gross_cents || 0), 0);
    const evtFee = events.reduce((s, e) => s + Number(e.fee_cents || 0), 0);
    const evtNet = events.reduce((s, e) => s + Number(e.net_cents || 0), 0);
    const evtStatusMap = new Map<string, number>();
    for (const e of events) { const k = e.status || "—"; evtStatusMap.set(k, (evtStatusMap.get(k) ?? 0) + 1); }
    const evtStatuses = Array.from(evtStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const evtTypeMap = new Map<string, { count: number; gross: number; net: number }>();
    for (const e of events) {
      const k = e.event_type || "—";
      const cur = evtTypeMap.get(k) ?? { count: 0, gross: 0, net: 0 };
      cur.count++;
      cur.gross += Number(e.gross_cents || 0);
      cur.net += Number(e.net_cents || 0);
      evtTypeMap.set(k, cur);
    }
    const evtTypes = Array.from(evtTypeMap, ([event, v]) => ({ event, count: v.count, gross: cents(v.gross), net: cents(v.net) })).sort((a, b) => b.gross - a.gross).slice(0, 12);

    // Ledger
    const ledgerPaid = ledger.filter((l) => l.status === "paid" || l.paid_at).length;
    const ledgerPending = ledger.filter((l) => l.status === "pending" || (!l.paid_at && l.status !== "failed")).length;
    const ledgerFailed = ledger.filter((l) => l.status === "failed" || l.status === "error").length;
    const ledgerGross = ledger.reduce((s, l) => s + Number(l.gross_cents || 0), 0);
    const ledgerNet = ledger.reduce((s, l) => s + Number(l.net_cents || 0), 0);
    const ledgerPaidAmount = ledger.filter((l) => l.paid_at).reduce((s, l) => s + Number(l.net_cents || 0), 0);

    // Schedule rules
    const schedActive = sched.filter((s) => s.active).length;
    const avgDelayDays = sched.length ? sched.reduce((s, x) => s + Number(x.delay_days || 0), 0) / sched.length : 0;
    const avgReserveBps = sched.length ? sched.reduce((s, x) => s + Number(x.reserve_bps || 0), 0) / sched.length : 0;

    // Refund rules
    const refundAuto = refunds.filter((r) => r.auto_refund).length;
    const refundFull = refunds.filter((r) => r.allow_full).length;
    const avgRefundDeadline = refunds.length ? refunds.reduce((s, r) => s + Number(r.request_deadline_days || 0), 0) / refunds.length : 0;

    // Reschedule rules
    const reschAuto = resch.filter((r) => r.auto_reschedule).length;
    const reschFee = resch.filter((r) => r.fee_enabled).length;
    const avgMinHours = resch.length ? resch.reduce((s, r) => s + Number(r.min_hours_before || 0), 0) / resch.length : 0;

    // Revenue calculations
    const calcCount = calcs.length;
    const calcGross = calcs.reduce((s, c) => s + Number(c.gross_cents || 0), 0);
    const calcGw = calcs.reduce((s, c) => s + Number(c.gateway_fee_cents || 0), 0);
    const calcImp = calcs.reduce((s, c) => s + Number(c.impulsionando_fee_cents || 0), 0);
    const calcAff = calcs.reduce((s, c) => s + Number(c.affiliate_commission_cents || 0), 0);
    const calcCo = calcs.reduce((s, c) => s + Number(c.coproducer_commission_cents || 0), 0);
    const calcReserve = calcs.reduce((s, c) => s + Number(c.reserve_cents || 0), 0);
    const calcNet = calcs.reduce((s, c) => s + Number(c.net_cents || 0), 0);
    const calcStatusMap = new Map<string, number>();
    for (const c of calcs) { const k = c.status || "—"; calcStatusMap.set(k, (calcStatusMap.get(k) ?? 0) + 1); }
    const calcStatuses = Array.from(calcStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    return {
      window: { days: data.days },
      models: { total: models.length, active: modelsActive, types: modelTypes, frequencies },
      fees: { total: fees.length, active: feesActive, scopes: feeScopes, avgPercentBps },
      revshare: { total: rs.length, active: rsActive, byEvent: rsEvents },
      payoutEvents: {
        total: events.length,
        gross: cents(evtGross),
        fee: cents(evtFee),
        net: cents(evtNet),
        statuses: evtStatuses,
        byEventType: evtTypes,
      },
      ledger: {
        total: ledger.length,
        paid: ledgerPaid,
        pending: ledgerPending,
        failed: ledgerFailed,
        gross: cents(ledgerGross),
        net: cents(ledgerNet),
        paidAmount: cents(ledgerPaidAmount),
      },
      schedule: { total: sched.length, active: schedActive, avgDelayDays, avgReserveBps },
      refunds: { total: refunds.length, auto: refundAuto, allowFull: refundFull, avgDeadlineDays: avgRefundDeadline },
      reschedule: { total: resch.length, auto: reschAuto, feeEnabled: reschFee, avgMinHours },
      calcs: {
        total: calcCount,
        gross: cents(calcGross),
        gatewayFee: cents(calcGw),
        impulsionandoFee: cents(calcImp),
        affiliate: cents(calcAff),
        coproducer: cents(calcCo),
        reserve: cents(calcReserve),
        net: cents(calcNet),
        statuses: calcStatuses,
      },
      generatedAt: new Date().toISOString(),
    };
  });
