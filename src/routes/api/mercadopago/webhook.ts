/**
 * Webhook do Mercado Pago — recebe notificações de pagamentos e assinaturas.
 * URL pública: /api/mercadopago/webhook
 * Segurança: valida assinatura HMAC quando MERCADOPAGO_WEBHOOK_SECRET configurado.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const MP_API = "https://api.mercadopago.com";

function verifySignature(request: Request, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // dev sem secret configurado
  const sig = request.headers.get("x-signature") ?? "";
  const reqId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    sig.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const dataId = new URL(request.url).searchParams.get("data.id") ??
    (() => { try { return JSON.parse(body)?.data?.id; } catch { return ""; } })();
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch { return false; }
}

const STATUS_MAP: Record<string, string> = {
  approved: "approved",
  pending: "pending",
  in_process: "pending",
  rejected: "rejected",
  cancelled: "canceled",
  refunded: "refunded",
  charged_back: "charged_back",
};

export const Route = createFileRoute("/api/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let payload: any = {};
        try { payload = body ? JSON.parse(body) : {}; } catch {}

        if (!verifySignature(request, body)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // log do evento
        const { data: logRow } = await supabaseAdmin
          .from("mp_webhook_log")
          .insert({
            topic: payload?.type ?? payload?.topic ?? null,
            resource_id: payload?.data?.id ? String(payload.data.id) : null,
            payload,
          })
          .select()
          .single();

        try {
          const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
          const topic = payload?.type ?? payload?.topic;
          const resourceId = payload?.data?.id;

          if (token && topic === "payment" && resourceId) {
            const r = await fetch(`${MP_API}/v1/payments/${resourceId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
              const p: any = await r.json();
              const internal = STATUS_MAP[p.status] ?? p.status;
              await supabaseAdmin
                .from("payments")
                .update({
                  status: internal,
                  paid_at: p.status === "approved" ? new Date().toISOString() : null,
                  raw_response: p,
                  webhook_received_at: new Date().toISOString(),
                })
                .eq("payment_id", String(resourceId));
            }
          }

          if (token && (topic === "subscription_preapproval" || topic === "preapproval") && resourceId) {
            const r = await fetch(`${MP_API}/preapproval/${resourceId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
              const s: any = await r.json();
              await supabaseAdmin
                .from("mp_subscriptions")
                .update({
                  status: s.status,
                  next_billing_at: s.next_payment_date ?? null,
                  raw_response: s,
                })
                .eq("mp_preapproval_id", String(resourceId));
            }
          }

          if (logRow) {
            await supabaseAdmin
              .from("mp_webhook_log")
              .update({ processed: true })
              .eq("id", logRow.id);
          }
          return Response.json({ ok: true });
        } catch (e: any) {
          if (logRow) {
            await supabaseAdmin
              .from("mp_webhook_log")
              .update({ error: e?.message ?? String(e) })
              .eq("id", logRow.id);
          }
          console.error("[MP webhook] error", e);
          return Response.json({ ok: false, error: e?.message }, { status: 500 });
        }
      },
      GET: async () =>
        Response.json({
          ok: true,
          hint: "Webhook Mercado Pago. Use POST com payload do MP.",
        }),
    },
  },
});
