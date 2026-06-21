import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const fetchTenantCockpit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string; limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const limit = Math.min(data.limit ?? 200, 1000);

    let q = context.supabase
      .from("companies" as any)
      .select(
        "id,name,trade_name,company_type,segment,niche_id,is_active,is_demo,is_master,status,status_commercial,status_financial,status_technical,environment,created_at,subdomain,public_slug",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.search) q = q.or(`name.ilike.%${data.search}%,trade_name.ilike.%${data.search}%,subdomain.ilike.%${data.search}%`);
    if (data.status) q = q.eq("status", data.status);

    const { data: companies, error } = await q;
    if (error) throw new Error(error.message);
    const list = (companies ?? []) as any[];
    const ids = list.map((c) => c.id);

    if (ids.length === 0) {
      return { kpis: zeros(), tenants: [] };
    }

    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [contractsRes, modulesRes, revRes, integRes, eventsRes, nichesRes] = await Promise.all([
      context.supabase
        .from("billing_contracts" as any)
        .select("company_id,plan_id,recurring_amount,status,next_due_date,last_paid_at")
        .in("company_id", ids),
      context.supabase
        .from("company_modules" as any)
        .select("company_id,module_id,is_enabled")
        .in("company_id", ids),
      context.supabase
        .from("core_revenue_calculations" as any)
        .select("company_id,net_cents")
        .in("company_id", ids)
        .gte("captured_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
      context.supabase
        .from("core_integrations" as any)
        .select("company_id,provider,status,last_check_at")
        .in("company_id", ids),
      context.supabase
        .from("runtime_events" as any)
        .select("company_id,event_type,severity,created_at")
        .in("company_id", ids)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
      context.supabase.from("niches" as any).select("id,name,slug"),
    ]);

    const contracts = (contractsRes.data ?? []) as any[];
    const modules = (modulesRes.data ?? []) as any[];
    const rev = (revRes.data ?? []) as any[];
    const integ = (integRes.data ?? []) as any[];
    const events = (eventsRes.data ?? []) as any[];
    const niches = (nichesRes.data ?? []) as any[];
    const nicheById = new Map(niches.map((n: any) => [n.id, n]));

    const byCompany = new Map<string, any>();
    for (const id of ids) byCompany.set(id, { revenue30: 0, mrr: 0, modulesEnabled: 0, integrations: [], lastEvent: null as any, errors7d: 0, contractStatus: null as any });

    for (const r of rev) {
      const b = byCompany.get(r.company_id);
      if (b) b.revenue30 += Number(r.net_cents ?? 0);
    }
    for (const m of modules) {
      const b = byCompany.get(m.company_id);
      if (b && m.is_enabled) b.modulesEnabled += 1;
    }
    for (const c of contracts) {
      const b = byCompany.get(c.company_id);
      if (!b) continue;
      b.mrr += Number(c.recurring_amount ?? 0);
      if (!b.contractStatus || c.status === "active") b.contractStatus = c.status;
      b.nextDue = c.next_due_date;
      b.lastPaid = c.last_paid_at;
    }
    for (const i of integ) {
      const b = byCompany.get(i.company_id);
      if (b) b.integrations.push({ provider: i.provider, status: i.status, lastCheck: i.last_check_at });
    }
    for (const e of events) {
      const b = byCompany.get(e.company_id);
      if (!b) continue;
      if (!b.lastEvent) b.lastEvent = e;
      if (e.severity === "error" || e.severity === "critical") b.errors7d += 1;
    }

    const tenants = list.map((c) => {
      const agg = byCompany.get(c.id)!;
      const integErrors = agg.integrations.filter((i: any) => i.status && i.status !== "connected" && i.status !== "healthy").length;
      let health: "ok" | "warn" | "error" = "ok";
      if (agg.errors7d > 10 || integErrors > 0) health = "warn";
      if (agg.errors7d > 50 || (agg.integrations.length > 0 && integErrors === agg.integrations.length)) health = "error";
      if (!c.is_active) health = "error";
      return {
        id: c.id,
        name: c.trade_name || c.name,
        kind: c.company_type ?? "—",
        niche: nicheById.get(c.niche_id)?.name ?? null,
        subdomain: c.subdomain ?? c.public_slug ?? null,
        active: c.is_active,
        demo: c.is_demo,
        master: c.is_master,
        status: c.status,
        statusCommercial: c.status_commercial,
        statusFinancial: c.status_financial,
        statusTechnical: c.status_technical,
        environment: c.environment,
        createdAt: c.created_at,
        revenue30BRL: Math.round(agg.revenue30) / 100,
        mrrBRL: Number(agg.mrr ?? 0),
        modulesEnabled: agg.modulesEnabled,
        integrationsTotal: agg.integrations.length,
        integrationsErrors: integErrors,
        errors7d: agg.errors7d,
        lastEvent: agg.lastEvent,
        contractStatus: agg.contractStatus,
        nextDue: agg.nextDue ?? null,
        lastPaid: agg.lastPaid ?? null,
        health,
      };
    });

    const kpis = {
      total: tenants.length,
      active: tenants.filter((t) => t.active).length,
      demo: tenants.filter((t) => t.demo).length,
      withErrors: tenants.filter((t) => t.health === "error").length,
      withWarns: tenants.filter((t) => t.health === "warn").length,
      mrrTotalBRL: tenants.reduce((s, t) => s + t.mrrBRL, 0),
      revenue30TotalBRL: tenants.reduce((s, t) => s + t.revenue30BRL, 0),
    };

    return { kpis, tenants };
  });

function zeros() {
  return { total: 0, active: 0, demo: 0, withErrors: 0, withWarns: 0, mrrTotalBRL: 0, revenue30TotalBRL: 0 };
}
