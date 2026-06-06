import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/payments/infinitepay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any = null;
        try {
          payload = await request.json();
        } catch {
          return jsonResp(400, { success: false, message: "Payload inválido" });
        }

        const order_nsu: string | undefined = payload?.order_nsu;
        if (!order_nsu) {
          return jsonResp(400, { success: false, message: "order_nsu ausente" });
        }

        const { data: row, error } = await supabaseAdmin
          .from("infinitepay_payments")
          .select("*")
          .eq("order_nsu", order_nsu)
          .maybeSingle();

        if (error) {
          console.error("[infinitepay webhook] db error", error);
          return jsonResp(500, { success: false, message: "Erro interno" });
        }
        if (!row) {
          return jsonResp(400, { success: false, message: "Pedido não encontrado" });
        }

        // Idempotência: se já foi pago, apenas registra payload novo e retorna 200.
        if (row.status === "paid") {
          await supabaseAdmin
            .from("infinitepay_payments")
            .update({
              webhook_payload: { ...(row.webhook_payload ?? {}), last: payload, duplicates: ((row.webhook_payload as any)?.duplicates ?? 0) + 1 },
            })
            .eq("order_nsu", order_nsu);
          return jsonResp(200, { success: true, message: null });
        }

        const paid_amount = Number(payload?.paid_amount ?? payload?.amount ?? row.amount);
        const update = {
          status: "paid" as const,
          paid_at: new Date().toISOString(),
          paid_amount,
          installments: payload?.installments ?? null,
          capture_method: payload?.capture_method ?? null,
          transaction_nsu: payload?.transaction_nsu ?? null,
          invoice_slug: payload?.invoice_slug ?? payload?.slug ?? null,
          receipt_url: payload?.receipt_url ?? null,
          webhook_payload: payload,
        };

        const { error: upErr } = await supabaseAdmin
          .from("infinitepay_payments")
          .update(update)
          .eq("order_nsu", order_nsu);

        if (upErr) {
          console.error("[infinitepay webhook] update error", upErr);
          return jsonResp(500, { success: false, message: "Erro ao atualizar pedido" });
        }

        return jsonResp(200, { success: true, message: null });
      },
    },
  },
});

function jsonResp(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
