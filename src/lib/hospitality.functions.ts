import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getCompanyIdBySlug(supabase: any, slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", slug)
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data?.company_id ?? null;
}

const tenantInput = z.object({ slug: z.string().min(1) });

export const listHospitalityTapboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantInput.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdBySlug(context.supabase, data.slug);
    if (!companyId) return [];
    const { data: rows, error } = await context.supabase
      .from("hospitality_public_tapboard")
      .select("*")
      .eq("company_id", companyId)
      .order("tap_number");
    if (error) throw error;
    return rows ?? [];
  });

export const listHospitalityOpenTabs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantInput.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdBySlug(context.supabase, data.slug);
    if (!companyId) return [];
    const { data: rows, error } = await context.supabase
      .from("hospitality_tabs")
      .select("*")
      .eq("company_id", companyId)
      .in("status", ["open", "closing"])
      .order("opened_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const openHospitalityTab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    slug: z.string().min(1),
    tab_number: z.string().min(1),
    service_mode: z.enum(["table", "counter", "takeaway", "event"]).default("table"),
    table_label: z.string().optional(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdBySlug(context.supabase, data.slug);
    if (!companyId) throw new Error("Cliente não encontrado no Core");
    const { slug: _slug, ...payload } = data;
    const { data: row, error } = await context.supabase
      .from("hospitality_tabs")
      .insert({ ...payload, company_id: companyId, opened_by: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const postHospitalityDraftSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    slug: z.string().min(1),
    tab_id: z.string().uuid(),
    tap_id: z.string().uuid(),
    serving_size_id: z.string().uuid(),
    quantity: z.number().int().positive().default(1),
    idempotency_key: z.string().min(1).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdBySlug(context.supabase, data.slug);
    if (!companyId) throw new Error("Cliente não encontrado no Core");
    const { data: itemId, error } = await context.supabase.rpc("hospitality_post_draft_sale", {
      p_company_id: companyId,
      p_tab_id: data.tab_id,
      p_tap_id: data.tap_id,
      p_serving_size_id: data.serving_size_id,
      p_quantity: data.quantity,
      p_actor_id: context.userId,
      p_idempotency_key: data.idempotency_key ?? null,
    });
    if (error) throw error;
    return { ok: true, item_id: itemId };
  });

export const listHospitalityKegs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantInput.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdBySlug(context.supabase, data.slug);
    if (!companyId) return [];
    const { data: rows, error } = await context.supabase
      .from("hospitality_kegs")
      .select("*, hospitality_beers(name,brewery,style,abv,ibu)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });
