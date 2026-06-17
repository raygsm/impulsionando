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

async function ensureApprover(supabase: any, userId: string, companyId: string) {
  const { data, error } = await supabase.rpc("user_has_permission", {
    _user: userId, _company: companyId, _perm: "realestate.property.approve",
  });
  if (error) throw new Error("Falha ao verificar permissão de aprovação");
  if (!data) throw new Error("Você não tem permissão para revisar imóveis desta imobiliária");
}

async function loadPropertyMeta(supabase: any, propertyId: string) {
  const { data, error } = await supabase
    .from("realestate_properties")
    .select("id, company_id, title, reference_code, submitted_by")
    .eq("id", propertyId)
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; company_id: string; title: string; reference_code: string | null; submitted_by: string | null };
}

async function dispatchNotification(args: {
  event: "submitted" | "approved" | "rejected" | "changes_requested";
  propertyId: string;
  companyId: string;
  propertyTitle: string;
  referenceCode: string | null;
  submitterUserId: string | null;
  reviewerUserId: string | null;
  notes: string | null | undefined;
}) {
  try {
    const { notifyPropertyApprovalEvent } = await import("./realestate-approval-notify.server");
    await notifyPropertyApprovalEvent({
      event: args.event,
      propertyId: args.propertyId,
      companyId: args.companyId,
      propertyTitle: args.propertyTitle,
      referenceCode: args.referenceCode,
      submitterUserId: args.submitterUserId,
      reviewerUserId: args.reviewerUserId,
      notes: args.notes ?? null,
    });
  } catch (err) {
    console.error("dispatchNotification failed", err);
  }
}

export const submitPropertyForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const meta = await loadPropertyMeta(context.supabase, data.propertyId);
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .update({
        approval_status: "pending",
        submitted_for_review_at: new Date().toISOString(),
        submitted_by: context.userId,
        is_published: false,
      })
      .eq("id", data.propertyId)
      .select("id, company_id, title, reference_code")
      .single();
    if (e1) throw new Error(e1.message);
    await logReview(context.supabase, prop.id, prop.company_id, "submitted", context.userId, data.notes);
    await dispatchNotification({
      event: "submitted",
      propertyId: prop.id,
      companyId: prop.company_id,
      propertyTitle: prop.title ?? meta.title,
      referenceCode: prop.reference_code ?? meta.reference_code,
      submitterUserId: context.userId,
      reviewerUserId: null,
      notes: data.notes,
    });
    return { ok: true };
  });

async function performReview(
  context: any,
  data: { propertyId: string; notes?: string | null },
  next: "approved" | "rejected" | "changes_requested",
) {
  const meta = await loadPropertyMeta(context.supabase, data.propertyId);
  await ensureApprover(context.supabase, context.userId, meta.company_id);

  const { data: prop, error: e1 } = await context.supabase
    .from("realestate_properties")
    .update({
      approval_status: next,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      review_notes: data.notes ?? null,
      is_published: next === "approved",
    })
    .eq("id", data.propertyId)
    .select("id, company_id, title, reference_code, submitted_by")
    .single();
  if (e1) throw new Error(e1.message);
  await logReview(context.supabase, prop.id, prop.company_id, next, context.userId, data.notes);
  await dispatchNotification({
    event: next,
    propertyId: prop.id,
    companyId: prop.company_id,
    propertyTitle: prop.title ?? meta.title,
    referenceCode: prop.reference_code ?? meta.reference_code,
    submitterUserId: prop.submitted_by ?? meta.submitted_by,
    reviewerUserId: context.userId,
    notes: data.notes,
  });
  return { ok: true };
}

export const approveProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => performReview(context, data, "approved"));

export const rejectProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.notes || !data.notes.trim()) throw new Error("Informe o motivo da rejeição");
    return performReview(context, data, "rejected");
  });

export const requestPropertyChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApprovalActionInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.notes || !data.notes.trim()) throw new Error("Descreva os ajustes necessários");
    return performReview(context, data, "changes_requested");
  });

export const canApproveProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("user_has_permission", {
      _user: context.userId, _company: data.companyId, _perm: "realestate.property.approve",
    });
    return { canApprove: !!ok };
  });

