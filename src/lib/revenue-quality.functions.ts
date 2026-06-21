import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Revenue Quality — Fase 26.
 * Avalia a QUALIDADE da receita (não a previsão):
 *  - Mix recorrente vs avulso (contratos vs faturas spot)
 *  - Concentração: top-10 share, HHI (Herfindahl), % single-customer
 *  - Distribuição por nicho e por plano
 *  - Aging de contratos (idade média, % > 12 meses)
 *  - Alertas: concentração alta, dependência de poucos clientes, queda recorrência
 */
export const getRevenueQuality = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const d90 = new Date(now - 90 * 86400000).toISOString();

    const [contractsRes, invoicesRes, companiesRes, plansRes] = await Promise.all([
      supabaseAdmin
        .from("billing_contracts")
        .select("id, company_id, recurring_amount, status, created_at, plan_id"),
      supabaseAdmin
        .from("billing_invoices")
        .select("company_id, amount, status, paid_at, contract_id")
        .eq("status", "paid")
        .gte("paid_at", d90)
        .limit(20000),
      supabaseAdmin
        .from("companies")
        .select("id, name, is_active, is_demo, niche_code")
        .limit(5000),
      supabaseAdmin.from("billing_plans").select("id, name, tier").limit(500),
    ]);

    const companies = (companiesRes.data ?? []).filter((c: any) => c.is_demo !== true);
    const activeIds = new Set(companies.filter((c: any) => c.is_active === true).map((c: any) => c.id));
    const companyMap = new Map(companies.map((c: any) => [c.id, c]));
    const planMap = new Map((plansRes.data ?? []).map((p: any) => [p.id, p]));

    const activeContracts = (contractsRes.data ?? []).filter(
      (c: any) => c.status === "active" && activeIds.has(c.company_id),
    );

    // MRR recorrente (contratos ativos)
    const recurringByCo = new Map<string, number>();
    const contractAges: number[] = [];
    for (const c of activeContracts) {
      recurringByCo.set(c.company_id, (recurringByCo.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
      if (c.created_at) {
        const ageMonths = (now - new Date(c.created_at).getTime()) / (30 * 86400000);
        contractAges.push(ageMonths);
      }
    }
    const recurringMRR = [...recurringByCo.values()].reduce((a, b) => a + b, 0);

    // Receita 90d (paga)
    const paidByCo = new Map<string, number>();
    const paidContractIds = new Set<string>();
    let paid90Total = 0;
    let paidFromContracts = 0;
    for (const inv of invoicesRes.data ?? []) {
      const amt = Number(inv.amount ?? 0);
      paid90Total += amt;
      paidByCo.set(inv.company_id, (paidByCo.get(inv.company_id) ?? 0) + amt);
      if (inv.contract_id) {
        paidContractIds.add(inv.contract_id);
        paidFromContracts += amt;
      }
    }
    const oneOffShare = paid90Total > 0 ? (paid90Total - paidFromContracts) / paid90Total : 0;

    // Concentração (sobre MRR recorrente)
    const ranked = [...recurringByCo.entries()]
      .map(([id, mrr]) => ({
        company_id: id,
        company_name: (companyMap.get(id) as any)?.name ?? id,
        niche: (companyMap.get(id) as any)?.niche_code ?? "—",
        mrr,
      }))
      .sort((a, b) => b.mrr - a.mrr);
    const top10 = ranked.slice(0, 10);
    const top10Share = recurringMRR > 0 ? top10.reduce((s, r) => s + r.mrr, 0) / recurringMRR : 0;
    const top1Share = recurringMRR > 0 && ranked[0] ? ranked[0].mrr / recurringMRR : 0;
    const hhi = recurringMRR > 0
      ? ranked.reduce((s, r) => s + Math.pow((r.mrr / recurringMRR) * 100, 2), 0)
      : 0;

    // Por nicho
    const byNicheMap = new Map<string, { niche: string; mrr: number; tenants: number }>();
    for (const r of ranked) {
      const row = byNicheMap.get(r.niche) ?? { niche: r.niche, mrr: 0, tenants: 0 };
      row.mrr += r.mrr;
      row.tenants += 1;
      byNicheMap.set(r.niche, row);
    }
    const byNiche = [...byNicheMap.values()].sort((a, b) => b.mrr - a.mrr);

    // Por plano
    const byPlanMap = new Map<string, { plan: string; tier: string; mrr: number; contratos: number }>();
    for (const c of activeContracts) {
      const p = c.plan_id ? (planMap.get(c.plan_id) as any) : null;
      const key = p?.name ?? "Sem plano";
      const row = byPlanMap.get(key) ?? { plan: key, tier: p?.tier ?? "—", mrr: 0, contratos: 0 };
      row.mrr += Number(c.recurring_amount ?? 0);
      row.contratos += 1;
      byPlanMap.set(key, row);
    }
    const byPlan = [...byPlanMap.values()].sort((a, b) => b.mrr - a.mrr);

    // Aging
    const avgAge = contractAges.length > 0 ? contractAges.reduce((a, b) => a + b, 0) / contractAges.length : 0;
    const matureShare = contractAges.length > 0
      ? contractAges.filter((a) => a >= 12).length / contractAges.length
      : 0;

    // Alertas
    const alerts: Array<{ severity: "info" | "warn" | "danger"; message: string }> = [];
    if (top1Share >= 0.25) alerts.push({ severity: "danger", message: `Maior cliente representa ${(top1Share * 100).toFixed(1)}% do MRR — risco de concentração crítico.` });
    else if (top1Share >= 0.15) alerts.push({ severity: "warn", message: `Maior cliente representa ${(top1Share * 100).toFixed(1)}% do MRR.` });
    if (top10Share >= 0.7) alerts.push({ severity: "danger", message: `Top 10 clientes = ${(top10Share * 100).toFixed(0)}% do MRR.` });
    else if (top10Share >= 0.5) alerts.push({ severity: "warn", message: `Top 10 clientes = ${(top10Share * 100).toFixed(0)}% do MRR.` });
    if (hhi >= 2500) alerts.push({ severity: "danger", message: `HHI = ${hhi.toFixed(0)} (mercado altamente concentrado).` });
    else if (hhi >= 1500) alerts.push({ severity: "warn", message: `HHI = ${hhi.toFixed(0)} (concentração moderada).` });
    if (oneOffShare >= 0.4) alerts.push({ severity: "warn", message: `${(oneOffShare * 100).toFixed(0)}% da receita 90d é avulsa — recorrência baixa.` });
    if (matureShare < 0.3 && contractAges.length > 10) alerts.push({ severity: "info", message: `Apenas ${(matureShare * 100).toFixed(0)}% dos contratos têm 12m+ — base jovem, watch retention.` });

    return {
      kpis: {
        recurringMRR: Math.round(recurringMRR),
        activeContracts: activeContracts.length,
        paid90: Math.round(paid90Total),
        oneOffShare: Number((oneOffShare * 100).toFixed(1)),
        recurringShare: Number(((1 - oneOffShare) * 100).toFixed(1)),
        top1Share: Number((top1Share * 100).toFixed(1)),
        top10Share: Number((top10Share * 100).toFixed(1)),
        hhi: Math.round(hhi),
        avgContractAgeMonths: Number(avgAge.toFixed(1)),
        matureShare: Number((matureShare * 100).toFixed(1)),
        uniqueCustomers: recurringByCo.size,
      },
      top10,
      byNiche: byNiche.map((n) => ({ ...n, mrr: Math.round(n.mrr) })),
      byPlan: byPlan.map((p) => ({ ...p, mrr: Math.round(p.mrr) })),
      alerts,
      generatedAt: new Date().toISOString(),
    };
  });
