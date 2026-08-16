// Server-only universal outbox processor for Core communications.
// Statuses and fields must stay aligned with public.message_outbox.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWhatsAppText, normalizePhone } from "@/lib/zapi.server";

const SITE_NAME = "Impulsionando";
const SITE_ORIGIN = "https://impulsionando.com.br";
const SENDER_DOMAIN = "notify.www.impulsionando.com.br";
const FROM_DOMAIN = "www.impulsionando.com.br";

interface OutboxRow {
  id: string;
  channel: "email" | "whatsapp" | "in_app";
  subject: string | null;
  body: string;
  payload: Record<string, unknown> | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;
  event_code: string;
  reference_type: string | null;
  reference_id: string | null;
  attempts: number;
}

type EmailPurpose = "transactional" | "marketing";

function htmlEscape(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function purposeFor(row: OutboxRow): EmailPurpose {
  return row.payload?.purpose === "marketing" ? "marketing" : "transactional";
}

function maxAttemptsFor(row: OutboxRow): number {
  const parsed = Number(row.payload?.max_attempts ?? 3);
  if (!Number.isFinite(parsed)) return 3;
  return Math.max(1, Math.min(10, Math.trunc(parsed)));
}

function textToHtml(subject: string, body: string, purpose: EmailPurpose, unsubscribeUrl?: string): string {
  const escaped = htmlEscape(body).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1d4ed8;word-break:break-all;">$1</a>',
  );
  const footer = purpose === "marketing"
    ? `<p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:14px;">Mensagem comercial da Impulsionando Tecnologia. Se não quiser receber novos convites, <a href="${htmlEscape(unsubscribeUrl ?? "")}" style="color:#475569;">cancele os envios aqui</a>.</p>`
    : `<p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:14px;">Mensagem operacional da Impulsionando Tecnologia relacionada à sua conta, solicitação ou serviço.</p>`;
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><div style="background:#1d4ed8;color:#ffffff;padding:14px 20px;font-weight:bold;font-size:14px;letter-spacing:.5px;">Impulsionando Tecnologia</div><div style="padding:24px;"><h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;">${htmlEscape(subject)}</h2><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escaped}</div>${footer}</div></div></body></html>`;
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
  const { error: upsertError } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalized, used_at: null }, { onConflict: "email" });
  if (upsertError) throw new Error(`unsubscribe_token:${upsertError.message}`);

  const { data: final, error: readError } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  if (readError) throw new Error(`unsubscribe_token_read:${readError.message}`);
  return final?.token ?? token;
}

async function dispatchEmail(row: OutboxRow): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!row.recipient_email) return { ok: false, error: "missing_email" };
  const to = row.recipient_email.trim().toLowerCase();
  const purpose = purposeFor(row);
  const subject = row.subject?.trim() || "Impulsionando Tecnologia";
  const text = row.body || "";

  try {
    const { data: suppressed, error: suppressionError } = await supabaseAdmin
      .from("suppressed_emails").select("id").eq("email", to).maybeSingle();
    if (suppressionError) return { ok: false, error: `suppression_check:${suppressionError.message}` };
    if (suppressed) return { ok: false, error: "recipient_suppressed" };

    const unsubscribeToken = await ensureUnsubscribeToken(to);
    const unsubscribeUrl = `${SITE_ORIGIN}/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    const html = textToHtml(subject, text, purpose, unsubscribeUrl);
    const messageId = crypto.randomUUID();
    const label = `outbox:${row.event_code}`;

    const { error: logError } = await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: label,
      recipient_email: to,
      status: "pending",
      metadata: {
        source: "message_outbox",
        outbox_id: row.id,
        event_code: row.event_code,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        purpose,
      },
    });
    if (logError) return { ok: false, error: `email_log:${logError.message}` };

    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose,
        label,
        idempotency_key: `outbox-${row.id}`,
        unsubscribe_token: unsubscribeToken,
        list_unsubscribe: `<${unsubscribeUrl}>`,
        list_unsubscribe_post: "List-Unsubscribe=One-Click",
        queued_at: new Date().toISOString(),
      },
    } as never);
    if (enqErr) return { ok: false, error: `enqueue_email:${enqErr.message}` };
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
    if (!r.ok) return { ok: false, error: `whatsapp_provider_${r.status}: ${r.body.slice(0, 200)}` };
    return { ok: true, messageId: r.messageId ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function processOutboxBatch(limit = 50): Promise<{
  attempted: number; sent: number; failed: number; skipped: number;
}> {
  const safeLimit = Math.max(1, Math.min(250, Math.trunc(limit)));
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from("message_outbox")
    .select("id, channel, subject, body, payload, recipient_email, recipient_phone, recipient_name, event_code, reference_type, reference_id, attempts")
    .eq("status", "queued")
    .in("channel", ["email", "whatsapp"])
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(safeLimit);
  if (error) {
    console.error("[processOutboxBatch] read error:", error.message);
    return { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  }
  if (!rows?.length) return { attempted: 0, sent: 0, failed: 0, skipped: 0 };

  let sent = 0, failed = 0, skipped = 0;
  for (const row of rows as OutboxRow[]) {
    const nextAttempt = (row.attempts ?? 0) + 1;
    const maxAttempts = maxAttemptsFor(row);
    const { error: claimError } = await supabaseAdmin
      .from("message_outbox")
      .update({ status: "processing", attempts: nextAttempt, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "queued");
    if (claimError) {
      skipped++;
      continue;
    }

    const result = row.channel === "email" ? await dispatchEmail(row) : await dispatchWhatsApp(row);
    if (result.ok) {
      sent++;
      await supabaseAdmin.from("message_outbox").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        external_message_id: result.messageId ?? null,
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
    } else {
      const exceeded = nextAttempt >= maxAttempts;
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