const QueueQueryInput = z.object({
  companyId: z.string().uuid(),
  search: z.string().max(120).optional().nullable(),
  status: z.array(z.enum(["pending", "changes_requested", "rejected", "approved"])).optional(),
  reviewerId: z.string().uuid().optional().nullable(),
  submitterId: z.string().uuid().optional().nullable(),
  dateFrom: z.string().datetime().optional().nullable(),
  dateTo: z.string().datetime().optional().nullable(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const listApprovalQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QueueQueryInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const statuses: Array<"pending" | "changes_requested" | "rejected" | "approved"> =
      data.status?.length ? data.status : ["pending", "changes_requested", "rejected"];

    let q = context.supabase
      .from("realestate_properties")
      .select(
        "id, reference_code, title, operation, property_type, sale_price, rent_price, neighborhood, city, approval_status, submitted_for_review_at, submitted_by, reviewed_by, reviewed_at, review_notes, photos",
        { count: "exact" },
      )
      .eq("company_id", data.companyId)
      .in("approval_status", statuses);

    if (data.search?.trim()) {
      const s = data.search.trim().replace(/[%,]/g, "");
      q = q.or(`title.ilike.%${s}%,reference_code.ilike.%${s}%,neighborhood.ilike.%${s}%,city.ilike.%${s}%`);
    }
    if (data.reviewerId) q = q.eq("reviewed_by", data.reviewerId);
    if (data.submitterId) q = q.eq("submitted_by", data.submitterId);
    if (data.dateFrom) q = q.gte("submitted_for_review_at", data.dateFrom);
    if (data.dateTo) q = q.lte("submitted_for_review_at", data.dateTo);

    const { data: rows, error, count } = await q
      .order("submitted_for_review_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) throw new Error(error.message);

    // Reviewer directory for filter dropdown
    const userIds = Array.from(
      new Set(
        (rows ?? [])
          .flatMap((r: any) => [r.reviewed_by, r.submitted_by])
          .filter(Boolean) as string[],
      ),
    );
    let directory: Array<{ id: string; name: string }> = [];
    if (userIds.length) {
      const { data: profiles } = await context.supabase
        .from("user_profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);
      directory = (profiles ?? []).map((p: any) => ({
        id: p.user_id,
        name: p.display_name || p.email || "Usuário",
      }));
    }

    return { items: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize, directory };
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

    const actorIds = Array.from(new Set((rows ?? []).map((r: any) => r.actor_id).filter(Boolean)));
    let actors: Record<string, string> = {};
    if (actorIds.length) {
      const { data: profiles } = await context.supabase
        .from("user_profiles")
        .select("user_id, display_name, email")
        .in("user_id", actorIds);
      for (const p of (profiles ?? []) as any[]) {
        actors[p.user_id] = p.display_name || p.email || "Usuário";
      }
    }
    return { reviews: rows ?? [], actors };
  });

export const exportPropertyApprovalCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { propertyId: string }) => z.object({ propertyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: prop, error: e1 } = await context.supabase
      .from("realestate_properties")
      .select("id, company_id, title, reference_code, approval_status")
      .eq("id", data.propertyId)
      .single();
    if (e1) throw new Error(e1.message);

    const { data: rows, error: e2 } = await context.supabase
      .from("realestate_property_reviews")
      .select("id, action, actor_id, notes, created_at")
      .eq("property_id", data.propertyId)
      .order("created_at", { ascending: true });
    if (e2) throw new Error(e2.message);

    const actorIds = Array.from(new Set((rows ?? []).map((r: any) => r.actor_id).filter(Boolean)));
    let actors: Record<string, string> = {};
    if (actorIds.length) {
      const { data: profiles } = await context.supabase
        .from("user_profiles")
        .select("user_id, display_name, email")
        .in("user_id", actorIds);
      for (const p of (profiles ?? []) as any[]) {
        actors[p.user_id] = p.display_name || p.email || "Usuário";
      }
    }

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Data/Hora", "Ação", "Responsável", "Observações"].join(",");
    const lines = (rows ?? []).map((r: any) =>
      [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.action,
        actors[r.actor_id] ?? r.actor_id ?? "—",
        r.notes ?? "",
      ].map(escape).join(","),
    );
    const meta = [
      `# Imóvel,${escape(prop.title)}`,
      `# Referência,${escape(prop.reference_code ?? "")}`,
      `# Status atual,${escape(prop.approval_status)}`,
      `# Exportado em,${escape(new Date().toLocaleString("pt-BR"))}`,
    ].join("\n");
    const csv = [meta, "", header, ...lines].join("\n");

    return {
      filename: `aprovacao-${prop.reference_code || prop.id}.csv`,
      csv,
    };
  });

// ============ Batch queue export (current filters) ============
const BatchExportInput = QueueQueryInput.extend({
  pageSize: z.number().int().min(5).max(1000).default(500),
});

export const exportApprovalQueueCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BatchExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const statuses: Array<"pending" | "changes_requested" | "rejected" | "approved"> =
      data.status?.length ? data.status : ["pending", "changes_requested", "rejected"];

    let q = context.supabase
      .from("realestate_properties")
      .select(
        "id, reference_code, title, operation, property_type, sale_price, rent_price, neighborhood, city, approval_status, submitted_for_review_at, submitted_by, reviewed_by, reviewed_at, review_notes",
      )
      .eq("company_id", data.companyId)
      .in("approval_status", statuses);

    if (data.search?.trim()) {
      const s = data.search.trim().replace(/[%,]/g, "");
      q = q.or(`title.ilike.%${s}%,reference_code.ilike.%${s}%,neighborhood.ilike.%${s}%,city.ilike.%${s}%`);
    }
    if (data.reviewerId) q = q.eq("reviewed_by", data.reviewerId);
    if (data.submitterId) q = q.eq("submitted_by", data.submitterId);
    if (data.dateFrom) q = q.gte("submitted_for_review_at", data.dateFrom);
    if (data.dateTo) q = q.lte("submitted_for_review_at", data.dateTo);

    const { data: rows, error } = await q
      .order("submitted_for_review_at", { ascending: false, nullsFirst: false })
      .limit(data.pageSize);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).flatMap((r: any) => [r.reviewed_by, r.submitted_by]).filter(Boolean) as string[]));
    let actors: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await context.supabase
        .from("user_profiles").select("user_id, display_name, email").in("user_id", userIds);
      for (const p of (profiles ?? []) as any[]) {
        actors[p.user_id] = p.display_name || p.email || "Usuário";
      }
    }

    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "Referência", "Título", "Operação", "Tipo", "Preço", "Bairro", "Cidade",
      "Status", "Enviado em", "Enviado por", "Revisado em", "Revisado por", "Observações",
    ].join(",");
    const lines = (rows ?? []).map((r: any) => {
      const price = r.operation === "locacao" ? r.rent_price : r.sale_price;
      return [
        r.reference_code ?? "", r.title ?? "", r.operation ?? "", r.property_type ?? "",
        price ?? "", r.neighborhood ?? "", r.city ?? "", r.approval_status ?? "",
        r.submitted_for_review_at ? new Date(r.submitted_for_review_at).toLocaleString("pt-BR") : "",
        actors[r.submitted_by] ?? "",
        r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("pt-BR") : "",
        actors[r.reviewed_by] ?? "",
        r.review_notes ?? "",
      ].map(esc).join(",");
    });

    return {
      filename: `fila-aprovacao-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...lines].join("\n"),
      total: rows?.length ?? 0,
    };
  });

// ============ Notification preferences ============
const APPROVAL_CATEGORIES = ["realestate.approval.submitted", "realestate.approval.decision"] as const;
const PREF_CHANNELS = ["in_app", "email"] as const;

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("category, channel, enabled, company_id")
      .eq("user_id", context.userId)
      .is("company_id", null)
      .in("category", APPROVAL_CATEGORIES as unknown as string[]);
    if (error) throw new Error(error.message);

    const { data: prof } = await context.supabase
      .from("user_profiles").select("email").eq("user_id", context.userId).limit(1).maybeSingle();
    const email = (prof as any)?.email as string | undefined;
    let suppression: { suppressed: boolean; reason?: string } = { suppressed: false };
    if (email) {
      const { data: sup } = await context.supabase
        .from("suppressed_emails").select("reason").eq("email", email.toLowerCase()).maybeSingle();
      if (sup) suppression = { suppressed: true, reason: (sup as any).reason };
    }

    return {
      preferences: data ?? [],
      email: email ?? null,
      suppression,
      categories: APPROVAL_CATEGORIES,
      channels: PREF_CHANNELS,
    };
  });

export const updateNotificationPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    category: z.enum(APPROVAL_CATEGORIES),
    channel: z.enum(PREF_CHANNELS),
    enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // partial unique index (where company_id IS NULL) doesn't work with PostgREST onConflict —
    // do a manual delete+insert instead
    await context.supabase
      .from("notification_preferences")
      .delete()
      .eq("user_id", context.userId)
      .is("company_id", null)
      .eq("category", data.category)
      .eq("channel", data.channel);
    const { error } = await context.supabase
      .from("notification_preferences")
      .insert({
        user_id: context.userId,
        company_id: null,
        category: data.category,
        channel: data.channel,
        enabled: data.enabled,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });



