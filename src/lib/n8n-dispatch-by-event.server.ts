/**
 * Dispatcher server-only por event_code.
 * Lê webhook_url da tabela n8n_workflows (configurada em /admin/integracoes/n8n)
 * e faz POST com o payload. Registra em n8n_dispatch_log.
 *
 * Usado por webhooks do Mercado Pago, triggers de DB (via server fns) e
 * qualquer server logic que precise disparar réguas do funil Impulsionando.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function dispatchN8nByEvent(
  event_code: string,
  payload: Record<string, unknown>,
  company_id: string | null = null,
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const { data: wf, error } = await supabaseAdmin
    .from("n8n_workflows")
    .select("id, webhook_url, is_active")
    .eq("event_code", event_code)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!wf) return { ok: false, error: `event_code não cadastrado: ${event_code}` };
  if (!wf.is_active || !wf.webhook_url) {
    return { ok: true, skipped: true, error: !wf.is_active ? "inactive" : "no_url" };
  }

  const body = JSON.stringify({
    event_code,
    company_id,
    dispatched_at: new Date().toISOString(),
    data: payload,
  });

  let status_code: number | null = null;
  let response_body = "";
  let errorMsg: string | null = null;

  try {
    const res = await fetch(wf.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    status_code = res.status;
    response_body = (await res.text().catch(() => "")).slice(0, 2000);
  } catch (e: any) {
    errorMsg = e?.message ?? String(e);
  }

  await supabaseAdmin.from("n8n_dispatch_log").insert({
    event_code,
    company_id,
    payload,
    status_code,
    response_body,
    error: errorMsg,
  } as never);

  if (!errorMsg && status_code && status_code < 400) {
    await supabaseAdmin
      .from("n8n_workflows")
      .update({ last_dispatched_at: new Date().toISOString() })
      .eq("id", wf.id);
    return { ok: true, status: status_code };
  }

  return { ok: false, status: status_code ?? 0, error: errorMsg ?? `HTTP ${status_code}` };
}
