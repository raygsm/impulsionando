import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Revenue Forecast — projeta MRR nos próximos 30/60/90 dias combinando:
 *  - MRR atual (contratos ativos)
 *  - Churn esperado (score >= 70 = alto risco; 40-69 = médio)
 *  - Velocidade de novas contratações (média últimos 60d)
 *  - Suspensões abertas
 * Retorna cenários: pessimista / base / otimista.
 */
export const getRevenueForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const now = Date.now();
    const since30 = new Date(now - 30 * 86400000).toISOString();
    const since60 = new Date(now - 60 * 86400000).toISOString();

    const [contractsRes, suspRes, ticketsRes, runtimeRes, companiesRes] = await Promise.all([
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status, created_at, cancelled_at"),
      supabaseAdmin.from("billing_suspensions").select("company_id, created_at, resolved_at").is("resolved_at", null),
      supabaseAdmin.from("support_tickets").select("company_id, status, priority, created_at").gte("created_at", since30),
      supabaseAdmin.from("runtime_events").select("company_id, created_at").gte("created_at", since30).limit(5000),
      supabaseAdmin.from("companies").select("id, name, is_active").eq("is_active", true).limit(1000),
    ]);

    const activeCompanies = new Set((companiesRes.data ?? []).map((c: any) => c.id));
    const contracts = (contractsRes.data ?? []).filter((c: any) => c.status === "active" && activeCompanies.has(c.company_id));

    // MRR atual
    const mrrBy = new Map<string, number>();
    contracts.forEach((c: any) => {
      mrrBy.set(c.company_id, (mrrBy.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
    });
    const currentMRR = [...mrrBy.values()].reduce((a, b) => a + b, 0);

    // Velocidade de novas contratações (60d)
    const newContracts60 = (contractsRes.data ?? []).filter(
      (c: any) => c.created_at && c.created_at >= since60 && c.status === "active",
    );
    const newMRRPerDay = newContracts60.reduce((a, c: any) => a + Number(c.recurring_amount ?? 0), 0) / 60;

    // Churn histórico (cancelados últimos 60d)
    const churnedMRR60 = (contractsRes.data ?? [])
      .filter((c: any) => c.cancelled_at && c.cancelled_at >= since60)
      .reduce((a, c: any) => a + Number(c.recurring_amount ?? 0), 0);
    const baseChurnRate = churnedMRR60 / 60 / Math.max(currentMRR, 1); // diário

    // Score de risco por tenant (simplificado)
    const ticketsUrgentBy = new Map<string, number>();
    const ticketsOpenBy = new Map<string, number>();
    (ticketsRes.data ?? []).forEach((t: any) => {
      if (!["closed", "resolved", "cancelled"].includes(String(t.status))) {
        ticketsOpenBy.set(t.company_id, (ticketsOpenBy.get(t.company_id) ?? 0) + 1);
      }
      if (["urgent", "high"].includes(String(t.priority))) {
        ticketsUrgentBy.set(t.company_id, (ticketsUrgentBy.get(t.company_id) ?? 0) + 1);
      }
    });
    const runtimeBy = new Map<string, number>();
    (runtimeRes.data ?? []).forEach((r: any) => {
      runtimeBy.set(r.company_id, (runtimeBy.get(r.company_id) ?? 0) + 1);
    });
    const suspensionsBy = new Set((suspRes.data ?? []).map((s: any) => s.company_id));

    let mrrAtRiskHigh = 0;
    let mrrAtRiskMid = 0;
    const breakdown: { companyId: string; mrr: number; score: number }[] = [];

    mrrBy.forEach((mrr, companyId) => {
      let score = 0;
      const events = runtimeBy.get(companyId) ?? 0;
      if (events === 0) score += 35;
      else if (events < 5) score += 20;
      if (suspensionsBy.has(companyId)) score += 25;
      score += Math.min(20, (ticketsUrgentBy.get(companyId) ?? 0) * 7);
      if ((ticketsOpenBy.get(companyId) ?? 0) > 3) score += 10;
      score = Math.min(100, score);
      breakdown.push({ companyId, mrr, score });
      if (score >= 70) mrrAtRiskHigh += mrr;
      else if (score >= 40) mrrAtRiskMid += mrr;
    });

    // Projeção 30/60/90 (base): churn esperado = alto*0.45 + médio*0.18 distribuído proporcionalmente
    const expectedChurn30 = mrrAtRiskHigh * 0.45 * (30 / 30) + mrrAtRiskMid * 0.18 * (30 / 30);
    const expectedChurn60 = mrrAtRiskHigh * 0.55 + mrrAtRiskMid * 0.28;
    const expectedChurn90 = mrrAtRiskHigh * 0.65 + mrrAtRiskMid * 0.38;

    const newMRR30 = newMRRPerDay * 30;
    const newMRR60 = newMRRPerDay * 60;
    const newMRR90 = newMRRPerDay * 90;

    const project = (days: number, churnExpected: number, newExpected: number) => {
      const base = currentMRR - churnExpected + newExpected;
      const histChurn = currentMRR * baseChurnRate * days;
      return {
        days,
        base: Math.round(base),
        pessimista: Math.round(currentMRR - churnExpected * 1.4 - histChurn * 0.5 + newExpected * 0.6),
        otimista: Math.round(currentMRR - churnExpected * 0.5 + newExpected * 1.3),
        churnExpected: Math.round(churnExpected),
        newExpected: Math.round(newExpected),
      };
    };

    return {
      currentMRR: Math.round(currentMRR),
      activeContracts: contracts.length,
      newMRRPerDay: Math.round(newMRRPerDay),
      baseChurnRatePct: Number((baseChurnRate * 100).toFixed(2)),
      mrrAtRiskHigh: Math.round(mrrAtRiskHigh),
      mrrAtRiskMid: Math.round(mrrAtRiskMid),
      projections: [
        project(30, expectedChurn30, newMRR30),
        project(60, expectedChurn60, newMRR60),
        project(90, expectedChurn90, newMRR90),
      ],
      generatedAt: new Date().toISOString(),
    };
  });
