// Server-only helper that flushes ALL pending rows of public.message_outbox
// (email + whatsapp) to their actual delivery channels.
//
// Reuses the per-row dispatch logic from outboxFlush.server.ts but is not
// scoped to a single (reference_type, reference_id). Called by the periodic
// processor at /api/public/outbox/process so any queued message —
// regardless of origin (trial, billing, manual) — is delivered.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWhatsAppText, normalizePhone } from "@/lib/zapi.server";

const SITE_NAME = "Impulsionando";
const SENDER_DOMAIN = "notify.www.impulsionando.com.br";
const FROM_DOMAIN = "www.impulsionando.com.br";

interface OutboxRow {
  id: string;
  channel: "email" | "whatsapp" | "in_app";
  subject: string | null;
  body: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;
  event_code: string;
  reference_type: string | null;
  reference_id: string | null;
  attempts: number;
  max_attempts: number;
}

function htmlEscape(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToHtml(subject: string, body: string): string {
  const escaped = htmlEscape(body).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1d4ed8;word-break:break-all;">$1</a>',
  );
  return `<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#1d4ed8;color:#ffffff;padding:14px 20px;font-weight:bold;font-size:14px;letter-spacing:.5px;">
      Impulsionando Tecnologia
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;">${htmlEscape(subject)}</h2>
      <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escaped}</div>
      <p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:14px;">
        Você está recebendo esta mensagem porque é cliente/usuário da Impulsionando.
      </p>
    </div>
  </div>
</body></html>`;
}

async function ensureUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !existing.used_at) return existing.token;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
  const { data: final } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return final?.token ?? token;
}

async function dispatchEmail(row: OutboxRow): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!row.recipient_email) return { ok: false, error: "missing_email" };
  const to = row.recipient_email;
  const subject = row.subject?.trim() || "Impulsionando Tecnologia";
  const text = row.body || "";
  const html = textToHtml(subject, text);
  try {
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails").select("id").eq("email", to.toLowerCase()).maybeSingle();
    if (suppressed) return { ok: false, error: "recipient_suppressed" };

    const unsubscribe_token = await ensureUnsubscribeToken(to);
    const messageId = crypto.randomUUID();
    const label = `outbox:${row.event_code}`;

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId, template_name: label, recipient_email: to, status: "pending",
      metadata: { source: "message_outbox", outbox_id: row.id, event_code: row.event_code,
        reference_type: row.reference_type, reference_id: row.reference_id },
    });

    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId, to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN, subject, html, text,
        purpose: "transactional", label, idempotency_key: `outbox-${row.id}`,
        unsubscribe_token, queued_at: new Date().toISOString(),
      },
    } as never);
    if (enqErr) return { ok: false, error: enqErr.message };
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function dispatchWhatsApp(row: OutboxRow): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!row.recipient_phone) return { ok: false, error: "missing_phone" };
  const phone = normalizePhone(row.recipient_phone);
  if (!phone) return { ok: false, error: "invalid_phone" };
  try {
    const r = await sendWhatsAppText({ phone, message: row.body || "" });
    if (!r.ok) return { ok: false, error: `zapi_${r.status}: ${r.body.slice(0, 200)}` };
    return { ok: true, messageId: r.messageId ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Drain queued message_outbox rows (email + whatsapp) up to `limit`.
 * Idempotent — leaves rows still `queued` when dispatch fails so the next
 * tick retries them, bumping `attempts`. Rows that exceed `max_attempts`
 * are marked `failed` so they stop being retried.
 */
export async function processOutboxBatch(limit = 50): Promise<{
  attempted: number; sent: number; failed: number; skipped: number;
}> {
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from("message_outbox")
    .select(
      "id, channel, subject, body, recipient_email, recipient_phone, recipient_name, event_code, reference_type, reference_id, attempts, max_attempts",
    )
    .eq("status", "queued")
    .in("channel", ["email", "whatsapp"])
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[processOutboxBatch] read error:", error.message);
    return { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  }
  if (!rows?.length) return { attempted: 0, sent: 0, failed: 0, skipped: 0 };

  let sent = 0, failed = 0, skipped = 0;
  for (const row of rows as OutboxRow[]) {
    const nextAttempt = row.attempts + 1;
    await supabaseAdmin
      .from("message_outbox")
      .update({ status: "sending", attempts: nextAttempt, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    const result = row.channel === "email" ? await dispatchEmail(row) : await dispatchWhatsApp(row);

    if (result.ok) {
      sent++;
      await supabaseAdmin.from("message_outbox").update({
        status: "sent", sent_at: new Date().toISOString(),
        external_message_id: result.messageId ?? null, last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
    } else {
      const exceeded = nextAttempt >= (row.max_attempts ?? 3);
      if (exceeded) failed++; else skipped++;
      await supabaseAdmin.from("message_outbox").update({
        status: exceeded ? "failed" : "queued",
        last_error: (result.error ?? "unknown").slice(0, 1000),
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
    }
  }
  return { attempted: rows.length, sent, failed, skipped };
}
