/**
 * Adapters do Centro de Comunicação — Impulsionando.
 *
 * Cada função recebe um dispatch já resolvido (com template) e devolve o
 * resultado do envio. Nesta fase, entregamos a arquitetura pronta: adapters
 * de rede real (WhatsApp/e-mail/n8n) marcam `skipped` quando a config do
 * tenant ainda não foi provisionada, e adapters internos
 * (notification/impulsionito/push) já operam.
 *
 * O adapter NUNCA lança — retorna sempre { status, providerMessageId?, error? }
 * para que o worker registre a tentativa em core_comm_delivery_events.
 */
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdapterResult =
  | { status: "sent"; providerMessageId?: string | null; meta?: Record<string, unknown> }
  | { status: "skipped"; reason: string; meta?: Record<string, unknown> }
  | { status: "failed"; error: string; retryable?: boolean; meta?: Record<string, unknown> };

export interface DispatchInput {
  id: string;
  event_code: string;
  company_id: string | null;
  user_id: string | null;
  channel: string;
  destination: string | null;
  payload: Record<string, unknown>;
  subject: string | null;
  body_md: string | null;
  body_html: string | null;
  resolved_template_id: string | null;
}

interface ChannelConfig {
  enabled: boolean;
  provider: string | null;
  provider_config: Record<string, unknown>;
  n8n_webhook_url: string | null;
  n8n_secret_ref: string | null;
  rate_limit_per_min: number;
}

const db = supabaseAdmin as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: unknown) => {
        eq: (col: string, val: unknown) => {
          maybeSingle: () => Promise<{ data: ChannelConfig | null }>;
        };
      };
    };
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

async function loadChannelConfig(companyId: string | null, channel: string): Promise<ChannelConfig | null> {
  if (!companyId) return null;
  const { data } = await db
    .from("core_comm_channel_config")
    .select("enabled, provider, provider_config, n8n_webhook_url, n8n_secret_ref, rate_limit_per_min")
    .eq("company_id", companyId)
    .eq("channel", channel)
    .maybeSingle();
  return data ?? null;
}

function renderTemplate(body: string | null, vars: Record<string, unknown>): string {
  if (!body) return "";
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}

