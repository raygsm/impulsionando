/**
 * Webhook Maisfy → Colors (Fase 2).
 * URL pública: /api/public/webhooks/maisfy-colors
 *
 * Configuração no painel Maisfy (parâmetro do afiliado/produto Colors):
 *   URL:    https://impulsionando.lovable.app/api/public/webhooks/maisfy-colors
 *   Header: X-Signature: sha256=<HMAC do corpo com COLORS_MAISFY_WEBHOOK_SECRET>
 *
 * Payload esperado (best-effort; extrai campos comuns de exports Maisfy):
 * {
 *   event: "sale.approved" | "sale.pending" | "sale.refunded" | ...,
 *   sale: {
 *     id, order_id, status, sub_id | external_id | ref,
 *     customer: { name, email, phone, cpf },
 *     product: { slug, name, offer },
 *     quantity, kit_size,
 *     unit_price_cents, total_price_cents,
 *     coupon,
 *     affiliate: { code, external_id, name }
 *   }
 * }
 *
 * Segurança: HMAC obrigatório. Verificação timing-safe. Payload é tratado
 * como dado (nunca executado como instrução).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verify(secret: string, body: string, header: string | null): boolean {
  if (!header) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function toCents(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v > 1000 ? Math.round(v) : Math.round(v * 100);
  }
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) : undefined;
  }
  return undefined;
}

export const Route = createFileRoute("/api/public/webhooks/maisfy-colors")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          hint: "POST-only. Configure este URL no painel Maisfy com o header X-Signature: sha256=<HMAC>.",
        }),

      POST: async ({ request }) => {
        const secret = process.env.COLORS_MAISFY_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook secret not configured", { status: 424 });
        }
        const body = await request.text();
        const sig = request.headers.get("x-signature") ?? request.headers.get("x-hub-signature-256");
        if (!verify(secret, body, sig)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any = {};
        try { payload = body ? JSON.parse(body) : {}; } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const sale = payload.sale ?? payload.data ?? payload;
        const externalSaleId = String(sale.id ?? sale.sale_id ?? sale.transaction_id ?? "");
        if (!externalSaleId) {
          return new Response("Missing sale id", { status: 400 });
        }

        const status = String(
          sale.status ??
          (String(payload.event ?? "").split(".").pop()) ??
          "pending",
        ).toLowerCase();

        const customer = sale.customer ?? sale.buyer ?? {};
        const product = sale.product ?? sale.item ?? {};
        const affiliate = sale.affiliate ?? sale.producer ?? {};

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { reconcileColorsSale } = await import("@/lib/colors-reconcile.server");

        try {
          const result = await reconcileColorsSale(supabaseAdmin as any, {
            platform: "maisfy",
            external_sale_id: externalSaleId,
            external_order_id: sale.order_id ? String(sale.order_id) : undefined,
            colors_checkout_id: sale.sub_id ?? sale.external_id ?? sale.ref ?? sale.reference ?? undefined,
            external_status: status,
            customer_name: customer.name ?? customer.full_name,
            customer_email: customer.email,
            customer_whatsapp: customer.phone ?? customer.whatsapp,
            customer_cpf: customer.cpf ?? customer.document,
            product_slug: product.slug,
            product_name: product.name ?? product.title,
            offer: product.offer,
            quantity: Number(sale.quantity ?? 1),
            kit_size: Number(sale.kit_size ?? product.kit_size ?? 1),
            unit_price_cents: toCents(sale.unit_price ?? sale.price ?? product.price),
            total_price_cents: toCents(sale.total ?? sale.total_price ?? sale.amount),
            coupon: sale.coupon ?? undefined,
            affiliate_code: affiliate.code,
            affiliate_external_id: affiliate.id ? String(affiliate.id) : undefined,
            affiliate_name: affiliate.name,
            approved_at: sale.approved_at ?? sale.paid_at,
            raw: payload,
            source: "webhook",
          });
          return Response.json({ ok: true, ...result });
        } catch (err) {
          console.error("[maisfy-colors] reconcile failed", err);
          return new Response("Reconciliation failed", { status: 500 });
        }
      },
    },
  },
});
