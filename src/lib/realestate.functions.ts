import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OperationEnum = z.enum(["venda", "locacao", "venda_ou_locacao"]);
const PropertyTypeEnum = z.enum([
  "apartamento", "casa", "casa_condominio", "terreno", "sala_comercial",
  "loja", "galpao", "sitio", "chacara", "cobertura", "kitnet", "studio", "outro",
]);
const PropertyStatusEnum = z.enum(["rascunho", "ativo", "reservado", "vendido", "locado", "inativo"]);
const IntentStatusEnum = z.enum(["ativo", "pausado", "atendido", "arquivado"]);

const PropertyInput = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  reference_code: z.string().max(64).optional().nullable(),
  title: z.string().min(1).max(255),
  description: z.string().max(8000).optional().nullable(),
  operation: OperationEnum,
  property_type: PropertyTypeEnum,
  status: PropertyStatusEnum.default("ativo"),
  sale_price: z.number().nonnegative().nullable().optional(),
  rent_price: z.number().nonnegative().nullable().optional(),
  condo_fee: z.number().nonnegative().nullable().optional(),
  iptu: z.number().nonnegative().nullable().optional(),
  area_total: z.number().nonnegative().nullable().optional(),
  area_useful: z.number().nonnegative().nullable().optional(),
  bedrooms: z.number().int().min(0).max(50).default(0),
  suites: z.number().int().min(0).max(50).default(0),
  bathrooms: z.number().int().min(0).max(50).default(0),
  parking_spots: z.number().int().min(0).max(50).default(0),
  address_line: z.string().max(255).optional().nullable(),
  neighborhood: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zip: z.string().max(16).optional().nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  features: z.array(z.string().max(64)).max(50).default([]),
  photos: z.array(z.string().url().max(1024)).max(40).default([]),
  broker_user_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().default(true),
});

const IntentInput = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  lead_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  contact_name: z.string().max(255).optional().nullable(),
  contact_email: z.string().email().max(255).optional().nullable(),
  contact_phone: z.string().max(32).optional().nullable(),
  operation: OperationEnum,
  property_types: z.array(PropertyTypeEnum).max(13).default([]),
  price_min: z.number().nonnegative().nullable().optional(),
  price_max: z.number().nonnegative().nullable().optional(),
  area_min: z.number().nonnegative().nullable().optional(),
  bedrooms_min: z.number().int().min(0).max(50).default(0),
  bathrooms_min: z.number().int().min(0).max(50).default(0),
  parking_min: z.number().int().min(0).max(50).default(0),
  cities: z.array(z.string().max(120)).max(20).default([]),
  neighborhoods: z.array(z.string().max(120)).max(40).default([]),
  status: IntentStatusEnum.default("ativo"),
  notes: z.string().max(4000).optional().nullable(),
});

// ============ Properties ============
export const listProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_properties")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { properties: rows ?? [] };
  });

export const upsertProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PropertyInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const q = data.id
      ? context.supabase.from("realestate_properties").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("realestate_properties").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return { property: row };
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("realestate_properties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Search Intents ============
export const listIntents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_search_intents")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { intents: rows ?? [] };
  });

export const upsertIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IntentInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const q = data.id
      ? context.supabase.from("realestate_search_intents").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("realestate_search_intents").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return { intent: row };
  });

export const deleteIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("realestate_search_intents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ Matches ============
export const listMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_property_matches")
      .select("*, realestate_properties(title, reference_code, neighborhood, city), realestate_search_intents(contact_name, contact_email)")
      .eq("company_id", data.companyId)
      .order("notified_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { matches: rows ?? [] };
  });

// ============ Approval Workflow ============
const ApprovalActionInput = z.object({
  propertyId: z.string().uuid(),
  notes: z.string().max(2000).optional().nullable(),
});

async function logReview(
  supabase: any,
  propertyId: string,
  companyId: string,
  action: "submitted" | "approved" | "rejected" | "changes_requested",
  actorId: string | null,
  notes: string | null | undefined,
) {
  await supabase.from("realestate_property_reviews").insert({
    property_id: propertyId,
    company_id: companyId,
    action,
    actor_id: actorId,
    notes: notes ?? null,
  });
}

export const submitPropertyForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .update({
        approval_status: "pending",
        submitted_for_review_at: new Date().toISOString(),
        submitted_by: context.userId,
        is_published: false,
      })
      .eq("id", data.propertyId)
      .select("id, company_id")
      .single();
    if (e1) throw new Error(e1.message);
    await logReview(context.supabase, prop.id, prop.company_id, "submitted", context.userId, data.notes);
    return { ok: true };
  });

export const approveProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .update({
        approval_status: "approved",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
        is_published: true,
      })
      .eq("id", data.propertyId)
      .select("id, company_id")
      .single();
    if (e1) throw new Error(e1.message);
    await logReview(context.supabase, prop.id, prop.company_id, "approved", context.userId, data.notes);
    return { ok: true };
  });

export const rejectProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .update({
        approval_status: "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
        is_published: false,
      })
      .eq("id", data.propertyId)
      .select("id, company_id")
      .single();
    if (e1) throw new Error(e1.message);
    await logReview(context.supabase, prop.id, prop.company_id, "rejected", context.userId, data.notes);
    return { ok: true };
  });

export const requestPropertyChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .update({
        approval_status: "changes_requested",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
        is_published: false,
      })
      .eq("id", data.propertyId)
      .select("id, company_id")
      .single();
    if (e1) throw new Error(e1.message);
    await logReview(context.supabase, prop.id, prop.company_id, "changes_requested", context.userId, data.notes);
    return { ok: true };
  });

export const listApprovalQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_properties")
      .select("id, reference_code, title, operation, property_type, sale_price, rent_price, neighborhood, city, approval_status, submitted_for_review_at, submitted_by, reviewed_at, review_notes, photos")
      .eq("company_id", data.companyId)
      .in("approval_status", ["pending", "changes_requested", "rejected"])
      .order("submitted_for_review_at", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const listPropertyReviewHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { propertyId: string }) => z.object({ propertyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_property_reviews")
      .select("id, action, actor_id, notes, created_at")
      .eq("property_id", data.propertyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reviews: rows ?? [] };
  });
