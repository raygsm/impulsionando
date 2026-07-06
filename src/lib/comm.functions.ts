/**
 * Centro de Comunicação — Impulsionando.
 *
 * Server functions expostas ao app:
 *  - emitCommEvent: enfileira dispatches para um evento (usado por hooks do
 *    ciclo comercial e pelo botão "reenviar" da UI).
 *  - listDispatches / getDispatchTimeline: leitura para a UI admin.
 *  - retryDispatch / cancelDispatch: ações da UI.
 *  - listEvents / listTemplates / upsertTemplate: catálogo e templates.
 *  - listChannelConfigs / upsertChannelConfig: config por tenant × canal.
 *  - runCommTick: worker que processa a fila (chamado pelo cron público).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
type SB = { from: (t: string) => any };

async function assertAdmin(supabase: SB, userId: string) {
  const { data } = await (supabase as any).rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

async function resolveTemplate(
  supabase: SB,
  eventCode: string,
  channel: string,
  companyId: string | null,
  nicheCode: string | null,
) {
  // tenant → nicho → global
  if (companyId) {
    const { data: t } = await (supabase as any)
      .from("core_comm_templates")
      .select("id, subject, body_md, body_html")
      .eq("event_code", eventCode).eq("channel", channel).eq("scope", "tenant")
      .eq("company_id", companyId).eq("active", true).maybeSingle();
    if (t) return t;
  }
  if (nicheCode) {
    const { data: t } = await (supabase as any)
      .from("core_comm_templates")
      .select("id, subject, body_md, body_html")
      .eq("event_code", eventCode).eq("channel", channel).eq("scope", "niche")
      .eq("niche_code", nicheCode).eq("active", true).maybeSingle();
    if (t) return t;
  }
  const { data: g } = await (supabase as any)
    .from("core_comm_templates")
    .select("id, subject, body_md, body_html")
    .eq("event_code", eventCode).eq("channel", channel).eq("scope", "global")
    .eq("active", true).maybeSingle();
  return g ?? null;
}

// -----------------------------------------------------------------------------
// emitCommEvent
// -----------------------------------------------------------------------------
const emitSchema = z.object({
  eventCode: z.string().min(1),
  companyId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  channels: z.array(z.enum(["whatsapp","email","impulsionito","notification","push","n8n"])).optional(),
  destination: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional(),
  origin: z.string().optional(),
  originRef: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  nicheCode: z.string().optional().nullable(),
});

export const emitCommEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => emitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as SB;

    const { data: evt, error: evtErr } = await (supabase as any)
      .from("core_comm_events")
      .select("code, default_channels, default_priority, active")
      .eq("code", data.eventCode).maybeSingle();
    if (evtErr) throw new Error(evtErr.message);
    if (!evt || !evt.active) throw new Error(`event_not_found_or_inactive:${data.eventCode}`);

    const channels = (data.channels ?? evt.default_channels ?? []) as string[];
    if (channels.length === 0) return { ok: true, inserted: 0, skipped_reason: "no_channels" };

    const inserted: string[] = [];
    for (const channel of channels) {
      const tpl = await resolveTemplate(
        supabase, data.eventCode, channel, data.companyId ?? null, data.nicheCode ?? null,
      );
      const row = {
        event_code: data.eventCode,
        company_id: data.companyId ?? null,
        user_id: data.userId ?? null,
        channel,
        status: "queued",
        priority: evt.default_priority,
        payload: data.payload ?? {},
        resolved_template_id: tpl?.id ?? null,
        origin: data.origin ?? "system",
        origin_ref: data.originRef ?? null,
        destination: data.destination ?? null,
        idempotency_key: data.idempotencyKey ? `${data.idempotencyKey}:${channel}` : null,
      };
      const { data: ins, error } = await (supabase as any)
        .from("core_comm_dispatches").insert(row).select("id").maybeSingle();
      if (error) {
        // idempotência: 23505 → duplicate; ignoramos silenciosamente
        if (!/duplicate/i.test(error.message)) throw new Error(error.message);
        continue;
      }
      if (ins?.id) {
        inserted.push(ins.id);
        await (supabase as any).from("core_comm_delivery_events").insert({
          dispatch_id: ins.id, event_type: "queued", channel, payload: { origin: row.origin },
        });
      }
    }
    return { ok: true, inserted: inserted.length, dispatch_ids: inserted };
  });

// -----------------------------------------------------------------------------
// listDispatches
// -----------------------------------------------------------------------------
const listSchema = z.object({
  status: z.string().optional(),
  channel: z.string().optional(),
  eventCode: z.string().optional(),
  companyId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  originRef: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export const listDispatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    let q = supabase.from("core_comm_dispatches")
      .select("id, event_code, company_id, user_id, channel, status, priority, attempts, max_attempts, next_retry_at, last_error, destination, origin, origin_ref, provider_message_id, sent_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    if (data.channel) q = q.eq("channel", data.channel);
    if (data.eventCode) q = q.eq("event_code", data.eventCode);
    if (data.companyId) q = q.eq("company_id", data.companyId);
    if (data.userId) q = q.eq("user_id", data.userId);
    if (data.originRef) q = q.eq("origin_ref", data.originRef);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const getDispatchTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dispatchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const [{ data: dispatch }, { data: events }] = await Promise.all([
      supabase.from("core_comm_dispatches").select("*").eq("id", data.dispatchId).maybeSingle(),
      supabase.from("core_comm_delivery_events").select("*").eq("dispatch_id", data.dispatchId).order("created_at", { ascending: true }),
    ]);
    if (!dispatch) throw new Error("dispatch_not_found");
    return { dispatch, events: events ?? [] };
  });

// -----------------------------------------------------------------------------
// retry / cancel
// -----------------------------------------------------------------------------
export const retryDispatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dispatchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    await assertAdmin(supabase, context.userId);
    const { error } = await supabase.from("core_comm_dispatches").update({
      status: "queued", next_retry_at: null, last_error: null,
    }).eq("id", data.dispatchId);
    if (error) throw new Error(error.message);
    await supabase.from("core_comm_delivery_events").insert({
      dispatch_id: data.dispatchId, event_type: "resent_by_admin", actor_user_id: context.userId,
    });
    return { ok: true };
  });

export const cancelDispatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dispatchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    await assertAdmin(supabase, context.userId);
    const { error } = await supabase.from("core_comm_dispatches").update({
      status: "cancelled", next_retry_at: null,
    }).eq("id", data.dispatchId);
    if (error) throw new Error(error.message);
    await supabase.from("core_comm_delivery_events").insert({
      dispatch_id: data.dispatchId, event_type: "cancelled_by_admin", actor_user_id: context.userId,
    });
    return { ok: true };
  });

// -----------------------------------------------------------------------------
// catálogo & templates
// -----------------------------------------------------------------------------
export const listCommEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const { data, error } = await supabase.from("core_comm_events")
      .select("*").order("category").order("code");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const listCommTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    eventCode: z.string().optional(), companyId: z.string().uuid().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    let q = supabase.from("core_comm_templates").select("*")
      .order("event_code").order("channel").order("scope");
    if (data.eventCode) q = q.eq("event_code", data.eventCode);
    if (data.companyId) q = q.eq("company_id", data.companyId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

const upsertTplSchema = z.object({
  id: z.string().uuid().optional(),
  eventCode: z.string(),
  channel: z.enum(["whatsapp","email","impulsionito","notification","push","n8n"]),
  scope: z.enum(["global","niche","tenant"]),
  nicheCode: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  locale: z.string().default("pt-BR"),
  subject: z.string().optional().nullable(),
  bodyMd: z.string().optional().nullable(),
  bodyHtml: z.string().optional().nullable(),
  active: z.boolean().default(true),
});
export const upsertCommTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertTplSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    await assertAdmin(supabase, context.userId);
    const row = {
      event_code: data.eventCode, channel: data.channel, scope: data.scope,
      niche_code: data.nicheCode ?? null, company_id: data.companyId ?? null,
      locale: data.locale, subject: data.subject ?? null,
      body_md: data.bodyMd ?? null, body_html: data.bodyHtml ?? null,
      active: data.active, updated_by: context.userId,
    };
    if (data.id) {
      const { error } = await supabase.from("core_comm_templates").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: ins, error } = await supabase.from("core_comm_templates").insert(row).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins?.id };
  });

// -----------------------------------------------------------------------------
// canais por tenant
// -----------------------------------------------------------------------------
export const listChannelConfigs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    let q = supabase.from("core_comm_channel_config").select("*").order("company_id").order("channel");
    if (data.companyId) q = q.eq("company_id", data.companyId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

const chSchema = z.object({
  companyId: z.string().uuid(),
  channel: z.enum(["whatsapp","email","impulsionito","notification","push","n8n"]),
  enabled: z.boolean().default(true),
  provider: z.string().optional().nullable(),
  n8nWebhookUrl: z.string().url().optional().nullable(),
  n8nSecretRef: z.string().optional().nullable(),
  fallbackChannel: z.enum(["whatsapp","email","impulsionito","notification","push","n8n"]).optional().nullable(),
  rateLimitPerMin: z.number().int().min(1).max(10000).default(60),
});
export const upsertChannelConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => chSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    await assertAdmin(supabase, context.userId);
    const row = {
      company_id: data.companyId, channel: data.channel, enabled: data.enabled,
      provider: data.provider ?? null, n8n_webhook_url: data.n8nWebhookUrl ?? null,
      n8n_secret_ref: data.n8nSecretRef ?? null, fallback_channel: data.fallbackChannel ?? null,
      rate_limit_per_min: data.rateLimitPerMin,
    };
    const { error } = await supabase.from("core_comm_channel_config")
      .upsert(row, { onConflict: "company_id,channel" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -----------------------------------------------------------------------------
// worker: runCommTick foi extraído para src/lib/comm/tick.server.ts para não
// arrastar `crypto` e os adapters server-only para o bundle do cliente.
// A rota pública /api/public/comm/tick importa direto de lá.
// -----------------------------------------------------------------------------

