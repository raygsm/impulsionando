/**
 * Server functions para gerenciar cardápio digital (categorias + itens).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function resolveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("user_profiles").select("company_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Usuário sem empresa vinculada.");
  return data.company_id as string;
}

export const listMenu = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    const [cats, items] = await Promise.all([
      context.supabase.from("restaurant_menu_categories").select("*").eq("company_id", companyId).order("sort_order").order("name"),
      context.supabase.from("restaurant_menu_items").select("*").eq("company_id", companyId).order("sort_order").order("name"),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (items.error) throw new Error(items.error.message);
    return { categories: cats.data ?? [], items: items.data ?? [] };
  });

export const upsertMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(80),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("restaurant_menu_categories").update(rest).eq("id", id).eq("company_id", companyId);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase.from("restaurant_menu_categories")
      .insert({ company_id: companyId, ...data }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    const { error } = await context.supabase.from("restaurant_menu_categories").delete().eq("id", data.id).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    category_id: z.string().uuid().nullable().optional(),
    name: z.string().min(1).max(120),
    description: z.string().max(500).nullable().optional(),
    price_cents: z.number().int().min(0).max(10_000_000),
    image_url: z.string().url().nullable().optional(),
    is_available: z.boolean().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("restaurant_menu_items").update(rest).eq("id", id).eq("company_id", companyId);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase.from("restaurant_menu_items")
      .insert({ company_id: companyId, ...data }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context.supabase, context.userId);
    const { error } = await context.supabase.from("restaurant_menu_items").delete().eq("id", data.id).eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
