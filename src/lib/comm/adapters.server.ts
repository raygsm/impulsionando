/**
 * Adapters do Centro de Comunicação — Impulsionando.
 * Fontes canônicas live:
 * - email: message_outbox -> fila global de e-mail
 * - canais externos: communication_channel_endpoints
 * - n8n: n8n_workflow_registry
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

type Endpoint = {
  provider: string | null;
  status: string;
  address: string | null;
  secret_reference: string | null;
  config: Record<string, unknown> | null;
};

function renderTemplate(body: string | null, vars: Record<string, unknown>): string {
  if (!body) return "";
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}

async function loadActiveEndpoint(companyId: string | null, channel: string): Promise<Endpoint | null> {
  if (!companyId) return null;
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("communication_tenants")
    .select("id")
    .eq("company_id", companyId)
    .maybeSingle();
  if (tenantError || !tenant?.id) return null;

  const { data, error } = await supabaseAdmin
    .from("communication_channel_endpoints")
    .select("provider,status,address,secret_reference,config")
    .eq("tenant_id", tenant.id)
    .eq("channel", channel)
    .eq("status", "ACTIVE")
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as Endpoint | null) ?? null;
}

export async function sendNotification(d: DispatchInput): Promise<AdapterResult> {
  if (!d.user_id) return { status: "skipped", reason: "no_user_id" };
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: d.user_id,
    company_id: d.company_id,
    category: d.event_code,
    severity: "info",
    title: d.subject ?? d.event_code,
    message: renderTemplate(d.body_md, d.payload) || null,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id };
}

export async function sendImpulsionito(d: DispatchInput): Promise<AdapterResult> {
  const { error } = await supabaseAdmin.from("impulsionito_training_snapshots").insert({
    company_id: d.company_id ?? "00000000-0000-0000-0000-000000000000",
    source: "comm_center",
    metrics: { event_code: d.event_code, dispatch_id: d.id },
    sample: { comm_dispatch_id: d.id, event_code: d.event_code, user_id: d.user_id, body: renderTemplate(d.body_md, d.payload), subject: d.subject, vars: d.payload },
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id };
}

export async function sendEmail(d: DispatchInput): Promise<AdapterResult> {
  if (!d.destination) return { status: "skipped", reason: "no_destination" };
  const { error } = await supabaseAdmin.from("message_outbox").insert({
    company_id: d.company_id,
    event_code: d.event_code,
    channel: "email",
    recipient_email: d.destination,
    subject: renderTemplate(d.subject, d.payload) || d.event_code,
    body: renderTemplate(d.body_html ?? d.body_md, d.payload),
    payload: { comm_dispatch_id: d.id, purpose: d.payload.purpose ?? "transactional", ...d.payload },
    status: "queued",
    scheduled_at: new Date().toISOString(),
    reference_type: "core_comm_dispatch",
    reference_id: d.id,
    idempotency_key: `core-comm-email-${d.id}`,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id, meta: { via: "message_outbox", outbox_state: "queued" } };
}

export async function sendWhatsApp(d: DispatchInput): Promise<AdapterResult> {
  if (!d.destination) return { status: "skipped", reason: "no_destination_phone" };
  const endpoint = await loadActiveEndpoint(d.company_id, "whatsapp");
  if (!endpoint) return { status: "skipped", reason: "whatsapp_endpoint_not_active" };
  if (!endpoint.provider || endpoint.provider === "unbound") return { status: "skipped", reason: "whatsapp_provider_unbound" };

  const { error } = await supabaseAdmin.from("message_outbox").insert({
    company_id: d.company_id,
    event_code: d.event_code,
    channel: "whatsapp",
    recipient_phone: d.destination,
    body: renderTemplate(d.body_md, d.payload),
    payload: { comm_dispatch_id: d.id, provider: endpoint.provider, endpoint_address: endpoint.address, ...d.payload },
    status: "queued",
    scheduled_at: new Date().toISOString(),
    reference_type: "core_comm_dispatch",
    reference_id: d.id,
    idempotency_key: `core-comm-whatsapp-${d.id}`,
  });
  if (error) return { status: "failed", error: error.message, retryable: true };
  return { status: "sent", providerMessageId: d.id, meta: { via: "message_outbox", outbox_state: "queued", provider: endpoint.provider } };
}

export async function sendPush(_d: DispatchInput): Promise<AdapterResult> {
  return { status: "skipped", reason: "push_not_configured" };
}

async function resolveN8nWorkflow(d: DispatchInput) {
  const requested = typeof d.payload.n8n_workflow_slug === "string" ? d.payload.n8n_workflow_slug : d.event_code;
  const { data, error } = await supabaseAdmin
    .from("n8n_workflow_registry")
    .select("workflow_slug,n8n_workflow_id,status,config")
    .eq("workflow_slug", requested)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (error || !data) return null;
  return data as { workflow_slug: string; n8n_workflow_id: string | null; status: string; config: Record<string, unknown> | null };
}

export async function sendN8n(d: DispatchInput): Promise<AdapterResult> {
  const workflow = await resolveN8nWorkflow(d);
  if (!workflow) return { status: "skipped", reason: "n8n_workflow_not_active" };
  const webhookUrl = typeof workflow.config?.webhook_url === "string" ? workflow.config.webhook_url : null;
  if (!webhookUrl) return { status: "skipped", reason: "n8n_active_without_published_webhook", meta: { workflow_id: workflow.n8n_workflow_id } };

  const secretRef = typeof workflow.config?.secret_ref === "string" ? workflow.config.secret_ref : null;
  const secret = secretRef ? process.env[secretRef] ?? "" : "";
  const body = JSON.stringify({ dispatch_id: d.id, event_code: d.event_code, company_id: d.company_id, user_id: d.user_id, destination: d.destination, subject: d.subject, body_md: d.body_md, payload: d.payload, ts: new Date().toISOString() });
  const signature = secret ? createHmac("sha256", secret).update(body).digest("hex") : "";
  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Impulsionando-Signature": signature, "X-Impulsionando-Event": d.event_code },
      body,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { status: "failed", error: `n8n_http_${resp.status}: ${txt.slice(0, 500)}`, retryable: resp.status >= 500 };
    }
    const respJson = (await resp.json().catch(() => ({}))) as { execution_id?: string };
    return { status: "sent", providerMessageId: respJson.execution_id ?? workflow.n8n_workflow_id, meta: { http: resp.status, workflow_slug: workflow.workflow_slug } };
  } catch (err) {
    return { status: "failed", error: `n8n_fetch_error: ${(err as Error).message}`, retryable: true };
  }
}

export async function dispatchByChannel(d: DispatchInput): Promise<AdapterResult> {
  switch (d.channel) {
    case "notification": return sendNotification(d);
    case "impulsionito": return sendImpulsionito(d);
    case "email": return sendEmail(d);
    case "whatsapp": return sendWhatsApp(d);
    case "push": return sendPush(d);
    case "n8n": return sendN8n(d);
    default: return { status: "skipped", reason: `unknown_channel:${d.channel}` };
  }
}
