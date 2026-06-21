import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Unit Economics — Fase 25.
 * Calcula ARPU, churn mensal, LTV, CAC (assumido), payback e LTV:CAC,
 * com breakdown por niche_code e série mensal dos últimos 12 meses.
 *
 * Premissas:
 *  - MRR ≈ soma de billing_invoices "paid" nos últimos 30 dias
 *  - Active tenants = companies.is_active=true AND is_demo!=true
 *  - Churn mensal = tenants deactivated nos últimos 30d / active no início do período
 *  - LTV = ARPU / churn (cap 60 meses se churn<0,5%)
 *  - CAC = parâmetro do cliente (default R$ 300)
 */
export const getUnitEconomics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { cacAssumption?: number }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const cac = Math.max(0, Number(data?.cacAssumption ?? 300));
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d60 = new Date(now.getTime() - 60 * 86400000);
    const d365 = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const [{ data: companies }, { data: invoices }] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, created_at, is_active, is_demo, updated_at, niche_code")
        .limit(5000),
      supabaseAdmin
        .from("billing_invoices")
        .select("company_id, amount, status, paid_at")
        .eq("status", "paid")
        .gte("paid_at", d365.toISOString())
        .limit(20000),
    ]);

    const tenants = (companies ?? []).filter((c: any) => c.is_demo !== true);
    const active = tenants.filter((c: any) => c.is_active === true);
    const activeIds = new Set(active.map((c: any) => c.id));

    // MRR (últimos 30d)
    const mrr = (invoices ?? [])
      .filter((i: any) => i.paid_at && new Date(i.paid_at) >= d30)
      .reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0);
    const arpu = active.length > 0 ? mrr / active.length : 0;

    // Churn mensal: deactivated nos últimos 30d / (active + churned)
    const churned30 = tenants.filter(
      (c: any) => c.is_active === false && c.updated_at && new Date(c.updated_at) >= d30,
    ).length;
    const baseStart = active.length + churned30;
    const churnRate = baseStart > 0 ? churned30 / baseStart : 0;
    const ltv = churnRate > 0.005 ? arpu / churnRate : arpu * 60;
    const ratio = cac > 0 ? ltv / cac : 0;
    const paybackMonths = arpu > 0 ? cac / arpu : null;

    // Série mensal (12m): novos, churned, ativos (snapshot fim do mês)
    const monthly: Array<{ month: string; novos: number; churn: number; ativos: number; mrr: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const novos = tenants.filter((c: any) => {
        const cd = new Date(c.created_at);
        return cd >= start && cd < end;
      }).length;
      const churn = tenants.filter((c: any) => {
        if (c.is_active !== false || !c.updated_at) return false;
        const ud = new Date(c.updated_at);
        return ud >= start && ud < end;
      }).length;
      const ativos = tenants.filter((c: any) => {
        const cd = new Date(c.created_at);
        if (cd >= end) return false;
        if (c.is_active === false && c.updated_at && new Date(c.updated_at) < end) return false;
        return true;
      }).length;
      const mrrM = (invoices ?? [])
        .filter((inv: any) => inv.paid_at && new Date(inv.paid_at) >= start && new Date(inv.paid_at) < end)
        .reduce((s: number, inv: any) => s + Number(inv.amount ?? 0), 0);
      monthly.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
        novos,
        churn,
        ativos,
        mrr: Math.round(mrrM),
      });
    }

    // Breakdown por nicho
    const byNiche = new Map<string, { niche: string; active: number; mrr: number; arpu: number }>();
    for (const c of active) {
      const k = (c as any).niche_code || "—";
      const row = byNiche.get(k) ?? { niche: k, active: 0, mrr: 0, arpu: 0 };
      row.active += 1;
      byNiche.set(k, row);
    }
    for (const inv of invoices ?? []) {
      if (!inv.paid_at || new Date(inv.paid_at) < d30) continue;
      if (!activeIds.has(inv.company_id)) continue;
      const c = active.find((x: any) => x.id === inv.company_id) as any;
      const k = c?.niche_code || "—";
      const row = byNiche.get(k);
      if (row) row.mrr += Number(inv.amount ?? 0);
    }
    const niches = [...byNiche.values()]
      .map((r) => ({ ...r, mrr: Math.round(r.mrr), arpu: r.active > 0 ? Math.round(r.mrr / r.active) : 0 }))
      .sort((a, b) => b.mrr - a.mrr);

    return {
      kpis: {
        activeTenants: active.length,
        mrr: Math.round(mrr),
        arpu: Math.round(arpu),
        churnRate: Number((churnRate * 100).toFixed(2)),
        ltv: Math.round(ltv),
        cac,
        ratio: Number(ratio.toFixed(2)),
        paybackMonths: paybackMonths ? Number(paybackMonths.toFixed(1)) : null,
        churned30,
      },
      monthly,
      niches,
      generatedAt: new Date().toISOString(),
    };
  });
