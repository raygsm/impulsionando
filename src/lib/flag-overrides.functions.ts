import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export const listTenantsForFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any)
      .from("companies")
      .select("id,name,public_slug,logo_url")
      .eq("is_active", true)
      .neq("status", "archived")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; name: string; public_slug: string | null; logo_url: string | null }>;
  });

const tenantInput = z.object({ companyId: z.string().uuid() });

export const listFlagsForTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tenantInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const [flagsRes, ovrRes] = await Promise.all([
      supa.from("core_feature_flags")
        .select("id,module_slug,key,label,description,default_value,category,is_active")
        .eq("is_active", true)
        .order("module_slug").order("sort_order"),
      supa.from("core_feature_flag_overrides")
        .select("id,flag_id,value,reason,updated_at")
        .eq("company_id", data.companyId),
    ]);
    if (flagsRes.error) throw new Error(flagsRes.error.message);
    if (ovrRes.error) throw new Error(ovrRes.error.message);
    const ovrMap = new Map<string, any>();
    for (const o of ovrRes.data ?? []) ovrMap.set(o.flag_id, o);
    return (flagsRes.data ?? []).map((f: any) => {
      const o = ovrMap.get(f.id);
      return {
        ...f,
        override_id: o?.id ?? null,
        override_value: o ? (o.value as boolean) : null,
        override_reason: o?.reason ?? null,
        effective_value: o ? o.value : f.default_value,
      };
    });
  });

const upsertSchema = z.object({
  companyId: z.string().uuid(),
  flagId: z.string().uuid(),
  value: z.boolean(),
  reason: z.string().nullable().optional(),
});

export const upsertFlagOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("core_feature_flag_overrides")
      .upsert(
        {
          company_id: data.companyId,
          flag_id: data.flagId,
          value: data.value,
          reason: data.reason ?? null,
          set_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,flag_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const clearSchema = z.object({ companyId: z.string().uuid(), flagId: z.string().uuid() });

export const clearFlagOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => clearSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("core_feature_flag_overrides")
      .delete()
      .eq("company_id", data.companyId)
      .eq("flag_id", data.flagId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
