import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMarocasApartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_apartments")
      .select("*, marocas_owners(full_name,email,phone,pix_key)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listMarocasServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { apartmentId?: string } = {}) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("marocas_services")
      .select("*, marocas_apartments(code,title), marocas_professionals(full_name,role)")
      .order("scheduled_for", { ascending: false })
      .limit(200);
    if (data?.apartmentId) q = q.eq("apartment_id", data.apartmentId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const listMarocasSupplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { apartmentId?: string } = {}) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("marocas_supplies")
      .select("*, marocas_apartments(code,title)")
      .order("category", { ascending: true });
    if (data?.apartmentId) q = q.eq("apartment_id", data.apartmentId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const listMarocasMaintenance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_maintenance_requests")
      .select("*, marocas_apartments(code,title), marocas_maintenance_quotes(id,amount,estimated_hours,status,marocas_professionals(full_name,role))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listMarocasOwnerStatements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_owner_statements")
      .select("*, marocas_owners(full_name,pix_key), marocas_apartments(code,title)")
      .order("reference_month", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const ServiceStatusEnum = z.enum(["agendado","em_andamento","concluido","cancelado","atrasado"]);
export const updateMarocasServiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: z.infer<typeof ServiceStatusEnum> }) =>
    z.object({ id: z.string().uuid(), status: ServiceStatusEnum }).parse(d))
  .handler(async ({ context, data }) => {
    const patch: { status: typeof data.status; started_at?: string; completed_at?: string } = { status: data.status };
    if (data.status === "em_andamento") patch.started_at = new Date().toISOString();
    if (data.status === "concluido") patch.completed_at = new Date().toISOString();
    const { error } = await context.supabase.from("marocas_services").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const marcarRepasseMarocas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; pixTxid?: string }) =>
    z.object({ id: z.string().uuid(), pixTxid: z.string().max(64).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("marocas_owner_statements")
      .update({ status: "pago", paid_at: new Date().toISOString(), pix_txid: data.pixTxid ?? null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// SLA padrão por tipo de serviço (em minutos)
export const MAROCAS_SLA_MINUTES: Record<string, number> = {
  limpeza: 120,
  enxoval: 60,
  manutencao: 180,
  vistoria: 45,
  check_in: 30,
  check_out: 30,
  lavanderia: 90,
  reposicao: 45,
};

const ChecklistItem = z.object({
  label: z.string().min(1).max(140),
  done: z.boolean(),
});

export const updateMarocasServiceChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    checklist?: Array<{ label: string; done: boolean }>;
    photos_before?: string[];
    photos_after?: string[];
    notes?: string;
  }) =>
    z.object({
      id: z.string().uuid(),
      checklist: z.array(ChecklistItem).max(50).optional(),
      photos_before: z.array(z.string().url()).max(20).optional(),
      photos_after: z.array(z.string().url()).max(20).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const patch: {
      checklist?: { label: string; done: boolean }[];
      photos_before?: string[];
      photos_after?: string[];
      notes?: string;
    } = {};
    if (data.checklist) patch.checklist = data.checklist;
    if (data.photos_before) patch.photos_before = data.photos_before;
    if (data.photos_after) patch.photos_after = data.photos_after;
    if (typeof data.notes === "string") patch.notes = data.notes;
    const { error } = await context.supabase
      .from("marocas_services")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Pedido automático de suprimentos: usa o campo `notes` como JSON com o estado do pedido
type SupplyOrder = {
  status: "pendente" | "aprovado" | "recebido";
  qty: number;
  requested_at: string;
  approved_at?: string;
  received_at?: string;
};

function parseOrder(notes: string | null | undefined): SupplyOrder | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed.order) return parsed.order as SupplyOrder;
  } catch { /* not json */ }
  return null;
}

export const requestMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; qty: number }) =>
    z.object({ id: z.string().uuid(), qty: z.number().int().positive().max(9999) }).parse(d))
  .handler(async ({ context, data }) => {
    const order: SupplyOrder = {
      status: "pendente",
      qty: data.qty,
      requested_at: new Date().toISOString(),
    };
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({ notes: JSON.stringify({ order }) })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const approveMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from("marocas_supplies")
      .select("notes")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw rErr;
    const order = parseOrder(row?.notes);
    if (!order) throw new Error("Pedido não encontrado");
    order.status = "aprovado";
    order.approved_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({ notes: JSON.stringify({ order }) })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const receiveMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from("marocas_supplies")
      .select("notes,current_qty")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw rErr;
    const order = parseOrder(row?.notes);
    if (!order) throw new Error("Pedido não encontrado");
    order.status = "recebido";
    order.received_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({
        notes: JSON.stringify({ order }),
        current_qty: Number(row?.current_qty ?? 0) + order.qty,
        last_restocked_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// === Upload de fotos no bucket marocas-fotos ===
export const createMarocasPhotoUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string; kind: "before" | "after"; filename: string }) =>
    z.object({
      serviceId: z.string().uuid(),
      kind: z.enum(["before", "after"]),
      filename: z.string().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/, "filename inválido"),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const path = `services/${data.serviceId}/${data.kind}/${Date.now()}-${data.filename}`;
    const { data: signed, error } = await context.supabase.storage
      .from("marocas-fotos")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const getMarocasPhotoSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) =>
    z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("marocas-fotos")
      .createSignedUrl(data.path, 60 * 60); // 1h
    if (error) throw error;
    return { url: signed.signedUrl };
  });

