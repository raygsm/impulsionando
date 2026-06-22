import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Affiliates & Co-producer Health — Fase 46.
 * Saúde do programa de afiliados/co-produção: vendas, comissões, payouts,
 * alertas de carteira, conversão por link, top performers.
 */
export const getAffiliatesHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const staleIso = new Date(Date.now() - 7 * 86400000).toISOString();

    const [affRes, salesRes, comRes, payRes, alertsRes, linksRes, copRes] = await Promise.all([
      supabaseAdmin
        .from("aff_affiliates")
        .select("id, company_id, name, status, wallet_balance, wallet_pending, wallet_last_movement_at, approved_at, created_at, is_lifetime")
        .limit(20000),
      supabaseAdmin
        .from("aff_sales")
        .select("id, company_id, affiliate_id, gross_amount, net_amount, status, payment_status, approved_at, refunded_at, chargeback_at, sold_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("aff_commissions")
        .select("id, company_id, affiliate_id, coproducer_id, recipient_kind, amount, status, release_at, released_at, paid_at, created_at")
        .gte("created_at", sinceIso)
        .limit(50000),
      supabaseAdmin
        .from("aff_payouts")
        .select("id, company_id, recipient_kind, affiliate_id, amount, status, requested_at, approved_at, paid_at, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("aff_wallet_alerts")
        .select("id, company_id, affiliate_id, kind, severity, title, amount, is_read, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("aff_links")
        .select("id, company_id, affiliate_id, slug, campaign, clicks, leads, sales, revenue, commission_total, is_active, created_at")
        .limit(20000),
      supabaseAdmin
        .from("aff_coproducers")
        .select("id, company_id, name, status, participation_pct, scope")
        .limit(5000),
    ]);

    const err = affRes.error || salesRes.error || comRes.error || payRes.error || alertsRes.error || linksRes.error || copRes.error;
    if (err) throw new Error(err.message);

    const affiliates = affRes.data ?? [];
    const sales = salesRes.data ?? [];
    const commissions = comRes.data ?? [];
    const payouts = payRes.data ?? [];
    const alerts = alertsRes.data ?? [];
    const links = linksRes.data ?? [];
    const coproducers = copRes.data ?? [];

    const num = (v: unknown) => Number(v ?? 0);
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();

    // ===== Afiliados =====
    const APPROVED = new Set(["approved", "aprovado", "ativo", "active"]);
    const PENDING = new Set(["pending", "pendente", "em_analise", "em-analise"]);
    const activeAffiliates = affiliates.filter((a) => APPROVED.has(lower(a.status))).length;
    const pendingAffiliates = affiliates.filter((a) => PENDING.has(lower(a.status))).length;
    const lifetimeAffiliates = affiliates.filter((a) => a.is_lifetime).length;
    const newAffiliates = affiliates.filter((a) => (a.created_at ?? "") >= sinceIso).length;
    const walletBalanceTotal = sum(affiliates.map((a) => num(a.wallet_balance)));
    const walletPendingTotal = sum(affiliates.map((a) => num(a.wallet_pending)));
    const inactiveAffiliates = affiliates.filter((a) => APPROVED.has(lower(a.status)) && (!a.wallet_last_movement_at || a.wallet_last_movement_at < staleIso)).length;

    // ===== Vendas =====
    const APPROVED_SALE = new Set(["approved", "aprovada", "paid", "pago", "available", "disponivel"]);
    const totalSales = sales.length;
    const approvedSales = sales.filter((s) => APPROVED_SALE.has(lower(s.status)) || s.approved_at).length;
    const refundedSales = sales.filter((s) => s.refunded_at).length;
    const chargebackSales = sales.filter((s) => s.chargeback_at).length;
    const gmv = sum(sales.filter((s) => APPROVED_SALE.has(lower(s.status)) || s.approved_at).map((s) => num(s.gross_amount)));
    const netRevenue = sum(sales.filter((s) => APPROVED_SALE.has(lower(s.status)) || s.approved_at).map((s) => num(s.net_amount)));
    const refundedAmount = sum(sales.filter((s) => s.refunded_at).map((s) => num(s.gross_amount)));
    const chargebackAmount = sum(sales.filter((s) => s.chargeback_at).map((s) => num(s.gross_amount)));
    const approvalRate = totalSales ? (approvedSales / totalSales) * 100 : 0;
    const chargebackRate = approvedSales ? (chargebackSales / approvedSales) * 100 : 0;

    // ===== Comissões =====
    const COM_PENDING = new Set(["pending", "pendente"]);
    const COM_RELEASED = new Set(["released", "liberada", "available", "disponivel"]);
    const COM_PAID = new Set(["paid", "pago"]);
    const COM_CANCELLED = new Set(["cancelled", "cancelada", "refunded"]);
    const comPending = commissions.filter((c) => COM_PENDING.has(lower(c.status))).length;
    const comReleased = commissions.filter((c) => COM_RELEASED.has(lower(c.status)) || c.released_at).length;
    const comPaid = commissions.filter((c) => COM_PAID.has(lower(c.status)) || c.paid_at).length;
    const comCancelled = commissions.filter((c) => COM_CANCELLED.has(lower(c.status))).length;
    const comPendingAmount = sum(commissions.filter((c) => COM_PENDING.has(lower(c.status))).map((c) => num(c.amount)));
    const comReleasedAmount = sum(commissions.filter((c) => COM_RELEASED.has(lower(c.status)) || c.released_at).map((c) => num(c.amount)));
    const comPaidAmount = sum(commissions.filter((c) => COM_PAID.has(lower(c.status)) || c.paid_at).map((c) => num(c.amount)));

    // ===== Payouts =====
    const PAY_REQ = new Set(["requested", "solicitado", "pending"]);
    const PAY_APP = new Set(["approved", "aprovado"]);
    const PAY_PAID = new Set(["paid", "pago", "completed"]);
    const PAY_FAIL = new Set(["failed", "erro", "rejected", "rejeitado"]);
    const payReq = payouts.filter((p) => PAY_REQ.has(lower(p.status))).length;
    const payApp = payouts.filter((p) => PAY_APP.has(lower(p.status)) && !p.paid_at).length;
    const payPaid = payouts.filter((p) => PAY_PAID.has(lower(p.status)) || p.paid_at).length;
    const payFail = payouts.filter((p) => PAY_FAIL.has(lower(p.status))).length;
    const payReqAmount = sum(payouts.filter((p) => PAY_REQ.has(lower(p.status))).map((p) => num(p.amount)));
    const payPaidAmount = sum(payouts.filter((p) => PAY_PAID.has(lower(p.status)) || p.paid_at).map((p) => num(p.amount)));

    // SLA approval (requested → approved/paid)
    const payDurations = payouts
      .filter((p) => p.paid_at && p.requested_at)
      .map((p) => (new Date(p.paid_at!).getTime() - new Date(p.requested_at!).getTime()) / 3600000)
      .filter((h) => h >= 0 && h < 24 * 30);
    const avgPayoutHours = payDurations.length ? payDurations.reduce((a, b) => a + b, 0) / payDurations.length : 0;

    // ===== Alertas =====
    const alertsUnread = alerts.filter((a) => !a.is_read).length;
    const alertsHigh = alerts.filter((a) => ["high", "critical", "alta", "critica"].includes(lower(a.severity))).length;
    const alertsByKind = new Map<string, number>();
    for (const a of alerts) {
      const k = a.kind ?? "outros";
      alertsByKind.set(k, (alertsByKind.get(k) ?? 0) + 1);
    }
    const alertsBreakdown = Array.from(alertsByKind.entries()).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    // ===== Top afiliados =====
    type AffRow = { id: string; name: string; sales: number; approved: number; gmv: number; commissions: number; conversionRate: number };
    const affMap = new Map(affiliates.map((a) => [a.id, a.name ?? a.id.slice(0, 8)]));
    const arMap = new Map<string, AffRow>();
    for (const s of sales) {
      if (!s.affiliate_id) continue;
      let r = arMap.get(s.affiliate_id);
      if (!r) { r = { id: s.affiliate_id, name: affMap.get(s.affiliate_id) ?? s.affiliate_id.slice(0, 8), sales: 0, approved: 0, gmv: 0, commissions: 0, conversionRate: 0 }; arMap.set(s.affiliate_id, r); }
      r.sales++;
      if (APPROVED_SALE.has(lower(s.status)) || s.approved_at) { r.approved++; r.gmv += num(s.gross_amount); }
    }
    for (const c of commissions) {
      if (!c.affiliate_id) continue;
      const r = arMap.get(c.affiliate_id);
      if (r) r.commissions += num(c.amount);
    }
    const topAffiliates = Array.from(arMap.values()).map((r) => ({ ...r, conversionRate: r.sales ? (r.approved / r.sales) * 100 : 0 })).sort((a, b) => b.gmv - a.gmv).slice(0, 20);

    // ===== Top links (conversão) =====
    const topLinks = links
      .filter((l) => (l.clicks ?? 0) > 0)
      .map((l) => ({
        id: l.id,
        slug: l.slug ?? "",
        campaign: l.campaign,
        affiliate: affMap.get(l.affiliate_id ?? "") ?? "—",
        clicks: l.clicks ?? 0,
        leads: l.leads ?? 0,
        sales: l.sales ?? 0,
        revenue: num(l.revenue),
        commission: num(l.commission_total),
        convRate: (l.clicks ?? 0) > 0 ? ((l.sales ?? 0) / (l.clicks ?? 1)) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // ===== Co-producers =====
    const activeCoproducers = coproducers.filter((c) => APPROVED.has(lower(c.status))).length;

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days, since: sinceIso },
      kpis: {
        totalAffiliates: affiliates.length,
        activeAffiliates,
        pendingAffiliates,
        lifetimeAffiliates,
        newAffiliates,
        inactiveAffiliates,
        walletBalanceTotal,
        walletPendingTotal,
        totalSales,
        approvedSales,
        refundedSales,
        chargebackSales,
        gmv,
        netRevenue,
        refundedAmount,
        chargebackAmount,
        approvalRate,
        chargebackRate,
        comPending,
        comReleased,
        comPaid,
        comCancelled,
        comPendingAmount,
        comReleasedAmount,
        comPaidAmount,
        payReq,
        payApp,
        payPaid,
        payFail,
        payReqAmount,
        payPaidAmount,
        avgPayoutHours,
        alertsTotal: alerts.length,
        alertsUnread,
        alertsHigh,
        activeCoproducers,
        totalCoproducers: coproducers.length,
      },
      alertsBreakdown,
      topAffiliates,
      topLinks,
    };
  });
