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
  previousStatus: string | null,
  newStatus: string | null,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("realestate_property_reviews").insert({
    property_id: propertyId,
    company_id: companyId,
    action,
    actor_id: actorId,
    notes: notes ?? null,
    previous_status: previousStatus,
    new_status: newStatus,
    metadata,
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
    .select("id, company_id, title, reference_code, submitted_by, approval_status")
    .eq("id", propertyId)
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; company_id: string; title: string; reference_code: string | null; submitted_by: string | null; approval_status: string | null };
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
    const previousStatus = meta.approval_status ?? null;
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
    await logReview(
      context.supabase, prop.id, prop.company_id, "submitted",
      context.userId, data.notes, previousStatus, "pending",
      { source: "submitPropertyForReview" },
    );
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
  const metadata: Record<string, unknown> = {
    source: "performReview",
    requires_notes: next === "rejected" || next === "changes_requested",
    notes_length: data.notes ? data.notes.length : 0,
  };
  if (next === "rejected") metadata.rejection_reason = data.notes ?? null;
  if (next === "changes_requested") metadata.requested_changes = data.notes ?? null;
  await logReview(
    context.supabase, prop.id, prop.company_id, next,
    context.userId, data.notes,
    meta.approval_status ?? null, next, metadata,
  );
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
      .select("id, action, actor_id, notes, previous_status, new_status, metadata, created_at")
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
      .select("id, action, actor_id, notes, previous_status, new_status, metadata, created_at")
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
    const header = ["Data/Hora", "Ação", "De", "Para", "Responsável", "Observações", "Metadata"].join(",");
    const lines = (rows ?? []).map((r: any) =>
      [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.action,
        r.previous_status ?? "",
        r.new_status ?? "",
        actors[r.actor_id] ?? r.actor_id ?? "—",
        r.notes ?? "",
        r.metadata ? JSON.stringify(r.metadata) : "",
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

    // Cabeçalho com filtros + paginação atuais (linhas de meta começam com "#")
    const reviewerName = data.reviewerId ? (actors[data.reviewerId] ?? data.reviewerId) : "Todos";
    const submitterName = data.submitterId ? (actors[data.submitterId] ?? data.submitterId) : "Todos";
    const meta = [
      `# Fila de aprovação de imóveis`,
      `# Gerado em,${esc(new Date().toLocaleString("pt-BR"))}`,
      `# Página,${data.page}`,
      `# Tamanho da página,${data.pageSize}`,
      `# Registros nesta página,${rows?.length ?? 0}`,
      `# Status,${esc(statuses.join(", "))}`,
      `# Busca,${esc(data.search ?? "—")}`,
      `# Revisor,${esc(reviewerName)}`,
      `# Submetido por,${esc(submitterName)}`,
      `# Data de,${esc(data.dateFrom ? new Date(data.dateFrom).toLocaleString("pt-BR") : "—")}`,
      `# Data até,${esc(data.dateTo ? new Date(data.dateTo).toLocaleString("pt-BR") : "—")}`,
    ].join("\n");

    return {
      filename: `fila-aprovacao-p${data.page}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [meta, "", header, ...lines].join("\n"),
      total: rows?.length ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

// Structured queue export — same validator/filters as listApprovalQueue,
// returned as typed rows so the print/PDF page does not have to parse CSV.
export const getApprovalQueueForExport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BatchExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const statuses: Array<"pending" | "changes_requested" | "rejected" | "approved"> =
      data.status?.length ? data.status : ["pending", "changes_requested", "rejected"];

    let q = context.supabase
      .from("realestate_properties")
      .select(
        "id, reference_code, title, operation, property_type, sale_price, rent_price, neighborhood, city, approval_status, submitted_for_review_at, submitted_by, reviewed_by, reviewed_at, review_notes",
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

    const userIds = Array.from(new Set((rows ?? []).flatMap((r: any) => [r.reviewed_by, r.submitted_by]).filter(Boolean) as string[]));
    let actors: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await context.supabase
        .from("user_profiles").select("user_id, display_name, email").in("user_id", userIds);
      for (const p of (profiles ?? []) as any[]) {
        actors[p.user_id] = p.display_name || p.email || "Usuário";
      }
    }

    return {
      items: rows ?? [],
      actors,
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      filters: {
        status: statuses,
        search: data.search ?? null,
        reviewerId: data.reviewerId ?? null,
        submitterId: data.submitterId ?? null,
        dateFrom: data.dateFrom ?? null,
        dateTo: data.dateTo ?? null,
      },
      generatedAt: new Date().toISOString(),
    };
  });


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


// ============ Phase A: Campanhas & Disparo ============
const BlastFilter = z.object({
  operation: OperationEnum.optional(),
  cities: z.array(z.string().max(120)).max(20).default([]),
  neighborhoods: z.array(z.string().max(120)).max(40).default([]),
  property_types: z.array(PropertyTypeEnum).max(13).default([]),
  price_max: z.number().nonnegative().nullable().optional(),
  price_min: z.number().nonnegative().nullable().optional(),
  bedrooms_min: z.number().int().min(0).max(20).default(0),
});

const DispatchBlastInput = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  channel: z.enum(["whatsapp", "email"]),
  filter: BlastFilter,
  body: z.string().min(1).max(4000),
  subject: z.string().max(200).optional(),
  propertyId: z.string().uuid().optional().nullable(),
});

function intentMatchesFilter(intent: any, f: z.infer<typeof BlastFilter>): boolean {
  if (f.operation && intent.operation && intent.operation !== f.operation && intent.operation !== "venda_ou_locacao") return false;
  if (f.property_types.length > 0) {
    const it = intent.property_types ?? [];
    if (it.length > 0 && !f.property_types.some((t) => it.includes(t))) return false;
  }
  if (f.cities.length > 0) {
    const ic = intent.cities ?? [];
    if (ic.length > 0 && !f.cities.some((c) => ic.includes(c))) return false;
  }
  if (f.neighborhoods.length > 0) {
    const inb = intent.neighborhoods ?? [];
    if (inb.length > 0 && !f.neighborhoods.some((n) => inb.includes(n))) return false;
  }
  if (f.price_max != null && intent.price_min != null && intent.price_min > f.price_max) return false;
  if (f.price_min != null && intent.price_max != null && intent.price_max < f.price_min) return false;
  if (f.bedrooms_min > 0 && intent.bedrooms_min != null && intent.bedrooms_min > 0 && intent.bedrooms_min < f.bedrooms_min) return false;
  return true;
}

export const previewRealestateBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid(), filter: BlastFilter, channel: z.enum(["whatsapp", "email"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: intents, error } = await context.supabase
      .from("realestate_search_intents")
      .select("id,contact_name,contact_email,contact_phone,whatsapp,operation,property_types,cities,neighborhoods,price_min,price_max,bedrooms_min,consent_marketing,status")
      .eq("company_id", data.companyId)
      .eq("status", "ativo")
      .eq("consent_marketing", true);
    if (error) throw new Error(error.message);
    const matches = (intents ?? []).filter((i: any) => intentMatchesFilter(i, data.filter));
    const eligible = matches.filter((i: any) =>
      data.channel === "whatsapp" ? !!(i.whatsapp || i.contact_phone) : !!i.contact_email,
    );
    return { total: intents?.length ?? 0, matched: matches.length, eligible: eligible.length };
  });

export const dispatchRealestateBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DispatchBlastInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: blast, error: bErr } = await context.supabase
      .from("realestate_blasts")
      .insert({
        company_id: data.companyId,
        property_id: data.propertyId ?? null,
        title: data.title,
        channel: data.channel,
        filter: data.filter as any,
        body: data.body,
        status: "queued",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (bErr || !blast) throw new Error(bErr?.message ?? "Falha ao registrar disparo");

    const { data: intents, error: iErr } = await context.supabase
      .from("realestate_search_intents")
      .select("id,contact_name,contact_email,contact_phone,whatsapp,operation,property_types,cities,neighborhoods,price_min,price_max,bedrooms_min,consent_marketing,status")
      .eq("company_id", data.companyId)
      .eq("status", "ativo")
      .eq("consent_marketing", true);
    if (iErr) throw new Error(iErr.message);

    const matches = (intents ?? []).filter((i: any) => intentMatchesFilter(i, data.filter));
    const eligible = matches.filter((i: any) =>
      data.channel === "whatsapp" ? !!(i.whatsapp || i.contact_phone) : !!i.contact_email,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = eligible.slice(0, 500).map((i: any) => ({
      channel: data.channel,
      event_code: "realestate.blast",
      company_id: data.companyId,
      reference_type: "realestate_blast",
      reference_id: blast.id,
      recipient_phone: data.channel === "whatsapp" ? (i.whatsapp || i.contact_phone) : null,
      recipient_email: data.channel === "email" ? i.contact_email : null,
      recipient_name: i.contact_name,
      subject: data.subject ?? null,
      body: data.body,
      status: "queued",
      payload: { intent_id: i.id, property_id: data.propertyId ?? null },
    }));

    let enqueued = 0;
    if (rows.length > 0) {
      const { error: oErr, count } = await supabaseAdmin
        .from("message_outbox")
        .insert(rows, { count: "exact" });
      if (oErr) {
        await context.supabase.from("realestate_blasts")
          .update({ status: "failed", audience_count: matches.length })
          .eq("id", blast.id);
        throw new Error(oErr.message);
      }
      enqueued = count ?? rows.length;
      const intentIds = eligible.slice(0, 500).map((i: any) => i.id);
      if (intentIds.length > 0) {
        await context.supabase.from("realestate_search_intents")
          .update({ last_blast_at: new Date().toISOString() })
          .in("id", intentIds);
      }
    }

    await context.supabase.from("realestate_blasts")
      .update({
        audience_count: matches.length,
        enqueued_count: enqueued,
        status: enqueued > 0 ? "completed" : "queued",
      })
      .eq("id", blast.id);

    return { blastId: blast.id, matched: matches.length, eligible: eligible.length, enqueued };
  });

export const listRealestateBlasts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_blasts")
      .select("id,title,channel,property_id,filter,audience_count,enqueued_count,sent_count,failed_count,status,created_at")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { blasts: rows ?? [] };
  });

export const fetchRealestateReturnReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: blasts }, { data: interests }] = await Promise.all([
      context.supabase.from("realestate_blasts")
        .select("id,enqueued_count,channel,created_at,property_id,title")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.from("realestate_interests")
        .select("id,source,property_id,created_at,status")
        .eq("company_id", data.companyId)
        .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()),
    ]);

    const ids = (blasts ?? []).map((b: any) => b.id);
    const outboxStats: Record<string, { sent: number; failed: number; queued: number }> = {};
    if (ids.length > 0) {
      const { data: outRows } = await supabaseAdmin
        .from("message_outbox")
        .select("reference_id,status")
        .eq("reference_type", "realestate_blast")
        .in("reference_id", ids);
      for (const r of outRows ?? []) {
        const k = r.reference_id as string;
        outboxStats[k] ||= { sent: 0, failed: 0, queued: 0 };
        if (r.status === "sent") outboxStats[k].sent++;
        else if (r.status === "failed") outboxStats[k].failed++;
        else outboxStats[k].queued++;
      }
    }

    const totalEnqueued = (blasts ?? []).reduce((s: number, b: any) => s + (b.enqueued_count ?? 0), 0);
    const totalSent = Object.values(outboxStats).reduce((s, v) => s + v.sent, 0);
    const totalFailed = Object.values(outboxStats).reduce((s, v) => s + v.failed, 0);
    const newInterests = (interests ?? []).length;

    return {
      kpis: {
        blasts: blasts?.length ?? 0,
        enqueued: totalEnqueued,
        delivered: totalSent,
        failed: totalFailed,
        newInterests,
        conversionPct: totalSent > 0 ? Math.round((newInterests / totalSent) * 1000) / 10 : 0,
      },
      blasts: (blasts ?? []).map((b: any) => ({
        ...b,
        delivered: outboxStats[b.id]?.sent ?? 0,
        failedReal: outboxStats[b.id]?.failed ?? 0,
        queued: outboxStats[b.id]?.queued ?? 0,
      })),
    };
  });


// ============ Phase C: Demo seed ============
export const seedRealestateDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const DEMO_TAG = "DEMO-IMOB";

    // Properties (6)
    const props = [
      { title: "Apto 2 dorm · Vila Mariana", reference_code: `${DEMO_TAG}-001`, operation: "venda", property_type: "apartamento", sale_price: 680000, bedrooms: 2, bathrooms: 1, parking_spots: 1, area_useful: 62, city: "São Paulo", neighborhood: "Vila Mariana", state: "SP" },
      { title: "Casa 3 dorm · Tatuapé", reference_code: `${DEMO_TAG}-002`, operation: "venda", property_type: "casa", sale_price: 1200000, bedrooms: 3, suites: 1, bathrooms: 2, parking_spots: 2, area_useful: 140, city: "São Paulo", neighborhood: "Tatuapé", state: "SP" },
      { title: "Studio mobiliado · Pinheiros", reference_code: `${DEMO_TAG}-003`, operation: "locacao", property_type: "studio", rent_price: 3200, condo_fee: 600, bedrooms: 1, bathrooms: 1, area_useful: 32, city: "São Paulo", neighborhood: "Pinheiros", state: "SP" },
      { title: "Cobertura · Moema", reference_code: `${DEMO_TAG}-004`, operation: "venda_ou_locacao", property_type: "cobertura", sale_price: 2400000, rent_price: 12000, bedrooms: 3, suites: 2, bathrooms: 3, parking_spots: 3, area_useful: 220, city: "São Paulo", neighborhood: "Moema", state: "SP" },
      { title: "Sala comercial · Berrini", reference_code: `${DEMO_TAG}-005`, operation: "locacao", property_type: "sala_comercial", rent_price: 5500, area_useful: 48, city: "São Paulo", neighborhood: "Brooklin", state: "SP" },
      { title: "Casa em condomínio · Alphaville", reference_code: `${DEMO_TAG}-006`, operation: "venda", property_type: "casa_condominio", sale_price: 2800000, bedrooms: 4, suites: 3, bathrooms: 4, parking_spots: 4, area_useful: 320, city: "Barueri", neighborhood: "Alphaville", state: "SP" },
    ];
    await sb.from("realestate_properties").insert(
      props.map((p) => ({
        ...p,
        company_id: data.companyId,
        status: "ativo",
        is_published: true,
        approval_status: "approved",
        features: [],
        photos: [],
        created_by: context.userId,
      })) as any,
    );

    // Search intents (4)
    const intents = [
      { contact_name: "Demo · Família Silva", contact_email: "silva.demo@example.com", whatsapp: "11999990001", operation: "venda", property_types: ["apartamento", "cobertura"], price_max: 800000, bedrooms_min: 2, cities: ["São Paulo"], neighborhoods: ["Vila Mariana", "Moema"] },
      { contact_name: "Demo · João Investidor", contact_email: "joao.demo@example.com", whatsapp: "11999990002", operation: "venda", property_types: ["sala_comercial"], price_max: 1500000, cities: ["São Paulo"] },
      { contact_name: "Demo · Maria Aluguel", contact_email: "maria.demo@example.com", whatsapp: "11999990003", operation: "locacao", property_types: ["studio", "apartamento"], price_max: 4000, cities: ["São Paulo"], neighborhoods: ["Pinheiros"] },
      { contact_name: "Demo · Casal Costa", contact_email: "costa.demo@example.com", whatsapp: "11999990004", operation: "venda", property_types: ["casa", "casa_condominio"], price_max: 3000000, bedrooms_min: 3, cities: ["São Paulo", "Barueri"] },
    ];
    await sb.from("realestate_search_intents").insert(
      intents.map((i) => ({
        ...i,
        company_id: data.companyId,
        status: "ativo",
        consent_marketing: true,
        channel: "whatsapp",
        notes: DEMO_TAG,
        created_by: context.userId,
      })) as any,
    );

    // Partner brokers (2)
    await sb.from("realestate_partner_brokers").insert([
      { company_id: data.companyId, broker_name: "Demo · Corretor Ana", email: "ana.demo@example.com", phone: "11988880001", status: "active", contract_started_at: new Date().toISOString(), notes: DEMO_TAG, created_by: context.userId },
      { company_id: data.companyId, broker_name: "Demo · Corretor Bruno", email: "bruno.demo@example.com", phone: "11988880002", status: "pending", notes: DEMO_TAG, created_by: context.userId },
    ] as any);

    return { ok: true, properties: props.length, intents: intents.length, brokers: 2 };
  });

export const removeRealestateDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    await sb.from("realestate_properties").delete().eq("company_id", data.companyId).like("reference_code", "DEMO-IMOB-%");
    await sb.from("realestate_search_intents").delete().eq("company_id", data.companyId).eq("notes", "DEMO-IMOB");
    await sb.from("realestate_partner_brokers").delete().eq("company_id", data.companyId).eq("notes", "DEMO-IMOB");
    return { ok: true };
  });