// === Auditoria de checklist (usa public.audit_logs) ===
export const logMarocasServiceAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    serviceId: string;
    action: string;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  }) => z.object({
    serviceId: z.string().uuid(),
    action: z.string().min(1).max(80),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("audit_logs").insert({
      entity: "marocas_service",
      entity_id: data.serviceId,
      action: data.action,
      before: (data.before ?? null) as never,
      after: (data.after ?? null) as never,
      metadata: (data.metadata ?? {}) as never,
      user_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listMarocasServiceAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string }) =>
    z.object({ serviceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("audit_logs")
      .select("id, action, before, after, metadata, user_email, user_id, created_at")
      .eq("entity", "marocas_service")
      .eq("entity_id", data.serviceId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return rows ?? [];
  });

// === Alertas SLA (notificações no cockpit) ===
export const createMarocasSlaAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string; severity: "warning" | "late"; message: string }) =>
    z.object({
      serviceId: z.string().uuid(),
      severity: z.enum(["warning", "late"]),
      message: z.string().min(1).max(500),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("notifications").insert({
      user_id: context.userId,
      category: "marocas_sla",
      severity: data.severity === "late" ? "critical" : "warning",
      title: data.severity === "late" ? "SLA estourado — Marocas" : "SLA chegando ao limite — Marocas",
      message: data.message,
      action_label: "Abrir cockpit",
      action_url: "/marocas/cockpit",
    });
    if (error) throw error;
    return { ok: true };
  });

export const listMarocasSlaAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, severity, title, message, action_url, is_read, created_at")
      .eq("category", "marocas_sla")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

// === Auditoria por período (cockpit-wide) ===
export const listMarocasAuditByPeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string; apartmentId?: string; professionalId?: string }) =>
    z.object({
      from: z.string().datetime().or(z.string().min(10)),
      to: z.string().datetime().or(z.string().min(10)),
      apartmentId: z.string().uuid().optional(),
      professionalId: z.string().uuid().optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertMarocasAuthorized(context.supabase, context.userId);
    // 1) buscar serviços do período (com apto/prestador)
    let svcQ = context.supabase
      .from("marocas_services")
      .select("id, service_type, status, scheduled_for, apartment_id, professional_id, marocas_apartments(code,title), marocas_professionals(full_name,role)")
      .gte("scheduled_for", new Date(data.from).toISOString())
      .lte("scheduled_for", new Date(data.to).toISOString());
    if (data.apartmentId) svcQ = svcQ.eq("apartment_id", data.apartmentId);
    if (data.professionalId) svcQ = svcQ.eq("professional_id", data.professionalId);
    const { data: services, error: sErr } = await svcQ;
    if (sErr) throw sErr;
    const ids = (services ?? []).map((s) => s.id);
    if (ids.length === 0) return { services: [], events: [] };

    const { data: events, error: eErr } = await context.supabase
      .from("audit_logs")
      .select("id, entity_id, action, before, after, metadata, user_email, user_id, created_at")
      .eq("entity", "marocas_service")
      .in("entity_id", ids)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (eErr) throw eErr;
    return { services: services ?? [], events: events ?? [] };
  });

// === Envio manual de relatório (gera notificações por canal) ===
export const sendMarocasReportNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: "dia" | "semana"; from: string; to: string; channels: Array<"cockpit" | "whatsapp" | "email"> }) =>
    z.object({
      period: z.enum(["dia", "semana"]),
      from: z.string().min(10),
      to: z.string().min(10),
      channels: z.array(z.enum(["cockpit", "whatsapp", "email"])).min(1),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertMarocasAuthorized(context.supabase, context.userId);
    return await dispatchMarocasReport({
      supabase: context.supabase,
      userId: context.userId,
      period: data.period,
      from: data.from,
      to: data.to,
      channels: data.channels,
      triggeredBy: "manual",
      recipientEmail: context.claims?.email ?? null,
    });
  });

