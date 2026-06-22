import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Affiliates & Producers Cockpit — Fase 91.
 * Afiliados, produtos/ofertas, links, vendas, comissões, payouts, cupons,
 * fluxos de CRM e alertas de carteira.
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

    const [aRes, prRes, ofRes, lkRes, slRes, cmRes, pyRes, cpRes, cevRes, waRes] = await Promise.all([
      supabaseAdmin.from("aff_affiliates").select("id, company_id, status, main_channel, state, manager_id, is_lifetime, wallet_balance, wallet_pending, wallet_last_movement_at, approved_at, created_at").limit(50000),
      supabaseAdmin.from("aff_products").select("id, company_id, name, status, kind, allow_affiliate, default_commission_pct, base_price, niche_slug, created_at").limit(20000),
      supabaseAdmin.from("aff_offers").select("id, company_id, product_id, status, billing, price, commission_pct, allow_affiliate, created_at").limit(20000),
      supabaseAdmin.from("aff_links").select("id, company_id, affiliate_id, product_id, campaign, kind, clicks, leads, sales, revenue, commission_total, is_active, created_at").limit(50000),
      supabaseAdmin.from("aff_sales").select("id, company_id, product_id, affiliate_id, payment_method, gateway_provider, gross_amount, net_amount, gateway_fee, status, payment_status, recovery_status, kind, sold_at, approved_at, refunded_at, chargeback_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("aff_commissions").select("id, company_id, sale_id, recipient_kind, affiliate_id, pct, amount, status, release_at, released_at, paid_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("aff_payouts").select("id, company_id, recipient_kind, amount, status, requested_at, approved_at, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("aff_coupons").select("id, company_id, code, status, discount_type, discount_value, used_count, max_uses, valid_until, created_at").limit(20000),
      supabaseAdmin.from("aff_crm_events").select("id, company_id, flow_id, channel, status, scheduled_at, sent_at, converted_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("aff_wallet_alerts").select("id, company_id, affiliate_id, kind, severity, amount, is_read, created_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = aRes.error || prRes.error || ofRes.error || lkRes.error || slRes.error || cmRes.error || pyRes.error || cpRes.error || cevRes.error || waRes.error;
    if (err) throw new Error(err.message);

    const a = aRes.data ?? [];
    const pr = prRes.data ?? [];
    const of = ofRes.data ?? [];
    const lk = lkRes.data ?? [];
    const sl = slRes.data ?? [];
    const cm = cmRes.data ?? [];
    const py = pyRes.data ?? [];
    const cp = cpRes.data ?? [];
    const cev = cevRes.data ?? [];
    const wa = waRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const map = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; map.set(k, (map.get(k) ?? 0) + 1); }
      return Array.from(map.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Affiliates
    const aApproved = a.filter((r: any) => String(r.status).toLowerCase() === "approved" || String(r.status).toLowerCase() === "active").length;
    const aPending = a.filter((r: any) => String(r.status).toLowerCase() === "pending").length;
    const aLifetime = a.filter((r: any) => r.is_lifetime).length;
    const aWalletBal = a.reduce((acc: number, r: any) => acc + (Number(r.wallet_balance) || 0), 0);
    const aWalletPending = a.reduce((acc: number, r: any) => acc + (Number(r.wallet_pending) || 0), 0);
    const aByChannel = countBy(a, (r: any) => r.main_channel).slice(0, 10);
    const aByState = countBy(a, (r: any) => r.state).slice(0, 10);
    const aByStatus = countBy(a, (r: any) => r.status);

    // Products & offers
    const prActive = pr.filter((r: any) => String(r.status).toLowerCase() === "active").length;
    const prAffiliate = pr.filter((r: any) => r.allow_affiliate).length;
    const prByNiche = countBy(pr, (r: any) => r.niche_slug).slice(0, 10);
    const prByKind = countBy(pr, (r: any) => r.kind);
    const ofActive = of.filter((r: any) => String(r.status).toLowerCase() === "active").length;
    const ofByBilling = countBy(of, (r: any) => r.billing);

    // Links
    const lkActive = lk.filter((r: any) => r.is_active).length;
    const lkClicks = lk.reduce((s: number, r: any) => s + (Number(r.clicks) || 0), 0);
    const lkLeads = lk.reduce((s: number, r: any) => s + (Number(r.leads) || 0), 0);
    const lkSales = lk.reduce((s: number, r: any) => s + (Number(r.sales) || 0), 0);
    const lkRevenue = lk.reduce((s: number, r: any) => s + (Number(r.revenue) || 0), 0);
    const lkCommission = lk.reduce((s: number, r: any) => s + (Number(r.commission_total) || 0), 0);
    const clickToSale = lkClicks > 0 ? (lkSales / lkClicks) * 100 : 0;
    const leadToSale = lkLeads > 0 ? (lkSales / lkLeads) * 100 : 0;
    const lkByKind = countBy(lk, (r: any) => r.kind);

    // Sales (period)
    const slApproved = sl.filter((r: any) => r.approved_at).length;
    const slRefunded = sl.filter((r: any) => r.refunded_at).length;
    const slChargeback = sl.filter((r: any) => r.chargeback_at).length;
    const gmv = sl.reduce((s: number, r: any) => s + (Number(r.gross_amount) || 0), 0);
    const netRevenue = sl.reduce((s: number, r: any) => s + (Number(r.net_amount) || 0), 0);
    const gatewayFees = sl.reduce((s: number, r: any) => s + (Number(r.gateway_fee) || 0), 0);
    const refundRate = sl.length > 0 ? (slRefunded / sl.length) * 100 : 0;
    const cbRate = sl.length > 0 ? (slChargeback / sl.length) * 100 : 0;
    const slByMethod = countBy(sl, (r: any) => r.payment_method);
    const slByProvider = countBy(sl, (r: any) => r.gateway_provider);
    const slByStatus = countBy(sl, (r: any) => r.status);
    const slByRecovery = countBy(sl.filter((r: any) => r.recovery_status), (r: any) => r.recovery_status);

    // Top affiliates by gmv
    const aName = new Map<string, string>(a.map((r: any) => [r.id, r.id])); // names not selected; use id slice
    const slByAff = new Map<string, { gmv: number; count: number; commission: number }>();
    for (const r of sl as any[]) {
      if (!r.affiliate_id) continue;
      const cur = slByAff.get(r.affiliate_id) ?? { gmv: 0, count: 0, commission: 0 };
      cur.gmv += Number(r.gross_amount) || 0; cur.count += 1;
      slByAff.set(r.affiliate_id, cur);
    }
    for (const r of cm as any[]) {
      if (!r.affiliate_id) continue;
      const cur = slByAff.get(r.affiliate_id) ?? { gmv: 0, count: 0, commission: 0 };
      cur.commission += Number(r.amount) || 0;
      slByAff.set(r.affiliate_id, cur);
    }
    const topAffiliates = Array.from(slByAff.entries())
      .map(([id, v]) => ({ id: id.slice(0, 8), gmv: v.gmv, count: v.count, commission: v.commission }))
      .sort((a, b) => b.gmv - a.gmv).slice(0, 12);

    // Commissions
    const cmTotal = cm.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const cmReleased = cm.filter((r: any) => r.released_at).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const cmPaid = cm.filter((r: any) => r.paid_at).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const cmByStatus = countBy(cm, (r: any) => r.status);
    const cmByRecipient = countBy(cm, (r: any) => r.recipient_kind);

    // Payouts
    const pyTotal = py.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const pyPaid = py.filter((r: any) => r.paid_at).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const pyPending = py.filter((r: any) => !r.paid_at && !r.approved_at).length;
    const pyByStatus = countBy(py, (r: any) => r.status);
    const decided = py.filter((r: any) => r.paid_at && r.requested_at);
    const avgPayoutH = decided.length > 0
      ? decided.reduce((s: number, r: any) => s + (new Date(r.paid_at).getTime() - new Date(r.requested_at).getTime()), 0) / decided.length / 3600000
      : 0;

    // Coupons
    const cpActive = cp.filter((r: any) => String(r.status).toLowerCase() === "active").length;
    const cpUsed = cp.reduce((s: number, r: any) => s + (Number(r.used_count) || 0), 0);
    const cpExpired = cp.filter((r: any) => r.valid_until && r.valid_until < new Date().toISOString()).length;

    // CRM events
    const cevSent = cev.filter((r: any) => r.sent_at).length;
    const cevConverted = cev.filter((r: any) => r.converted_at).length;
    const cevConvRate = cevSent > 0 ? (cevConverted / cevSent) * 100 : 0;
    const cevByChannel = countBy(cev, (r: any) => r.channel);
    const cevByStatus = countBy(cev, (r: any) => r.status);

    // Wallet alerts
    const waUnread = wa.filter((r: any) => !r.is_read).length;
    const waBySeverity = countBy(wa, (r: any) => r.severity);
    const waByKind = countBy(wa, (r: any) => r.kind).slice(0, 10);

    return {
      days: data.days,
      affiliates: { total: a.length, approved: aApproved, pending: aPending, lifetime: aLifetime, walletBalance: aWalletBal, walletPending: aWalletPending, byChannel: aByChannel, byState: aByState, byStatus: aByStatus },
      products: { total: pr.length, active: prActive, allowAffiliate: prAffiliate, byNiche: prByNiche, byKind: prByKind },
      offers: { total: of.length, active: ofActive, byBilling: ofByBilling },
      links: { total: lk.length, active: lkActive, clicks: lkClicks, leads: lkLeads, sales: lkSales, revenue: lkRevenue, commission: lkCommission, clickToSale, leadToSale, byKind: lkByKind },
      sales: { total: sl.length, approved: slApproved, refunded: slRefunded, chargeback: slChargeback, gmv, netRevenue, gatewayFees, refundRate, cbRate, byMethod: slByMethod, byProvider: slByProvider, byStatus: slByStatus, byRecovery: slByRecovery, topAffiliates },
      commissions: { total: cm.length, amountTotal: cmTotal, released: cmReleased, paid: cmPaid, byStatus: cmByStatus, byRecipient: cmByRecipient },
      payouts: { total: py.length, amountTotal: pyTotal, paid: pyPaid, pending: pyPending, byStatus: pyByStatus, avgHours: avgPayoutH },
      coupons: { total: cp.length, active: cpActive, expired: cpExpired, used: cpUsed },
      crm: { total: cev.length, sent: cevSent, converted: cevConverted, convRate: cevConvRate, byChannel: cevByChannel, byStatus: cevByStatus },
      walletAlerts: { total: wa.length, unread: waUnread, bySeverity: waBySeverity, byKind: waByKind },
    };
  });
