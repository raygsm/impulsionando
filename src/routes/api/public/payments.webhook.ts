/**
 * Webhook público de pagamento — fecha faturas automaticamente.
 *
 * POST /api/public/payments/webhook
 * Header: x-webhook-signature: HMAC-SHA256 do corpo bruto com INFINITEPAY_WEBHOOK_SECRET
 * Body: { kind: "consumer" | "erp", invoice_id: uuid, status: "paid" }
 *
 * Compatível com provedores PIX / InfinitePay / Paddle desde que o adapter
 * envie esse formato. Para outros provedores, troque apenas o parser do body.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const Payload = z.object({
  kind: z.enum(["consumer", "erp"]),
  invoice_id: z.string().uuid(),
  status: z.literal("paid"),
});

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(signature.replace(/^sha256=/, ""), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
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
          return Response.json({ error: "invalid_payload", detail: e?.message }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const rpc =
          parsed.kind === "consumer" ? "mark_membership_invoice_paid" : "mark_billing_invoice_paid";
        const { data, error } = await supabaseAdmin.rpc(rpc, { _invoice_id: parsed.invoice_id });
        if (error) {
          return Response.json({ error: "rpc_failed", detail: error.message }, { status: 500 });
        }
        return Response.json({ ok: true, result: data });
      },
    },
  },
});