// Núcleo compartilhado de envio — usado pela fn autenticada e pelo hook público (com supabase admin).
export async function dispatchMarocasReport(opts: {
  supabase: any;
  userId: string | null;
  period: "dia" | "semana";
  from: string;
  to: string;
  channels: string[];
  triggeredBy: "manual" | "cron";
  scheduleId?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
}) {
  const { supabase, userId, period, from, to, channels, triggeredBy } = opts;
  const fromIso = new Date(from).toISOString();
  const toIso = new Date(to).toISOString();
  let status: "success" | "error" | "partial" = "success";
  let errorMsg: string | null = null;
  let total = 0, done = 0, late = 0;
  try {
    const { data: svcs, error } = await supabase
      .from("marocas_services")
      .select("id, status, service_type, scheduled_for, started_at")
      .gte("scheduled_for", fromIso)
      .lte("scheduled_for", toIso);
    if (error) throw error;
    total = (svcs ?? []).length;
    done = (svcs ?? []).filter((s: any) => s.status === "concluido").length;
    const now = Date.now();
    late = (svcs ?? []).filter((s: any) => {
      const sla = MAROCAS_SLA_MINUTES[s.service_type] ?? 60;
      if (s.status === "em_andamento" && s.started_at) return (now - new Date(s.started_at).getTime()) / 60000 > sla;
      if (s.status === "agendado") return now > new Date(s.scheduled_for).getTime();
      return false;
    }).length;

    const title = `Relatório ${period === "dia" ? "diário" : "semanal"} — Marocas`;
    const message = `${total} serviços · ${done} concluídos · ${late} atrasados (${new Date(from).toLocaleDateString("pt-BR")} → ${new Date(to).toLocaleDateString("pt-BR")})`;

    // Canal cockpit: notificação direta
    if (channels.includes("cockpit") && userId) {
      const { error: nErr } = await supabase.from("notifications").insert({
        user_id: userId,
        category: "marocas_report",
        severity: "info",
        title,
        message,
        action_label: "Abrir relatório",
        action_url: `/marocas/cockpit/relatorio`,
      });
      if (nErr) { status = "partial"; errorMsg = `cockpit: ${nErr.message}`; }
    }

    // Canais whatsapp/email: enfileirar em message_outbox (worker externo despacha)
    const queued: Array<{ channel: string }> = [];
    for (const ch of channels) {
      if (ch === "cockpit") continue;
      const recipient = ch === "email" ? opts.recipientEmail : opts.recipientPhone;
      const { error: oErr } = await supabase.from("message_outbox").insert({
        event_code: `marocas_report_${period}`,
        channel: ch,
        recipient_email: ch === "email" ? recipient : null,
        recipient_phone: ch === "whatsapp" ? recipient : null,
        recipient_user_id: userId,
        subject: title,
        body: message,
        payload: { period, from: fromIso, to: toIso, total, done, late, triggered_by: triggeredBy },
        status: "pending",
        attempts: 0,
        max_attempts: 3,
        scheduled_at: new Date().toISOString(),
        reference_type: "marocas_report",
      });
      if (oErr) { status = status === "success" ? "partial" : status; errorMsg = `${ch}: ${oErr.message}`; }
      else queued.push({ channel: ch });
    }
  } catch (e: any) {
    status = "error";
    errorMsg = e?.message ?? String(e);
  }

  // Registra histórico (best effort)
  try {
    await supabase.from("marocas_report_runs").insert({
      user_id: userId,
      schedule_id: opts.scheduleId ?? null,
      period,
      range_from: fromIso,
      range_to: toIso,
      channels,
      status,
      total, done, late,
      error: errorMsg,
      triggered_by: triggeredBy,
    });
  } catch { /* silencioso */ }

  return { ok: status !== "error", status, total, done, late, error: errorMsg };
}

// === Autorização Marocas (admin/gestor) ===
async function assertMarocasAuthorized(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_marocas_authorized", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: requer perfil admin ou gestor");
}

// === Schedules de relatórios automáticos ===
export const listMarocasReportSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMarocasAuthorized(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any)
      .from("marocas_report_schedules")
      .select("id, period, hour, weekday, channels, enabled, updated_at")
      .order("period");
    if (error) throw error;
    return data ?? [];
  });

export const upsertMarocasReportSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: "dia" | "semana"; hour: number; weekday?: number | null; channels: string[]; enabled: boolean }) =>
    z.object({
      period: z.enum(["dia", "semana"]),
      hour: z.number().int().min(0).max(23),
      weekday: z.number().int().min(0).max(6).nullable().optional(),
      channels: z.array(z.enum(["cockpit", "whatsapp", "email"])).min(1),
      enabled: z.boolean(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertMarocasAuthorized(context.supabase, context.userId);
    const row = {
      user_id: context.userId,
      period: data.period,
      hour: data.hour,
      weekday: data.period === "semana" ? (data.weekday ?? 1) : null,
      channels: data.channels,
      enabled: data.enabled,
    };
    const { error } = await (context.supabase as any)
      .from("marocas_report_schedules")
      .upsert(row, { onConflict: "user_id,period" });
    if (error) throw error;
    return { ok: true };
  });

export const listMarocasReportRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period?: "dia" | "semana"; limit?: number }) =>
    z.object({
      period: z.enum(["dia", "semana"]).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertMarocasAuthorized(context.supabase, context.userId);
    let q = (context.supabase as any)
      .from("marocas_report_runs")
      .select("id, period, range_from, range_to, channels, status, total, done, late, error, triggered_by, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.period) q = q.eq("period", data.period);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
