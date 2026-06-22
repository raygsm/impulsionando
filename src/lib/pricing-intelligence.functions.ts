import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Pricing & Discount Intelligence — Fase 33.
 * Visão executiva de saúde do pricing:
 *  - Performance por plano (contratos, MRR, ticket médio, desvio vs preço de tabela)
 *  - Cupons: uso, desconto concedido, ROI implícito (receita gerada / desconto)
 *  - Coproducers ativos (custo recorrente sobre vendas afiliadas)
 *  - Revenue leakage: faturas com amount < recurring_amount do contrato
 *  - Discount intensity: % médio de desconto por plano e por canal afiliado
 */
export const getPricingIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(30, Math.min(365, d?.days ?? 90)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [plansRes, contractsRes, invoicesRes, couponsRes, salesRes, coprodRes] = await Promise.all([
      supabaseAdmin
        .from("billing_plans")
        .select("id, code, name, recurring_amount, setup_fee, included_module_count, extra_module_price, is_active")
        .limit(500),
      supabaseAdmin
        .from("billing_contracts")
        .select("id, company_id, plan_id, status, recurring_amount, setup_amount, created_at")
        .limit(10000),
      supabaseAdmin
        .from("billing_invoices")
        .select("id, contract_id, company_id, amount, status, paid_at, created_at")
        .gte("created_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("aff_coupons")
        .select("id, code, discount_type, discount_value, used_count, max_uses, status, valid_until")
        .limit(2000),
      supabaseAdmin
        .from("aff_sales")
        .select("id, coupon_id, gross_amount, net_amount, status, sold_at")
        .gte("sold_at", sinceIso)
        .limit(20000),
      supabaseAdmin
        .from("aff_coproducers")
        .select("id, name, participation_pct, fixed_amount, status, scope")
        .eq("status", "active")
        .limit(500),
    ]);

    const plans = plansRes.data ?? [];
    const contracts = contractsRes.data ?? [];
    const invoices = invoicesRes.data ?? [];
    const coupons = couponsRes.data ?? [];
    const sales = salesRes.data ?? [];
    const coproducers = coprodRes.data ?? [];

    const planById = new Map(plans.map((p) => [p.id, p]));

    // ===== Performance por plano =====
    const planAgg = new Map<string, {
      planId: string; code: string; name: string; listPrice: number;
      activeContracts: number; mrr: number; avgTicket: number;
      discountPct: number; belowListCount: number;
    }>();

    for (const p of plans) {
      planAgg.set(p.id, {
        planId: p.id,
        code: p.code ?? "",
        name: p.name ?? "",
        listPrice: Number(p.recurring_amount ?? 0),
        activeContracts: 0, mrr: 0, avgTicket: 0, discountPct: 0, belowListCount: 0,
      });
    }

    for (const c of contracts) {
      if (c.status !== "active" || !c.plan_id) continue;
      const agg = planAgg.get(c.plan_id);
      if (!agg) continue;
      const recurring = Number(c.recurring_amount ?? 0);
      agg.activeContracts += 1;
      agg.mrr += recurring;
      if (agg.listPrice > 0 && recurring < agg.listPrice * 0.99) agg.belowListCount += 1;
    }

    for (const agg of planAgg.values()) {
      agg.avgTicket = agg.activeContracts > 0 ? agg.mrr / agg.activeContracts : 0;
      agg.discountPct = agg.listPrice > 0
        ? Math.max(0, Math.round((1 - agg.avgTicket / agg.listPrice) * 100))
        : 0;
    }

    const planPerformance = Array.from(planAgg.values())
      .filter((p) => p.activeContracts > 0 || plans.find((pl) => pl.id === p.planId)?.is_active)
      .sort((a, b) => b.mrr - a.mrr);

    // ===== Revenue leakage =====
    type Leak = {
      contractId: string; companyId: string; planName: string;
      listPrice: number; contractedPrice: number; latestInvoiceAmount: number;
      leakageMonthly: number;
    };
    const leaks: Leak[] = [];
    let totalLeakage = 0;

    // Última invoice por contrato
    const latestInvByContract = new Map<string, { amount: number; created_at: string }>();
    for (const i of invoices) {
      if (!i.contract_id) continue;
      const prev = latestInvByContract.get(i.contract_id);
      if (!prev || new Date(i.created_at) > new Date(prev.created_at)) {
        latestInvByContract.set(i.contract_id, { amount: Number(i.amount ?? 0), created_at: i.created_at });
      }
    }

    for (const c of contracts) {
      if (c.status !== "active" || !c.plan_id) continue;
      const plan = planById.get(c.plan_id);
      const list = Number(plan?.recurring_amount ?? 0);
      const contracted = Number(c.recurring_amount ?? 0);
      const latest = latestInvByContract.get(c.id)?.amount ?? contracted;
      // Leakage = quando invoice cobrada < contratado (não apenas desconto de tabela)
      if (list > 0 && latest < contracted * 0.95 && contracted - latest > 0) {
        const leakMonthly = contracted - latest;
        leaks.push({
          contractId: c.id, companyId: c.company_id,
          planName: plan?.name ?? "—",
          listPrice: list, contractedPrice: contracted, latestInvoiceAmount: latest,
          leakageMonthly: leakMonthly,
        });
        totalLeakage += leakMonthly;
      }
    }
    leaks.sort((a, b) => b.leakageMonthly - a.leakageMonthly);

    // ===== Cupons =====
    const salesByCoupon = new Map<string, { count: number; gross: number; net: number }>();
    for (const s of sales) {
      if (!s.coupon_id) continue;
      const cur = salesByCoupon.get(s.coupon_id) ?? { count: 0, gross: 0, net: 0 };
      cur.count += 1;
      cur.gross += Number(s.gross_amount ?? 0);
      cur.net += Number(s.net_amount ?? 0);
      salesByCoupon.set(s.coupon_id, cur);
    }

    const couponStats = coupons.map((c) => {
      const s = salesByCoupon.get(c.id) ?? { count: 0, gross: 0, net: 0 };
      const isPct = (c.discount_type ?? "").toLowerCase() === "percent" || (c.discount_type ?? "").toLowerCase() === "percentage";
      const dv = Number(c.discount_value ?? 0);
      const discountGranted = isPct ? (s.gross * dv) / 100 : dv * s.count;
      const roi = discountGranted > 0 ? s.gross / discountGranted : 0;
      return {
        id: c.id, code: c.code ?? "", status: c.status ?? "—",
        discountType: c.discount_type ?? "—", discountValue: dv,
        usedCount: c.used_count ?? s.count,
        maxUses: c.max_uses ?? 0,
        salesCount: s.count,
        grossRevenue: s.gross,
        discountGranted: Math.round(discountGranted),
        roi: Number(roi.toFixed(1)),
      };
    }).sort((a, b) => b.grossRevenue - a.grossRevenue);

    const activeCouponsCount = coupons.filter((c) => (c.status ?? "").toLowerCase() === "active").length;
    const totalDiscountGranted = couponStats.reduce((s, c) => s + c.discountGranted, 0);
    const totalCouponRevenue = couponStats.reduce((s, c) => s + c.grossRevenue, 0);

    // ===== Coproducers cost (estimativa sobre MRR ativo) =====
    const activeMrr = planPerformance.reduce((s, p) => s + p.mrr, 0);
    const coproducerPctTotal = coproducers.reduce((s, c) => s + Number(c.participation_pct ?? 0), 0);
    const coproducerCostMonthly =
      (activeMrr * coproducerPctTotal) / 100 +
      coproducers.reduce((s, c) => s + Number(c.fixed_amount ?? 0), 0);

    // ===== KPIs =====
    const kpis = {
      activePlans: plans.filter((p) => p.is_active).length,
      activeContracts: contracts.filter((c) => c.status === "active").length,
      activeMrr: Math.round(activeMrr),
      avgDiscountPct: planPerformance.length
        ? Math.round(planPerformance.reduce((s, p) => s + p.discountPct, 0) / planPerformance.length)
        : 0,
      belowListContracts: planPerformance.reduce((s, p) => s + p.belowListCount, 0),
      leakageMonthlyEstimate: Math.round(totalLeakage),
      activeCoupons: activeCouponsCount,
      totalDiscountGranted: Math.round(totalDiscountGranted),
      couponRevenue: Math.round(totalCouponRevenue),
      couponRoi: totalDiscountGranted > 0 ? Number((totalCouponRevenue / totalDiscountGranted).toFixed(1)) : 0,
      activeCoproducers: coproducers.length,
      coproducerCostMonthly: Math.round(coproducerCostMonthly),
      coproducerCostPctOfMrr: activeMrr > 0
        ? Number(((coproducerCostMonthly / activeMrr) * 100).toFixed(1))
        : 0,
    };

    return {
      generatedAt: new Date().toISOString(),
      windowDays: data.days,
      kpis,
      planPerformance,
      leaks: leaks.slice(0, 50),
      couponStats: couponStats.slice(0, 50),
      coproducers: coproducers.map((c) => ({
        id: c.id, name: c.name ?? "—", scope: c.scope ?? "—",
        participationPct: Number(c.participation_pct ?? 0),
        fixedAmount: Number(c.fixed_amount ?? 0),
      })),
    };
  });
