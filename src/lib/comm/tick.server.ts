/**
 * Worker do Centro de Comunicação — server-only.
 *
 * Extraído de `comm.functions.ts` para não vazar `crypto`/adapters no bundle
 * do cliente. Só é importado pela rota pública `/api/public/comm/tick`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchByChannel } from "./adapters.server";

export async function runCommTick(batchSize = 25): Promise<{
  processed: number; sent: number; skipped: number; failed: number;
}> {
  const admin = supabaseAdmin as any;

  const nowIso = new Date().toISOString();
  const { data: batch, error } = await admin
    .from("core_comm_dispatches")
    .select("id, event_code, company_id, user_id, channel, destination, payload, resolved_template_id, attempts, max_attempts")
    .in("status", ["queued"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (error) throw new Error(error.message);
  if (!batch || batch.length === 0) return { processed: 0, sent: 0, skipped: 0, failed: 0 };

  let sent = 0, skipped = 0, failed = 0;
  for (const d of batch) {
    await admin.from("core_comm_dispatches").update({ status: "processing" }).eq("id", d.id);

    let tpl: { subject: string | null; body_md: string | null; body_html: string | null } | null = null;
    if (d.resolved_template_id) {
      const { data } = await admin.from("core_comm_templates")
        .select("subject, body_md, body_html").eq("id", d.resolved_template_id).maybeSingle();
      tpl = data ?? null;
    }

    const input = {
      id: d.id, event_code: d.event_code, company_id: d.company_id, user_id: d.user_id,
      channel: d.channel, destination: d.destination, payload: d.payload ?? {},
      subject: tpl?.subject ?? null, body_md: tpl?.body_md ?? null, body_html: tpl?.body_html ?? null,
      resolved_template_id: d.resolved_template_id,
    };

    await admin.from("core_comm_delivery_events").insert({
      dispatch_id: d.id, event_type: "attempt", channel: d.channel,
      payload: { attempt: (d.attempts ?? 0) + 1 },
    });

    const result = await dispatchByChannel(input);
    const attempts = (d.attempts ?? 0) + 1;

    if (result.status === "sent") {
      sent++;
      await admin.from("core_comm_dispatches").update({
        status: "sent", attempts, sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId ?? null, last_error: null,
      }).eq("id", d.id);
      await admin.from("core_comm_delivery_events").insert({
        dispatch_id: d.id, event_type: "sent", channel: d.channel,
        payload: { provider_message_id: result.providerMessageId, meta: result.meta ?? null },
      });
    } else if (result.status === "skipped") {
      skipped++;
      await admin.from("core_comm_dispatches").update({
        status: "skipped", attempts, last_error: result.reason,
      }).eq("id", d.id);
      await admin.from("core_comm_delivery_events").insert({
        dispatch_id: d.id, event_type: "skipped", channel: d.channel,
        payload: { reason: result.reason },
      });
    } else {
      failed++;
      const dead = attempts >= (d.max_attempts ?? 5) || result.retryable === false;
      const backoff = [30, 120, 600, 3600, 21600][attempts] ?? 21600;
      const next = dead ? null : new Date(Date.now() + backoff * 1000).toISOString();
      await admin.from("core_comm_dispatches").update({
        status: dead ? "dead_letter" : "queued",
        attempts, last_error: result.error, next_retry_at: next,
      }).eq("id", d.id);
      await admin.from("core_comm_delivery_events").insert({
        dispatch_id: d.id, event_type: dead ? "dead_letter" : "retry_scheduled", channel: d.channel,
        payload: { error: result.error, next_retry_at: next, attempts },
      });
    }
  }
  return { processed: batch.length, sent, skipped, failed };
}
