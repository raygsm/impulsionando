import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export const fetchTenantDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const id = data.companyId;

    const [
      compRes,
      contractsRes,
      invoicesRes,
      modulesRes,
      catalogRes,
      revRes,
      integRes,
      eventsRes,
      auditRes,
      payoutsRes,
      customersRes,
    ] = await Promise.all([
      context.supabase.from("companies" as any).select("*").eq("id", id).maybeSingle(),
      context.supabase.from("billing_contracts" as any).select("*").eq("company_id", id).order("created_at", { ascending: false }),
      context.supabase
        .from("billing_invoices" as any)
        .select("id,amount,status,due_date,paid_at,period_start,period_end,created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.from("company_modules" as any).select("module_id,is_enabled,enabled_at,installed_version").eq("company_id", id),
      context.supabase.from("core_module_catalog" as any).select("id,slug,name,category"),
      context.supabase
        .from("core_revenue_calculations" as any)
        .select("net_cents,gross_cents,method,captured_at,status")
        .eq("company_id", id)
        .order("captured_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("core_integrations" as any)
        .select("provider,status,last_check_at,metadata,updated_at")
        .eq("company_id", id),
      context.supabase
        .from("runtime_events" as any)
        .select("event_type,severity,message,created_at,metadata")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("audit_logs" as any)
        .select("action,entity,entity_id,user_email,created_at,metadata")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("core_payout_ledger" as any)
        .select("gross_cents,net_cents,status,period_start,period_end,paid_at")
        .eq("company_id", id)
        .order("period_end", { ascending: false })
        .limit(20),
      context.supabase.from("customers" as any).select("id", { count: "exact", head: true }).eq("company_id", id),
    ]);

    if (compRes.error || !compRes.data) throw new Error("Tenant não encontrado");
    const company = compRes.data as any;
    const catalog = (catalogRes.data ?? []) as any[];
    const catalogById = new Map(catalog.map((m: any) => [m.id, m]));

    const modules = ((modulesRes.data ?? []) as any[]).map((m: any) => {
      const cat = catalogById.get(m.module_id);
      return {
        slug: cat?.slug ?? m.module_id,
        name: cat?.name ?? m.module_id,
        category: cat?.category ?? null,
        enabled: m.is_enabled,
        enabledAt: m.enabled_at,
        version: m.installed_version,
      };
    });

    const rev = (revRes.data ?? []) as any[];
    const revenue30 = rev
      .filter((r) => new Date(r.captured_at).getTime() > Date.now() - 30 * 86400_000)
      .reduce((s, r) => s + Number(r.net_cents ?? 0), 0);
    const revenue90 = rev
      .filter((r) => new Date(r.captured_at).getTime() > Date.now() - 90 * 86400_000)
      .reduce((s, r) => s + Number(r.net_cents ?? 0), 0);

    const contracts = (contractsRes.data ?? []) as any[];
    const mrr = contracts.filter((c) => c.status === "active").reduce((s, c) => s + Number(c.recurring_amount ?? 0), 0);

    return {
      company,
      kpis: {
        mrrBRL: mrr,
        revenue30BRL: Math.round(revenue30) / 100,
        revenue90BRL: Math.round(revenue90) / 100,
        modulesEnabled: modules.filter((m) => m.enabled).length,
        modulesTotal: modules.length,
        customers: (customersRes as any).count ?? 0,
        invoicesOpen: ((invoicesRes.data ?? []) as any[]).filter((i: any) => i.status !== "paid").length,
        integrationsErrors: ((integRes.data ?? []) as any[]).filter(
          (i: any) => i.status && i.status !== "connected" && i.status !== "healthy",
        ).length,
      },
      contracts,
      invoices: invoicesRes.data ?? [],
      modules,
      revenue: rev,
      integrations: integRes.data ?? [],
      events: eventsRes.data ?? [],
      audit: auditRes.data ?? [],
      payouts: payoutsRes.data ?? [],
    };
  });

export const setTenantActiveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; active: boolean; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("companies" as any)
      .update({ is_active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await context.supabase.from("audit_logs" as any).insert({
      company_id: data.companyId,
      user_id: context.userId,
      action: data.active ? "tenant.activated" : "tenant.deactivated",
      entity: "companies",
      entity_id: data.companyId,
      metadata: { reason: data.reason ?? null, source: "admin.cockpit" },
    });

    return { ok: true };
  });
