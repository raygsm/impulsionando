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
