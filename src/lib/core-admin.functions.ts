import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

// ---------- MENUS ----------
export const listCoreMenus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    let q = (context.supabase as any)
      .from("core_menu_items")
      .select("*")
      .order("sort_order");
    if (data.scope) q = q.eq("scope", data.scope);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

const menuPatchSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    label: z.string().optional(),
    icon: z.string().nullable().optional(),
    route: z.string().nullable().optional(),
    sort_order: z.number().int().optional(),
    is_visible: z.boolean().optional(),
  }),
});

export const updateCoreMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => menuPatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("core_menu_items")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- FEATURE FLAGS ----------
export const listCoreFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("core_feature_flags")
      .select("*")
      .order("module_slug")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

const flagPatchSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    label: z.string().optional(),
    description: z.string().nullable().optional(),
    default_value: z.boolean().optional(),
    category: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCoreFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => flagPatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("core_feature_flags")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- DASHBOARD WIDGETS ----------
export const listCoreWidgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("core_dashboard_widgets")
      .select("*")
      .order("dashboard_key")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

const widgetPatchSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    widget_type: z.string().optional(),
    data_source: z.string().nullable().optional(),
    sort_order: z.number().int().optional(),
    is_visible: z.boolean().optional(),
  }),
});

export const updateCoreWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => widgetPatchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("core_dashboard_widgets")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
