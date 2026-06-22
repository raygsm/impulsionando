import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Brewery & Clube Cockpit — Fase 51.
 * Sell-out de cervejarias, degustações, PDVs vinculados e engajamento do Clube
 * (visitas, consumo, rewards, indicações).
 */
export const getBreweryClubeHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const sinceDate = sinceIso.slice(0, 10);

    const [brandsRes, prodsRes, sellRes, tastRes, pdvsRes, leadsRes, visitsRes, consRes, rewRes, refRes] = await Promise.all([
      supabaseAdmin.from("brewery_brands").select("id, name, city, state, is_active, is_demo").limit(5000),
      supabaseAdmin.from("brewery_products").select("id, brand_id, name, style, is_active, is_seasonal").limit(20000),
      supabaseAdmin.from("brewery_sellouts").select("id, brand_id, product_id, pdv_link_id, period_start, units, gross_revenue_cents, coupon_redemptions").gte("period_start", sinceDate).limit(50000),
      supabaseAdmin.from("brewery_tastings").select("id, brand_id, pdv_link_id, event_at, participants, leads_captured, units_sold").gte("event_at", sinceIso).limit(20000),
      supabaseAdmin.from("brewery_pdv_links").select("id, brand_id, pdv_state, contract_status").limit(20000),
      supabaseAdmin.from("brewery_lead_preferences").select("id, brand_id, consent_marketing, frequency, source, created_at").limit(50000),
      supabaseAdmin.from("clube_visits").select("id, user_id, company_id, rating, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("clube_consumption").select("id, user_id, company_id, total_cents, consumed_at").gte("consumed_at", sinceIso).limit(50000),
      supabaseAdmin.from("clube_rewards_ledger").select("id, user_id, kind, delta, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("clube_referrals").select("id, status, reward_points, reward_cents, created_at, converted_at").gte("created_at", sinceIso).limit(50000),
    ]);

    const err = brandsRes.error || prodsRes.error || sellRes.error || tastRes.error || pdvsRes.error || leadsRes.error || visitsRes.error || consRes.error || rewRes.error || refRes.error;
    if (err) throw new Error(err.message);

    const brands = brandsRes.data ?? [];
    const products = prodsRes.data ?? [];
    const sellouts = sellRes.data ?? [];
    const tastings = tastRes.data ?? [];
    const pdvs = pdvsRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const visits = visitsRes.data ?? [];
    const consumption = consRes.data ?? [];
    const rewards = rewRes.data ?? [];
    const referrals = refRes.data ?? [];

    const brandMap = new Map(brands.map((b) => [b.id, b]));
    const prodMap = new Map(products.map((p) => [p.id, p]));

    // Brewery KPIs
    const activeBrands = brands.filter((b) => b.is_active && !b.is_demo).length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const seasonal = products.filter((p) => p.is_seasonal && p.is_active).length;
    const activePdvs = pdvs.filter((p) => p.contract_status === "active" || p.contract_status === "ativo").length;
    const totalUnits = sellouts.reduce((s, r) => s + Number(r.units || 0), 0);
    const totalRevenue = sellouts.reduce((s, r) => s + Number(r.gross_revenue_cents || 0), 0) / 100;
    const couponRedemptions = sellouts.reduce((s, r) => s + Number(r.coupon_redemptions || 0), 0);

    const tastingsCount = tastings.length;
    const tastingParticipants = tastings.reduce((s, t) => s + Number(t.participants || 0), 0);
    const tastingLeads = tastings.reduce((s, t) => s + Number(t.leads_captured || 0), 0);
    const tastingUnits = tastings.reduce((s, t) => s + Number(t.units_sold || 0), 0);
    const tastingConv = tastingParticipants ? (tastingLeads / tastingParticipants) * 100 : 0;

    const consentRate = leads.length ? (leads.filter((l) => l.consent_marketing).length / leads.length) * 100 : 0;

    // Ranking marcas por receita
    const brandAgg = new Map<string, { name: string; city: string; units: number; revenue: number; products: Set<string>; pdvs: Set<string> }>();
    for (const b of brands) {
      brandAgg.set(b.id, { name: b.name, city: [b.city, b.state].filter(Boolean).join("/") || "—", units: 0, revenue: 0, products: new Set(), pdvs: new Set() });
    }
    for (const s of sellouts) {
      const agg = brandAgg.get(s.brand_id);
      if (!agg) continue;
      agg.units += Number(s.units || 0);
      agg.revenue += Number(s.gross_revenue_cents || 0) / 100;
      if (s.product_id) agg.products.add(s.product_id);
      if (s.pdv_link_id) agg.pdvs.add(s.pdv_link_id);
    }
    const brandsRanking = Array.from(brandAgg, ([id, v]) => ({
      id, name: v.name, city: v.city, units: v.units, revenue: v.revenue,
      products: v.products.size, pdvs: v.pdvs.size,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    // Top produtos
    const prodAgg = new Map<string, { name: string; style: string; brand: string; units: number; revenue: number }>();
    for (const s of sellouts) {
      const p = prodMap.get(s.product_id);
      if (!p) continue;
      const b = brandMap.get(p.brand_id);
      const cur = prodAgg.get(s.product_id) ?? { name: p.name, style: p.style || "—", brand: b?.name || "—", units: 0, revenue: 0 };
      cur.units += Number(s.units || 0);
      cur.revenue += Number(s.gross_revenue_cents || 0) / 100;
      prodAgg.set(s.product_id, cur);
    }
    const topProducts = Array.from(prodAgg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    // Clube
    const visitsCount = visits.length;
    const uniqueVisitors = new Set(visits.map((v) => v.user_id)).size;
    const avgRating = visits.length ? visits.reduce((s, v) => s + Number(v.rating || 0), 0) / visits.filter((v) => v.rating).length || 0 : 0;
    const consumptionCount = consumption.length;
    const consumptionTotal = consumption.reduce((s, c) => s + Number(c.total_cents || 0), 0) / 100;
    const consumptionAvg = consumption.length ? consumptionTotal / consumption.length : 0;

    const rewardsEarned = rewards.filter((r) => Number(r.delta || 0) > 0).reduce((s, r) => s + Number(r.delta), 0);
    const rewardsRedeemed = rewards.filter((r) => Number(r.delta || 0) < 0).reduce((s, r) => s + Math.abs(Number(r.delta)), 0);
    const rewardsBalance = rewardsEarned - rewardsRedeemed;

    const refTotal = referrals.length;
    const refConverted = referrals.filter((r) => r.status === "converted" || !!r.converted_at).length;
    const refConvRate = refTotal ? (refConverted / refTotal) * 100 : 0;
    const refRewardCents = referrals.reduce((s, r) => s + Number(r.reward_cents || 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      window: { days: data.days },
      brewery: {
        brands: brands.length,
        activeBrands,
        products: products.length,
        activeProducts,
        seasonal,
        pdvs: pdvs.length,
        activePdvs,
        units: totalUnits,
        revenue: totalRevenue,
        couponRedemptions,
        leads: leads.length,
        consentRate,
        tastings: tastingsCount,
        tastingParticipants,
        tastingLeads,
        tastingUnits,
        tastingConv,
      },
      brandsRanking,
      topProducts,
      clube: {
        visits: visitsCount,
        uniqueVisitors,
        avgRating: isFinite(avgRating) ? avgRating : 0,
        consumptionCount,
        consumptionTotal,
        consumptionAvg,
        rewardsEarned,
        rewardsRedeemed,
        rewardsBalance,
        referrals: refTotal,
        referralsConverted: refConverted,
        referralsConvRate: refConvRate,
        referralsRewardBRL: refRewardCents / 100,
      },
    };
  });
