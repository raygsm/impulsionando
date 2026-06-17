import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWebhookRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    status?: string;
    workflow?: string;
    company_id?: string;
    limit?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("webhook_runs")
      .select("id, company_id, white_label_id, workflow, event, target_url, http_method, response_status, status, attempts, last_error, started_at, finished_at, next_retry_at, idempotency_key, created_at, updated_at, request_payload")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 1000));
    if (data.status) q = q.eq("status", data.status);
    if (data.workflow) q = q.ilike("workflow", `%${data.workflow}%`);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const webhookRunSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("webhook_runs")
      .select("status")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
    const counts = { success: 0, error: 0, retry: 0, pending: 0, running: 0, total: 0 };
    (data ?? []).forEach((r) => {
      counts.total += 1;
      const k = r.status as keyof typeof counts;
      if (k in counts) counts[k] += 1;
    });
    return counts;
  });

/** Reenfileira o webhook: zera erro, status → 'retry' e agenda próximo disparo. */
export const reprocessWebhookRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const isAdmin = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin.data) throw new Error("Apenas administradores podem reprocessar");

    const { data: row, error } = await context.supabase
      .from("webhook_runs")
      .update({
        status: "retry",
        last_error: null,
        next_retry_at: new Date(Date.now() + 5_000).toISOString(),
      })
      .eq("id", data.id)
      .select("id, workflow, status, attempts")
      .single();
    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "webhook.reprocess",
      entity: "webhook_runs",
      entity_id: data.id,
      after: { status: "retry" },
    });
    return row;
  });
