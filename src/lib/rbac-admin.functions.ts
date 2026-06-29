// RBAC Admin — gestão cross-tenant de roles (user_roles) pela equipe Impulsionando.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_ROLES = ["admin", "white_label", "gestor", "operador", "profissional", "consumidor"] as const;
export type AppRole = (typeof APP_ROLES)[number];
export const ALL_APP_ROLES = APP_ROLES;

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export const listRbacTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const { data, error } = await supa
      .from("companies")
      .select("id,name,public_slug,logo_url")
      .eq("is_active", true)
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; name: string; public_slug: string | null; logo_url: string | null }>;
  });

const tenantInput = z.object({ companyId: z.string().uuid() });

export const listTenantRoleAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tenantInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const [rolesRes, profilesRes] = await Promise.all([
      supa.from("user_roles").select("id,user_id,role,created_at").eq("company_id", data.companyId),
      supa
        .from("user_profiles")
        .select("user_id,display_name,email,is_active")
        .eq("company_id", data.companyId),
    ]);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

    const profMap = new Map<string, { display_name: string | null; email: string | null; is_active: boolean }>();
    for (const p of profilesRes.data ?? []) profMap.set(p.user_id, p);

    const userMap = new Map<
      string,
      { user_id: string; display_name: string | null; email: string | null; is_active: boolean; roles: Array<{ id: string; role: AppRole; created_at: string }> }
    >();
    for (const p of profilesRes.data ?? []) {
      userMap.set(p.user_id, {
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        is_active: p.is_active,
        roles: [],
      });
    }
    for (const r of rolesRes.data ?? []) {
      const existing = userMap.get(r.user_id);
      const prof = profMap.get(r.user_id);
      if (existing) {
        existing.roles.push({ id: r.id, role: r.role as AppRole, created_at: r.created_at });
      } else {
        userMap.set(r.user_id, {
          user_id: r.user_id,
          display_name: prof?.display_name ?? null,
          email: prof?.email ?? null,
          is_active: prof?.is_active ?? true,
          roles: [{ id: r.id, role: r.role as AppRole, created_at: r.created_at }],
        });
      }
    }
    return Array.from(userMap.values()).sort((a, b) =>
      (a.display_name ?? a.email ?? a.user_id).localeCompare(b.display_name ?? b.email ?? b.user_id),
    );
  });

const assignSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(APP_ROLES),
});

export const assignTenantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => assignSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supa = supabaseAdmin as any;
    const { data: existing } = await supa
      .from("user_roles")
      .select("id")
      .eq("company_id", data.companyId)
      .eq("user_id", data.userId)
      .eq("role", data.role)
      .maybeSingle();
    if (existing) return { ok: true, id: existing.id, already: true };
    const { data: ins, error } = await supa
      .from("user_roles")
      .insert({ company_id: data.companyId, user_id: data.userId, role: data.role })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins.id, already: false };
  });

const revokeSchema = z.object({ roleAssignmentId: z.string().uuid() });

export const revokeTenantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => revokeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("user_roles").delete().eq("id", data.roleAssignmentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const findSchema = z.object({ companyId: z.string().uuid(), query: z.string().min(2) });

export const findUserForTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => findSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const q = `%${data.query}%`;
    const { data: rows, error } = await supa
      .from("user_profiles")
      .select("user_id,display_name,email")
      .eq("company_id", data.companyId)
      .or(`email.ilike.${q},display_name.ilike.${q}`)
      .limit(20);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{ user_id: string; display_name: string | null; email: string | null }>;
  });
