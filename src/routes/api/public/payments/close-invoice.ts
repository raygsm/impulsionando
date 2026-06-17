/**
 * Webhook genérico de fechamento de faturas.
 *
 * POST /api/public/payments/close-invoice
 *
 * Segurança:
 *   - HMAC-SHA256 do corpo bruto, header `x-webhook-signature`,
 *     segredo `INFINITEPAY_WEBHOOK_SECRET`.
 *   - Idempotência: cada evento processado uma única vez, identificado
 *     pelo header `x-event-id` (preferido) ou, na ausência, por um hash
 *     determinístico do corpo. Reentregas devolvem 200 com `duplicate:true`.
 *
 * Modos:
 *   - Normal: efetiva a baixa da fatura.
 *   - Simulação: enviar `x-simulate: 1` (assinatura ainda obrigatória) —
 *     valida tudo e descreve o que faria, sem escrever no banco e sem
 *     consumir o event_id. Útil para validar integração antes de produção.
 *
 * Body:
 *   { kind: "consumer" | "erp" | "table", invoice_id: uuid, status: "paid" }
 *
 * Convive com /api/public/payments/webhook (Paddle/InfinitePay nativo).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const Payload = z.object({
  kind: z.enum(["consumer", "erp", "table"]),
  invoice_id: z.string().uuid(),
  status: z.literal("paid"),
});

export function verifySignature(
  body: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const cleaned = signature.replace(/^sha256=/, "");
  const a = Buffer.from(cleaned, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const RPC_BY_KIND = {
  consumer: "mark_membership_invoice_paid",
  erp: "mark_billing_invoice_paid",
  table: "restaurant_mark_table_invoice_paid",
} as const;

export const Route = createFileRoute("/api/public/payments/close-invoice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.INFINITEPAY_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }

        const raw = await request.text();
        const sig = request.headers.get("x-webhook-signature");
        if (!verifySignature(raw, sig, secret)) {
          return new Response("invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof Payload>;
        try {
          parsed = Payload.parse(JSON.parse(raw));
        } catch (e: any) {
          return Response.json(
            { error: "invalid_payload", detail: e?.message },
            { status: 400 },
          );
        }

        const isSimulation =
          request.headers.get("x-simulate") === "1" ||
          request.headers.get("x-simulate") === "true";

        const rpc = RPC_BY_KIND[parsed.kind];

        if (isSimulation) {
          return Response.json({
            ok: true,
            simulated: true,
            would_call: rpc,
            args: { _invoice_id: parsed.invoice_id },
            kind: parsed.kind,
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { claimWebhookEvent, computeEventId, recordWebhookResult } =
          await import("@/lib/webhook-idempotency.server");

        const eventId = computeEventId(raw, request.headers.get("x-event-id"));
        const claim = await claimWebhookEvent(supabaseAdmin, {
          source: "close-invoice",
          event_id: eventId,
          target_kind: parsed.kind,
          target_id: parsed.invoice_id,
          payload: parsed,
        });
        if (claim.duplicate) {
          return Response.json({
            ok: true,
            duplicate: true,
            previous_result: claim.previous_result ?? null,
          });
        }

        const { data, error } = await supabaseAdmin.rpc(rpc, {
          _invoice_id: parsed.invoice_id,
        });
        if (error) {
          await recordWebhookResult(supabaseAdmin, {
            source: "close-invoice",
            event_id: eventId,
            result: { ok: false, error: error.message },
          });
          return Response.json(
            { error: "rpc_failed", detail: error.message },
            { status: 500 },
          );
        }

        // Para tables, dispara as notificações ao cliente (uma vez).
        if (parsed.kind === "table") {
          try {
            const { notifyTableBillClosed } = await import(
              "@/lib/restaurant-customer-notify.server"
            );
            const sessionId = (data as any)?.session_id as string | undefined;
            if (sessionId) await notifyTableBillClosed(sessionId);
          } catch (e) {
            console.warn("notify table bill failed", e);
          }
        }

        await recordWebhookResult(supabaseAdmin, {
          source: "close-invoice",
          event_id: eventId,
          result: { ok: true, rpc, data },
        });

        return Response.json({ ok: true, result: data });
      },
    },
  },
});
