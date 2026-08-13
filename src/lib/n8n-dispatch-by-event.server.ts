/**
 * Dispatcher server-only por evento.
 * Fonte de verdade: n8n_workflow_registry + tenant_workflow_state.
 * Nunca fabrica URL: sem webhook sincronizado, retorna skipped=no_webhook_verified.
 */
import { createHmac, randomUUID } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CANONICAL_N8N = "https://n8n.impulsionando.com.br/";

function normalizeWorkflowSlug(eventCode: string, tenantSlug: string) {
  const trimmed = eventCode.trim();
  if (trimmed.startsWith(`${tenantSlug}.`)) return trimmed;
  return `${tenantSlug}.${trimmed}`;
}

function configAcceptsEvent(config: unknown, eventCode: string) {
  if (!config || typeof config !== "object") return false;
  const cfg = config as Record<string, unknown>;
  if (cfg.event === eventCode) return true;
  return Array.isArray(cfg.events) && cfg.events.includes(eventCode);
}

export async function dispatchN8nByEvent(
  event_code: string,
  payload: Record<string, unknown>,
  company_id: string | null = null,
  tenant_slug = "impulsionando",
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string; workflow_slug?: string }> {
  const normalizedSlug = normalizeWorkflowSlug(event_code, tenant_slug);

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("communication_tenants" as never)
    .select("id" as never)
    .eq("slug" as never, tenant_slug)
    .eq("active" as never, true)
    .limit(1)
    .maybeSingle();
  if (tenantError) return { ok: false, error: tenantError.message, workflow_slug: normalizedSlug };
  if (!tenant) return { ok: false, error: `tenant_not_found:${tenant_slug}`, workflow_slug: normalizedSlug };

  let registry: any = null;
  const { data: exact, error: exactError } = await supabaseAdmin
    .from("n8n_workflow_registry" as never)
    .select("id,workflow_slug,status,config,n8n_workflow_id" as never)
    .eq("workflow_slug" as never, normalizedSlug)
    .order("version" as never, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (exactError) return { ok: false, error: exactError.message, workflow_slug: normalizedSlug };
  registry = exact;

  if (!registry) {
    const prefix = tenant_slug === "wmp" ? "wmp_%" : `${tenant_slug}.%`;
    const { data: candidates, error: candidateError } = await supabaseAdmin
      .from("n8n_workflow_registry" as never)
      .select("id,workflow_slug,status,config,n8n_workflow_id,version" as never)
      .ilike("workflow_slug" as never, prefix)
      .order("version" as never, { ascending: false });
    if (candidateError) return { ok: false, error: candidateError.message, workflow_slug: normalizedSlug };
    registry = ((candidates as any[]) ?? []).find((row) => configAcceptsEvent(row.config, event_code)) ?? null;
  }

  if (!registry) return { ok: false, error: `workflow_not_registered:${normalizedSlug}`, workflow_slug: normalizedSlug };
  const workflowSlug = String(registry.workflow_slug);

  const { data: state, error: stateError } = await supabaseAdmin
    .from("tenant_workflow_state" as never)
    .select("status,config" as never)
    .eq("tenant_id" as never, (tenant as any).id)
    .eq("registry_id" as never, registry.id)
    .maybeSingle();
  if (stateError) return { ok: false, error: stateError.message, workflow_slug: workflowSlug };

  if (registry.status !== "ACTIVE" || (state as any)?.status !== "ACTIVE") {
    return { ok: true, skipped: true, error: "inactive", workflow_slug: workflowSlug };
  }

  const regConfig = registry.config && typeof registry.config === "object" ? registry.config : {};
  const stateConfig = (state as any)?.config && typeof (state as any).config === "object" ? (state as any).config : {};
  const webhookUrl = String(stateConfig.webhook_url ?? regConfig.webhook_url ?? "");
  if (!webhookUrl.startsWith(CANONICAL_N8N)) {
    return { ok: true, skipped: true, error: "no_webhook_verified", workflow_slug: workflowSlug };
  }

  const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
  if (!secret) return { ok: false, error: "IMPULSIONANDO_WEBHOOK_SECRET not set", workflow_slug: workflowSlug };

  const correlationId = `${workflowSlug}:${randomUUID()}`;
  const startedAt = new Date().toISOString();
  const body = JSON.stringify({ workflow_name: workflowSlug, event_code, tenant_slug, correlation_id: correlationId, company_id, dispatched_at: startedAt, data: payload });
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  let status = 0;
  let errorMessage: string | null = null;
  try {
    const response = await fetch(webhookUrl, { method: "POST", headers: { "content-type": "application/json", "x-impulsionando-signature": signature }, body });
    status = response.status;
    if (!response.ok) errorMessage = (await response.text().catch(() => "")).slice(0, 2000) || `HTTP ${response.status}`;
  } catch (error) { errorMessage = error instanceof Error ? error.message : String(error); }

  const finalStatus = !errorMessage && status > 0 && status < 400 ? "SUCCEEDED" : "FAILED";
  await supabaseAdmin.rpc("record_n8n_registry_run" as never, { p_tenant_slug: tenant_slug, p_workflow_slug: workflowSlug, p_correlation_id: correlationId, p_n8n_execution_id: null, p_status: finalStatus, p_started_at: startedAt, p_finished_at: new Date().toISOString(), p_error: errorMessage ? { message: errorMessage, http_status: status || null } : null } as never);

  if (finalStatus === "SUCCEEDED") return { ok: true, status, workflow_slug: workflowSlug };
  return { ok: false, status, error: errorMessage ?? `HTTP ${status}`, workflow_slug: workflowSlug };
}
