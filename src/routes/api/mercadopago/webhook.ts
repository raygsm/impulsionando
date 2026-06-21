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

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const logRuntime = async (
          level: "info" | "warn" | "error",
          message: string,
          context: Record<string, unknown>,
        ) => {
          try {
            await supabaseAdmin.from("runtime_events").insert({
              level, scope: "mercadopago.webhook", message, context,
              route: "/api/mercadopago/webhook",
            } as never);
          } catch { /* logger silencioso */ }
        };

        if (!verifySignature(request, body)) {
          await logRuntime("warn", "assinatura inválida no webhook MP", {
            topic: payload?.type ?? payload?.topic ?? null,
          });
          return new Response("Invalid signature", { status: 401 });
        }


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
              const paidAt = p.status === "approved" ? new Date().toISOString() : null;

              await supabaseAdmin
                .from("payments")
                .update({
                  status: internal,
                  paid_at: paidAt,
                  raw_response: p,
                  webhook_received_at: new Date().toISOString(),
                })
                .eq("payment_id", String(resourceId));

              // Espelha no mpago_payments (criando se faltar) para o provisionamento
              const meta = p?.metadata ?? {};
              const moduleSlugs = Array.isArray(meta?.module_slugs) ? meta.module_slugs : null;
              const payerName = [p?.payer?.first_name, p?.payer?.last_name].filter(Boolean).join(" ") || null;
              await (supabaseAdmin as any)
                .from("mpago_payments")
                .upsert(
                  {
                    mp_payment_id: String(resourceId),
                    status: internal,
                    amount_cents: Math.round(Number(p?.transaction_amount ?? 0) * 100),
                    currency: p?.currency_id ?? "BRL",
                    payment_method: p?.payment_method_id ?? null,
                    payer_email: p?.payer?.email ?? null,
                    payer_name: payerName,
                    user_id: meta?.user_id ?? null,
                    empresa_id: meta?.empresa_id ?? null,
                    modulo_id: meta?.modulo_id ?? null,
                    plano_id: meta?.plan_id ?? meta?.plano_id ?? null,
                    module_slugs: moduleSlugs,
                    customer_phone: p?.payer?.phone?.number ?? null,
                    approved_at: paidAt,
                    paid_at: paidAt,
                    environment: "production",
                    metadata: meta,
                  },
                  { onConflict: "mp_payment_id" },
                );

              if (internal === "approved") {
                try {
                  const { autoProvisionFromPayment } = await import(
                    "@/lib/auto-provisioning.server"
                  );
                  await autoProvisionFromPayment(String(resourceId));
                } catch (provErr: any) {
                  await logRuntime("error", "auto-provisioning falhou", {
                    mp_payment_id: String(resourceId),
                    message: provErr?.message,
                    stack: provErr?.stack?.slice(0, 4000) ?? null,
                  });
                }
              }
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
          await logRuntime("error", e?.message ?? "erro desconhecido", {
            stack: e?.stack?.slice(0, 4000) ?? null,
            topic: payload?.type ?? payload?.topic ?? null,
            resourceId: payload?.data?.id ?? null,
          });
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
