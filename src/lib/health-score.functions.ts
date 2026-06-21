import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export const fetchHealthScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const limit = Math.min(data.limit ?? 200, 1000);

    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();

    const [compsRes, integRes, eventsRes, revRes, invoicesRes, contractsRes, customersRes, eventsPrevRes] =
      await Promise.all([
        context.supabase
          .from("companies" as any)
          .select("id,name,trade_name,is_active,is_demo,is_master")
          .eq("is_active", true)
          .eq("is_demo", false)
          .order("created_at", { ascending: false })
          .limit(limit),
        context.supabase.from("core_integrations" as any).select("company_id,status"),
        context.supabase
          .from("runtime_events" as any)
          .select("company_id,severity,created_at")
          .gte("created_at", since7),
        context.supabase
          .from("core_revenue_calculations" as any)
          .select("company_id,net_cents,captured_at")
          .gte("captured_at", since30),
        context.supabase
          .from("billing_invoices" as any)
          .select("company_id,status,due_date,amount")
          .gte("created_at", since30),
        context.supabase.from("billing_contracts" as any).select("company_id,status,recurring_amount"),
        context.supabase.from("customers" as any).select("company_id"),
        context.supabase
          .from("runtime_events" as any)
          .select("company_id,severity")
          .gte("created_at", new Date(Date.now() - 14 * 86400_000).toISOString())
          .lt("created_at", since7),
      ]);

    const companies = (compsRes.data ?? []) as any[];
    const ids = new Set(companies.map((c) => c.id));
    const integ = ((integRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const events = ((eventsRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const eventsPrev = ((eventsPrevRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const rev = ((revRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const invs = ((invoicesRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const contracts = ((contractsRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));
    const customers = ((customersRes.data ?? []) as any[]).filter((r) => ids.has(r.company_id));

    const today = new Date().toISOString().slice(0, 10);

    const tenants = companies.map((c) => {
      const cInteg = integ.filter((i) => i.company_id === c.id);
      const cIntegErrors = cInteg.filter((i) => i.status && i.status !== "connected" && i.status !== "healthy").length;
      const cEvents = events.filter((e) => e.company_id === c.id);
      const cErrors = cEvents.filter((e) => e.severity === "error" || e.severity === "critical").length;
      const cEventsPrev = eventsPrev.filter((e) => e.company_id === c.id);
      const cErrorsPrev = cEventsPrev.filter((e) => e.severity === "error" || e.severity === "critical").length;

      const cRev = rev.filter((r) => r.company_id === c.id);
      const revenue30 = cRev.reduce((s, r) => s + Number(r.net_cents ?? 0), 0);

      const cInvs = invs.filter((i) => i.company_id === c.id);
      const overdue = cInvs.filter((i) => i.status !== "paid" && i.due_date && i.due_date < today);
      const overdueCount = overdue.length;
      const overdueAmount = overdue.reduce((s, i) => s + Number(i.amount ?? 0), 0);

      const cContracts = contracts.filter((k) => k.company_id === c.id);
      const mrr = cContracts.filter((k) => k.status === "active").reduce((s, k) => s + Number(k.recurring_amount ?? 0), 0);
      const cCustomers = customers.filter((k) => k.company_id === c.id).length;

      // SUB-SCORES (0..100)
      // Integrations: 100 if all healthy, drops 25 per broken integration
      const integScore = cInteg.length === 0 ? 80 : clamp(100 - cIntegErrors * 25);
      // Stability: 100 - errors_7d * 2 (capped at 100)
      const stabilityScore = clamp(100 - cErrors * 2);
      // Engagement: based on revenue30 and customer count (logarithmic, capped)
      const engagementScore = clamp(Math.log10(Math.max(1, revenue30 / 100 + cCustomers * 10)) * 25);
      // Financial: -30 per overdue invoice, clamp
      const financialScore = clamp(100 - overdueCount * 30 - (overdueAmount > 1000 ? 20 : 0));
      // Adoption proxy: has MRR + customers
      const adoptionScore = clamp((mrr > 0 ? 50 : 0) + (cCustomers > 0 ? 30 : 0) + (cContracts.length > 0 ? 20 : 0));

      // Weighted overall
      const overall = Math.round(
        integScore * 0.2 +
        stabilityScore * 0.25 +
        financialScore * 0.2 +
        adoptionScore * 0.2 +
        engagementScore * 0.15,
      );

      // Trend: errors delta
      const trend: "up" | "down" | "flat" =
        cErrors < cErrorsPrev - 2 ? "up" : cErrors > cErrorsPrev + 2 ? "down" : "flat";

      // Tier
      const tier: "A" | "B" | "C" | "D" =
        overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 50 ? "C" : "D";

      // Alerts
      const alerts: string[] = [];
      if (cIntegErrors > 0) alerts.push(`${cIntegErrors} integração(ões) com erro`);
      if (cErrors > 20) alerts.push(`${cErrors} erros nos últimos 7 dias`);
      if (overdueCount > 0) alerts.push(`${overdueCount} fatura(s) vencida(s)`);
      if (mrr === 0 && cCustomers > 0) alerts.push("Tem clientes mas MRR zero");
      if (revenue30 === 0 && mrr > 0) alerts.push("MRR ativo mas sem receita capturada em 30d");

      return {
        id: c.id,
        name: c.trade_name || c.name,
        scores: {
          overall,
          integrations: Math.round(integScore),
          stability: Math.round(stabilityScore),
          financial: Math.round(financialScore),
          adoption: Math.round(adoptionScore),
          engagement: Math.round(engagementScore),
        },
        tier,
        trend,
        signals: {
          integrationsTotal: cInteg.length,
          integrationsErrors: cIntegErrors,
          errors7d: cErrors,
          errors7dPrev: cErrorsPrev,
          mrrBRL: mrr,
          revenue30BRL: Math.round(revenue30) / 100,
          customers: cCustomers,
          invoicesOverdue: overdueCount,
          invoicesOverdueBRL: overdueAmount,
        },
        alerts,
      };
    });

    tenants.sort((a, b) => b.scores.overall - a.scores.overall);

    const distribution = { A: 0, B: 0, C: 0, D: 0 };
    let total = 0;
    for (const t of tenants) {
      distribution[t.tier] += 1;
      total += t.scores.overall;
    }
    const avg = tenants.length > 0 ? Math.round(total / tenants.length) : 0;

    return {
      kpis: {
        count: tenants.length,
        average: avg,
        distribution,
        atRisk: tenants.filter((t) => t.tier === "D" || t.tier === "C").length,
        alerting: tenants.filter((t) => t.alerts.length > 0).length,
      },
      tenants,
    };
  });
