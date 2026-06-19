// Outbox dispatcher: processa message_outbox (queued) e envia via canal.
// Auth: header x-outbox-secret == OUTBOX_PROCESS_SECRET
// Canais suportados: whatsapp (Z-API), in_app (mark sent), email (skip se RESEND ausente).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-outbox-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("OUTBOX_PROCESS_SECRET")!;
const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const ZAPI_INSTANCE_TOKEN = Deno.env.get("ZAPI_INSTANCE_TOKEN") ?? "";
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sendWhatsApp(phone: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!ZAPI_INSTANCE_ID || !ZAPI_INSTANCE_TOKEN) return { ok: false, error: "Z-API não configurada" };
  const clean = phone.replace(/\D/g, "");
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_INSTANCE_TOKEN}/send-text`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
    body: JSON.stringify({ phone: clean, message: body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: JSON.stringify(data).slice(0, 500) };
  return { ok: true, id: data?.messageId ?? data?.id };
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY ausente" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "CHRISMED <noreply@notify.impulsionando.com.br>",
      to: [to],
      subject: subject || "Notificação",
      html: body.replace(/\n/g, "<br/>"),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: JSON.stringify(data).slice(0, 500) };
  return { ok: true, id: data?.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const provided = req.headers.get("x-outbox-secret");
  if (!SECRET || provided !== SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const { data: rows, error } = await supabase
    .from("message_outbox")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const row of rows ?? []) {
    await supabase.from("message_outbox").update({ status: "sending", attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
    let outcome: { ok: boolean; id?: string; error?: string } = { ok: false, error: "canal não suportado" };
    try {
      if (row.channel === "whatsapp" && row.recipient_phone) {
        outcome = await sendWhatsApp(row.recipient_phone, row.body);
      } else if (row.channel === "email" && row.recipient_email) {
        outcome = await sendEmail(row.recipient_email, row.subject ?? "", row.body);
      } else if (row.channel === "in_app") {
        outcome = { ok: true };
      }
    } catch (e) {
      outcome = { ok: false, error: String(e).slice(0, 500) };
    }

    if (outcome.ok) {
      await supabase.from("message_outbox").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        external_message_id: outcome.id ?? null,
        last_error: null,
      }).eq("id", row.id);
      results.push({ id: row.id, status: "sent" });
    } else {
      const exhausted = (row.attempts ?? 0) + 1 >= (row.max_attempts ?? 3);
      await supabase.from("message_outbox").update({
        status: exhausted ? "failed" : "queued",
        last_error: outcome.error ?? "erro desconhecido",
      }).eq("id", row.id);
      results.push({ id: row.id, status: exhausted ? "failed" : "retry", error: outcome.error });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
