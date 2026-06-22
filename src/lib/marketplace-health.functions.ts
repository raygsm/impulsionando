import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Marketplace & Afiliados — Fase 104.
 * Consolida aff_* (afiliados, vendas, comissões, payouts, links, produtos, ofertas)
 * + eco_marketplace_* (listings, requests, quotes, engagements, reviews, referrals)
 * + mp_orders / mp_subscriptions / mp_transactions_ledger.
 */
export const getMarketplaceHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [affRes, salRes, comRes, payRes, lnkRes, prdRes, ofrRes,
           lstRes, reqRes, qtRes, engRes, revRes, refRes,
           ordRes, subRes, ledRes] = await Promise.all([
      supabaseAdmin.from("aff_affiliates").select("id, status, wallet_balance, wallet_pending, is_lifetime, created_at").limit(100000),
      supabaseAdmin.from("aff_sales").select("id, status, payment_status, gross_amount, net_amount, payment_method, gateway_provider, sold_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("aff_commissions").select("id, recipient_kind, status, amount, paid_at, created_at").gte("created_at", sinceIso).limit(200000),
      supabaseAdmin.from("aff_payouts").select("id, recipient_kind, status, amount, paid_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("aff_links").select("id, kind, clicks, leads, sales, revenue, is_active, created_at").limit(100000),
      supabaseAdmin.from("aff_products").select("id, status, niche_slug, kind").limit(50000),
      supabaseAdmin.from("aff_offers").select("id, status, billing").limit(50000),
      supabaseAdmin.from("eco_marketplace_listings").select("id, status, niche, visibility, created_at").limit(50000),
      supabaseAdmin.from("eco_marketplace_requests").select("id, status, target_niche, budget_cents, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_quotes").select("id, status, amount_cents, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_engagements").select("id, status, gmv_cents, intermediation_fee_cents, intermediation_fee_bps, started_at, completed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_reviews").select("id, rating, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_referrals").select("id, status, reward_cents, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("mp_orders").select("id, status, total_cents, fee_cents, supplier_net_cents, placed_at, created_at").gte("created_at", sinceIso).limit(100000),
      supabaseAdmin.from("mp_subscriptions").select("id, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("mp_transactions_ledger").select("id, period_month, gmv_cents, fee_cents, supplier_net_cents, recorded_at").gte("recorded_at", sinceIso).limit(100000),
    ]);

    const err = affRes.error || salRes.error || comRes.error || payRes.error || lnkRes.error || prdRes.error || ofrRes.error
              || lstRes.error || reqRes.error || qtRes.error || engRes.error || revRes.error || refRes.error
              || ordRes.error || subRes.error || ledRes.error;
    if (err) throw new Error(err.message);

    const aff = affRes.data ?? []; const sal = salRes.data ?? []; const com = comRes.data ?? [];
    const pay = payRes.data ?? []; const lnk = lnkRes.data ?? []; const prd = prdRes.data ?? [];
    const ofr = ofrRes.data ?? []; const lst = lstRes.data ?? []; const req = reqRes.data ?? [];
    const qt = qtRes.data ?? []; const eng = engRes.data ?? []; const rev = revRes.data ?? [];
    const ref = refRes.data ?? []; const ord = ordRes.data ?? []; const sub = subRes.data ?? [];
    const led = ledRes.data ?? [];

    const sum = (rows: any[], key: string) => rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Afiliados
    const affActive = aff.filter((x: any) => String(x.status) === "active" || String(x.status) === "approved").length;
    const affPending = aff.filter((x: any) => String(x.status) === "pending").length;
    const affLifetime = aff.filter((x: any) => x.is_lifetime).length;
    const walletBalance = sum(aff, "wallet_balance");
    const walletPending = sum(aff, "wallet_pending");
    const affByStatus = countBy(aff, (x: any) => x.status);

    // Vendas
    const salApproved = sal.filter((x: any) => ["approved","paid","completed"].includes(String(x.status))).length;
    const salRefunded = sal.filter((x: any) => ["refunded","chargeback"].includes(String(x.status))).length;
    const salApprovalRate = sal.length ? (salApproved / sal.length) * 100 : 0;
    const salGross = sum(sal, "gross_amount");
    const salNet = sum(sal, "net_amount");
    const salByStatus = countBy(sal, (x: any) => x.status);
    const salByMethod = countBy(sal, (x: any) => x.payment_method);
    const salByProvider = countBy(sal, (x: any) => x.gateway_provider);

    // Comissões
    const comPaid = com.filter((x: any) => x.paid_at).length;
    const comPaidValue = sum(com.filter((x: any) => x.paid_at), "amount");
    const comPending = com.filter((x: any) => !x.paid_at).length;
    const comPendingValue = sum(com.filter((x: any) => !x.paid_at), "amount");
    const comByKind = countBy(com, (x: any) => x.recipient_kind);
    const comByStatus = countBy(com, (x: any) => x.status);

    // Payouts
    const payPaid = pay.filter((x: any) => x.paid_at).length;
    const payPaidValue = sum(pay.filter((x: any) => x.paid_at), "amount");
    const payPending = pay.filter((x: any) => !x.paid_at).length;
    const payByStatus = countBy(pay, (x: any) => x.status);

    // Links
    const lnkActive = lnk.filter((x: any) => x.is_active).length;
    const lnkClicks = sum(lnk, "clicks");
    const lnkLeads = sum(lnk, "leads");
    const lnkSales = sum(lnk, "sales");
    const lnkRevenue = sum(lnk, "revenue");
    const lnkConvRate = lnkClicks ? (lnkSales / lnkClicks) * 100 : 0;

    // Produtos / ofertas
    const prdActive = prd.filter((x: any) => String(x.status) === "active").length;
    const ofrActive = ofr.filter((x: any) => String(x.status) === "active").length;
    const prdByNiche = countBy(prd, (x: any) => x.niche_slug).slice(0, 15);

    // Marketplace ECO
    const lstActive = lst.filter((x: any) => String(x.status) === "active" || String(x.status) === "published").length;
    const reqOpen = req.filter((x: any) => ["open","published","invited","pending"].includes(String(x.status))).length;
    const qtAccepted = qt.filter((x: any) => String(x.status) === "accepted").length;
    const qtRate = qt.length ? (qtAccepted / qt.length) * 100 : 0;
    const engCompleted = eng.filter((x: any) => x.completed_at).length;
    const gmvCents = sum(eng, "gmv_cents");
    const feeCents = sum(eng, "intermediation_fee_cents");
    const avgFeeBps = eng.length ? eng.reduce((a: number, b: any) => a + Number(b.intermediation_fee_bps ?? 0), 0) / eng.length : 0;
    const ratings = rev.filter((x: any) => x.rating != null).map((x: any) => Number(x.rating));
    const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
    const refConverted = ref.filter((x: any) => String(x.status) === "converted").length;
    const lstByNiche = countBy(lst, (x: any) => x.niche).slice(0, 15);
    const reqByNiche = countBy(req, (x: any) => x.target_niche).slice(0, 15);
    const engByStatus = countBy(eng, (x: any) => x.status);

    // MP orders
    const ordCompleted = ord.filter((x: any) => ["completed","paid","approved"].includes(String(x.status))).length;
    const ordRate = ord.length ? (ordCompleted / ord.length) * 100 : 0;
    const ordTotalCents = sum(ord, "total_cents");
    const ordFeeCents = sum(ord, "fee_cents");
    const ordByStatus = countBy(ord, (x: any) => x.status);
    const subActive = sub.filter((x: any) => ["active","authorized"].includes(String(x.status))).length;
    const subByStatus = countBy(sub, (x: any) => x.status);
    const ledGmvCents = sum(led, "gmv_cents");
    const ledFeeCents = sum(led, "fee_cents");

    return {
      filters: { days: data.days, sinceIso },
      affiliates: { total: aff.length, active: affActive, pending: affPending, lifetime: affLifetime, walletBalance, walletPending, byStatus: affByStatus },
      sales: { total: sal.length, approved: salApproved, refunded: salRefunded, approvalRate: salApprovalRate, gross: salGross, net: salNet, byStatus: salByStatus, byMethod: salByMethod, byProvider: salByProvider },
      commissions: { total: com.length, paid: comPaid, paidValue: comPaidValue, pending: comPending, pendingValue: comPendingValue, byKind: comByKind, byStatus: comByStatus },
      payouts: { total: pay.length, paid: payPaid, paidValue: payPaidValue, pending: payPending, byStatus: payByStatus },
      links: { total: lnk.length, active: lnkActive, clicks: lnkClicks, leads: lnkLeads, sales: lnkSales, revenue: lnkRevenue, convRate: lnkConvRate },
      products: { total: prd.length, active: prdActive, offersActive: ofrActive, byNiche: prdByNiche },
      ecoListings: { total: lst.length, active: lstActive, byNiche: lstByNiche },
      ecoRequests: { total: req.length, open: reqOpen, byNiche: reqByNiche },
      ecoQuotes: { total: qt.length, accepted: qtAccepted, acceptRate: qtRate },
      ecoEngagements: { total: eng.length, completed: engCompleted, gmvCents, feeCents, avgFeeBps, byStatus: engByStatus },
      ecoReviews: { total: rev.length, avgRating },
      ecoReferrals: { total: ref.length, converted: refConverted },
      mpOrders: { total: ord.length, completed: ordCompleted, completionRate: ordRate, totalCents: ordTotalCents, feeCents: ordFeeCents, byStatus: ordByStatus },
      mpSubs: { total: sub.length, active: subActive, byStatus: subByStatus },
      mpLedger: { total: led.length, gmvCents: ledGmvCents, feeCents: ledFeeCents },
    };
  });