// ---------------------------------------------------------------------------
// notification — grava em public.notifications
// ---------------------------------------------------------------------------
export async function sendNotification(d: DispatchInput): Promise<AdapterResult> {
  if (!d.user_id) return { status: "skipped", reason: "no_user_id" };
  const body = renderTemplate(d.body_md, d.payload);
  const { error } = await db.from("notifications").insert({
    user_id: d.user_id,
    company_id: d.company_id,
    category: d.event_code,
    severity: "info",
    title: d.subject ?? d.event_code,
    message: body || null,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id };
}

// ---------------------------------------------------------------------------
// impulsionito — grava snapshot para o agente reagir
// ---------------------------------------------------------------------------
export async function sendImpulsionito(d: DispatchInput): Promise<AdapterResult> {
  const { error } = await db.from("impulsionito_training_snapshots").insert({
    company_id: d.company_id ?? "00000000-0000-0000-0000-000000000000",
    source: "comm_center",
    metrics: { event_code: d.event_code, dispatch_id: d.id },
    sample: {
      comm_dispatch_id: d.id,
      event_code: d.event_code,
      user_id: d.user_id,
      body: renderTemplate(d.body_md, d.payload),
      subject: d.subject,
      vars: d.payload,
    },
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id };
}

// ---------------------------------------------------------------------------
// e-mail — via message_outbox legado (Lovable Emails plugável no futuro)
// ---------------------------------------------------------------------------
export async function sendEmail(d: DispatchInput): Promise<AdapterResult> {
  if (!d.destination) return { status: "skipped", reason: "no_destination" };
  const cfg = await loadChannelConfig(d.company_id, "email");
  if (!cfg?.enabled) return { status: "skipped", reason: "email_not_configured_for_tenant" };
  const body = renderTemplate(d.body_html ?? d.body_md, d.payload);
  const { error } = await db.from("message_outbox").insert({
    company_id: d.company_id,
    event_code: d.event_code,
    channel: "email",
    recipient_email: d.destination,
    subject: renderTemplate(d.subject, d.payload) || d.event_code,
    body,
    payload: { comm_dispatch_id: d.id, ...d.payload },
    status: "pending",
    scheduled_at: new Date().toISOString(),
    reference_type: "core_comm_dispatch",
    reference_id: d.id,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id, meta: { via: "message_outbox" } };
}

// ---------------------------------------------------------------------------
// WhatsApp — via message_outbox; provider real fica pendente
// ---------------------------------------------------------------------------
export async function sendWhatsApp(d: DispatchInput): Promise<AdapterResult> {
  if (!d.destination) return { status: "skipped", reason: "no_destination_phone" };
  const cfg = await loadChannelConfig(d.company_id, "whatsapp");
  if (!cfg?.enabled) return { status: "skipped", reason: "whatsapp_not_configured_for_tenant" };
  const body = renderTemplate(d.body_md, d.payload);
  const { error } = await db.from("message_outbox").insert({
    company_id: d.company_id,
    event_code: d.event_code,
    channel: "whatsapp",
    recipient_phone: d.destination,
    body,
    payload: { comm_dispatch_id: d.id, ...d.payload },
    status: "pending",
    scheduled_at: new Date().toISOString(),
    reference_type: "core_comm_dispatch",
    reference_id: d.id,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id, meta: { via: "message_outbox" } };
}

// ---------------------------------------------------------------------------
// push — estrutura pronta; sem provider ainda
// ---------------------------------------------------------------------------
export async function sendPush(_d: DispatchInput): Promise<AdapterResult> {
  return { status: "skipped", reason: "push_not_configured" };
}

// ---------------------------------------------------------------------------
// n8n — POST assinado (HMAC) para webhook do tenant
// ---------------------------------------------------------------------------
export async function sendN8n(d: DispatchInput): Promise<AdapterResult> {
  const cfg = await loadChannelConfig(d.company_id, "n8n");
  if (!cfg?.enabled || !cfg.n8n_webhook_url) {
    return { status: "skipped", reason: "n8n_not_configured_for_tenant" };
  }
  const secret = cfg.n8n_secret_ref ? process.env[cfg.n8n_secret_ref] ?? "" : "";
  const body = JSON.stringify({
    dispatch_id: d.id,
    event_code: d.event_code,
    company_id: d.company_id,
    user_id: d.user_id,
    destination: d.destination,
    subject: d.subject,
    body_md: d.body_md,
    payload: d.payload,
    ts: new Date().toISOString(),
  });
  const signature = secret ? createHmac("sha256", secret).update(body).digest("hex") : "";
  try {
    const resp = await fetch(cfg.n8n_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Impulsionando-Signature": signature,
        "X-Impulsionando-Event": d.event_code,
      },
      body,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { status: "failed", error: `n8n_http_${resp.status}: ${txt.slice(0, 500)}`, retryable: resp.status >= 500 };
    }
    const respJson = (await resp.json().catch(() => ({}))) as { execution_id?: string };
    return { status: "sent", providerMessageId: respJson?.execution_id ?? null, meta: { http: resp.status } };
  } catch (err) {
    return { status: "failed", error: `n8n_fetch_error: ${(err as Error).message}`, retryable: true };
  }
}

// ---------------------------------------------------------------------------
// dispatch por canal
// ---------------------------------------------------------------------------
export async function dispatchByChannel(d: DispatchInput): Promise<AdapterResult> {
  switch (d.channel) {
    case "notification": return sendNotification(d);
    case "impulsionito": return sendImpulsionito(d);
    case "email":        return sendEmail(d);
    case "whatsapp":     return sendWhatsApp(d);
    case "push":         return sendPush(d);
    case "n8n":          return sendN8n(d);
    default:             return { status: "skipped", reason: `unknown_channel:${d.channel}` };
  }
}
