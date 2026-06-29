// Tenant Lifecycle Admin — provisionar, suspender, reativar e arquivar tenants.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LifecycleStatus = "active" | "suspended" | "archived";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

async function audit(supa: any, args: {
  companyId: string; userId: string; action: string; before: any; after: any; reason?: string | null;
}) {
  await supa.from("audit_logs").insert({
    company_id: args.companyId,
    user_id: args.userId,
    action: args.action,
    entity: "company",
    entity_id: args.companyId,
    before: args.before,
    after: args.after,
    metadata: args.reason ? { reason: args.reason } : {},
  });
}

const listInput = z.object({
  status: z.enum(["all", "active", "suspended", "archived"]).optional(),
  query: z.string().optional(),
});

export const listLifecycleTenants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    let q = supa
      .from("companies")
      .select("id,name,public_slug,logo_url,status,is_active,is_demo,environment,company_kind,niche_id,created_at,status_commercial,status_financial,status_technical")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status && data.status !== "all") {
      if (data.status === "active") q = q.eq("status", "active").eq("is_active", true);
      if (data.status === "suspended") q = q.eq("status", "active").eq("is_active", false);
      if (data.status === "archived") q = q.eq("status", "archived");
    }
    if (data.query && data.query.trim().length >= 2) {
      const term = `%${data.query.trim()}%`;
      q = q.or(`name.ilike.${term},public_slug.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      ...r,
      lifecycle: (r.status === "archived"
        ? "archived"
        : r.is_active === false
        ? "suspended"
        : "active") as LifecycleStatus,
    }));
  });

export const lifecycleSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const [a, s, ar, d] = await Promise.all([
      supa.from("companies").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_active", true),
      supa.from("companies").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_active", false),
      supa.from("companies").select("id", { count: "exact", head: true }).eq("status", "archived"),
      supa.from("companies").select("id", { count: "exact", head: true }).eq("is_demo", true),
    ]);
    return {
      active: a.count ?? 0,
      suspended: s.count ?? 0,
      archived: ar.count ?? 0,
      demos: d.count ?? 0,
    };
  });

const actionInput = z.object({
  companyId: z.string().uuid(),
  reason: z.string().nullable().optional(),
});

async function applyLifecycle(
  ctx: { userId: string },
  companyId: string,
  patch: Record<string, any>,
  action: string,
  reason: string | null | undefined,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const supa = supabaseAdmin as any;
  const { data: before, error: bErr } = await supa
    .from("companies")
    .select("status,is_active")
    .eq("id", companyId)
    .single();
  if (bErr) throw new Error(bErr.message);
  const { data: after, error } = await supa
    .from("companies")
    .update(patch)
    .eq("id", companyId)
    .select("status,is_active")
    .single();
  if (error) throw new Error(error.message);
  await audit(supa, { companyId, userId: ctx.userId, action, before, after, reason: reason ?? null });
  return { ok: true, status: after.status, is_active: after.is_active };
}

export const suspendTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return applyLifecycle(context, data.companyId, { is_active: false, status: "active" }, "tenant.suspend", data.reason);
  });

export const reactivateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return applyLifecycle(context, data.companyId, { is_active: true, status: "active" }, "tenant.reactivate", data.reason);
  });

export const archiveTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return applyLifecycle(context, data.companyId, { status: "archived", is_active: false }, "tenant.archive", data.reason);
  });

export const restoreTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    return applyLifecycle(context, data.companyId, { status: "active", is_active: true }, "tenant.restore", data.reason);
  });

const lifecycleEventsInput = z.object({ companyId: z.string().uuid(), limit: z.number().int().min(1).max(100).optional() });

export const listLifecycleEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lifecycleEventsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const { data: rows, error } = await supa
      .from("audit_logs")
      .select("id,action,user_email,before,after,metadata,created_at")
      .eq("company_id", data.companyId)
      .like("action", "tenant.%")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 30);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============================================================
// Cockpit read-only — getTenantLifecycle (consumido por admin.tenant-lifecycle.tsx)
// ============================================================
export const getTenantLifecycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;

    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const addDays = (n: number) => new Date(now.getTime() + n * 86400000);
    const since30 = iso(addDays(-30));
    const in7 = iso(addDays(7));
    const in30 = iso(addDays(30));

    const [companies, onboarding, trials, contracts, susp, domains, emails, mig] = await Promise.all([
      supa.from("companies").select("id,name,is_active,status,created_at").neq("status", "archived"),
      supa.from("onboarding_checklist").select("company_id,item_key,status,completed_at"),
      supa.from("trial_subscriptions").select("id,company_id,chosen_plan,status,ends_at,converted_at"),
      supa.from("billing_contracts").select("id,company_id,status,recurring_amount,next_due_date,last_paid_at"),
      supa.from("billing_suspensions").select("id,company_id,reason,suspended_at,reactivated_at"),
      supa.from("onboarding_domain_requests").select("id,company_id,requested_value,status").neq("status", "done"),
      supa.from("onboarding_email_requests").select("id,company_id,full_address,status").neq("status", "done"),
      supa.from("companies_migration_log").select("id,company_id,status,updated_at,created_at").gte("created_at", since30),
    ]);

    const companyName = new Map<string, string>();
    for (const c of companies.data ?? []) companyName.set(c.id, c.name);
    const nm = (id: string) => companyName.get(id) ?? "(sem nome)";

    const activeTenants = (companies.data ?? []).filter((c: any) => c.is_active && c.status !== "archived").length;
    const newTenants30 = (companies.data ?? []).filter((c: any) => c.created_at >= since30).length;

    const obByCompany = new Map<string, { done: number; total: number }>();
    for (const o of onboarding.data ?? []) {
      const cur = obByCompany.get(o.company_id) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (o.status === "done" || o.completed_at) cur.done += 1;
      obByCompany.set(o.company_id, cur);
    }
    const onboardingInProgress = Array.from(obByCompany.entries())
      .filter(([, v]) => v.total > 0 && v.done < v.total)
      .map(([cid, v]) => ({ companyId: cid, companyName: nm(cid), done: v.done, total: v.total, pct: (v.done / v.total) * 100 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 12);
    const onboardingActive = onboardingInProgress.length;
    const onboardingCompleted = Array.from(obByCompany.values()).filter((v) => v.total > 0 && v.done === v.total).length;

    const trialsActive = (trials.data ?? []).filter((t: any) => t.status === "active").length;
    const trialsConverted = (trials.data ?? []).filter((t: any) => t.converted_at).length;
    const trialsExpired = (trials.data ?? []).filter((t: any) => t.status === "expired").length;
    const trialsExpiringSoon = (trials.data ?? [])
      .filter((t: any) => t.status === "active" && t.ends_at && t.ends_at <= in7)
      .map((t: any) => ({ id: t.id, companyName: nm(t.company_id), chosenPlan: t.chosen_plan, endsAt: t.ends_at }))
      .sort((a: any, b: any) => (a.endsAt ?? "").localeCompare(b.endsAt ?? ""))
      .slice(0, 15);

    const activeContracts = (contracts.data ?? []).filter((c: any) => c.status === "active");
    const contractsActive = activeContracts.length;
    const mrrActive = activeContracts.reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const dueSoonContracts = activeContracts
      .filter((c: any) => c.next_due_date && c.next_due_date <= in7)
      .map((c: any) => ({ id: c.id, companyName: nm(c.company_id), nextDueDate: c.next_due_date, lastPaidAt: c.last_paid_at, recurringAmount: Number(c.recurring_amount ?? 0) }))
      .sort((a: any, b: any) => (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? ""))
      .slice(0, 20);
    const dueIn7 = dueSoonContracts.length;
    const dueIn30 = activeContracts.filter((c: any) => c.next_due_date && c.next_due_date <= in30).length;

    const activeSusp = (susp.data ?? []).filter((s: any) => !s.reactivated_at);
    const suspActive = activeSusp.length;
    const reactivated30 = (susp.data ?? []).filter((s: any) => s.reactivated_at && s.reactivated_at >= since30).length;
    const recentSusp = activeSusp
      .map((s: any) => ({ id: s.id, companyName: nm(s.company_id), reason: s.reason, suspendedAt: s.suspended_at }))
      .sort((a: any, b: any) => (b.suspendedAt ?? "").localeCompare(a.suspendedAt ?? ""))
      .slice(0, 15);

    const domainPending = (domains.data ?? []).length;
    const emailPending = (emails.data ?? []).length;
    const onboardingRequests = {
      domains: (domains.data ?? []).slice(0, 10).map((r: any) => ({ id: r.id, companyName: nm(r.company_id), requested_value: r.requested_value, status: r.status })),
      emails: (emails.data ?? []).slice(0, 10).map((r: any) => ({ id: r.id, companyName: nm(r.company_id), full_address: r.full_address, status: r.status })),
    };

    const migByCompany = new Map<string, { steps: number; lastStatus: string | null; lastAt: string | null }>();
    for (const m of mig.data ?? []) {
      const cur = migByCompany.get(m.company_id) ?? { steps: 0, lastStatus: null, lastAt: null };
      cur.steps += 1;
      const ts = m.updated_at ?? m.created_at;
      if (!cur.lastAt || (ts && ts > cur.lastAt)) { cur.lastAt = ts; cur.lastStatus = m.status; }
      migByCompany.set(m.company_id, cur);
    }
    const migrationsInProgress = Array.from(migByCompany.entries())
      .map(([cid, v]) => ({ companyId: cid, companyName: nm(cid), steps: v.steps, lastStatus: v.lastStatus, lastAt: v.lastAt }))
      .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
      .slice(0, 15);

    return {
      totals: {
        activeTenants, newTenants30,
        onboardingActive, onboardingCompleted,
        trialsActive, trialsConverted, trialsExpired,
        contractsActive, mrrActive,
        dueIn7, dueIn30,
        suspActive, reactivated30,
        domainPending, emailPending,
      },
      onboardingInProgress,
      trialsExpiringSoon,
      dueSoonContracts,
      recentSusp,
      migrationsInProgress,
      onboardingRequests,
    };
  });
