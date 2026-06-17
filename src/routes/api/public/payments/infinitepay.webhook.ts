import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyInfinitePayWebhookSignature } from "@/lib/infinitepay.security";

const API_BASE = "https://api.checkout.infinitepay.io";

/**
 * Defense-in-depth payment confirmation.
 *
 * 1. HMAC signature on the raw body (shared secret) — rejects spoofed posts.
 * 2. Independent server-to-server call to InfinitePay's payment_check
 *    endpoint — the webhook body alone never flips status to `paid`.
 *
 * Only when BOTH gates pass do we set status='paid'. Legacy redirect params
 * or any query string in the success page have no effect on access.
 */
export const Route = createFileRoute("/api/public/payments/infinitepay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();

        // 1. Verify signature on raw body (before parsing JSON).
        const verification = verifyInfinitePayWebhookSignature(
          rawBody,
          request.headers,
          process.env.INFINITEPAY_WEBHOOK_SECRET,
        );
        if (!verification.ok) {
          console.warn("[infinitepay webhook] signature rejected:", verification.reason);
          const status = verification.reason === "secret_not_configured" ? 500 : 401;
          return jsonResp(status, { success: false, message: "Assinatura inválida" });
        }

        let payload: any = null;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return jsonResp(400, { success: false, message: "Payload inválido" });
        }

        const order_nsu: string | undefined = payload?.order_nsu;
        if (!order_nsu || typeof order_nsu !== "string" || order_nsu.length > 120) {
          return jsonResp(400, { success: false, message: "order_nsu ausente" });
        }

        // --- Pagamento de conta de mesa (QR Code) ----------------------------
        // order_nsu = `table-<uuid_sem_hifens>` aponta para restaurant_table_invoices.
        // Confirma via payment_check da InfinitePay, depois marca pago + fecha
        // sessão + libera mesa (idempotente) e dispara notificações ao cliente.
        if (order_nsu.startsWith("table-")) {
          const { data: tinv, error: tinvErr } = await supabaseAdmin
            .from("restaurant_table_invoices")
            .select("id, status, amount_cents, session_id")
            .eq("order_nsu", order_nsu)
            .maybeSingle();
          if (tinvErr) {
            console.error("[infinitepay webhook] table lookup error", tinvErr);
            return jsonResp(500, { success: false, message: "Erro interno" });
          }
          if (!tinv) {
            return jsonResp(400, { success: false, message: "Cobrança de mesa não encontrada" });
          }
          if (tinv.status === "paid") {
            return jsonResp(200, { success: true, message: null, duplicate: true });
          }
          const handleTable = (process.env.INFINITEPAY_HANDLE ?? "").replace(/^\$/, "");
          let tableConfirmed = false;
          let tableCheck: any = null;
          if (handleTable) {
            try {
              const res = await fetch(`${API_BASE}/invoices/public/checkout/payment_check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  handle: handleTable,
                  order_nsu,
                  transaction_nsu: payload?.transaction_nsu ?? "",
                  slug: payload?.invoice_slug ?? payload?.slug ?? "",
                }),
              });
              tableCheck = await res.json().catch(() => ({}));
              tableConfirmed = tableCheck?.paid === true;
            } catch (e) {
              console.error("[infinitepay webhook] table payment_check failed", e);
            }
          }
          if (!tableConfirmed) {
            return jsonResp(200, { success: true, message: "Aguardando confirmação" });
          }
          const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
            "restaurant_mark_table_invoice_paid",
            { _invoice_id: tinv.id },
          );
          if (rpcErr) {
            console.error("[infinitepay webhook] table RPC failed", rpcErr);
            return jsonResp(500, { success: false, message: "Erro ao fechar mesa" });
          }
          try {
            const { notifyTableBillClosed } = await import(
              "@/lib/restaurant-customer-notify.server"
            );
            const sid = (rpcRes as any)?.session_id ?? tinv.session_id;
            if (sid) await notifyTableBillClosed(sid);
          } catch (e) {
            console.warn("[infinitepay webhook] table notify failed", e);
          }
          return jsonResp(200, { success: true, message: null });
        }
        // --- Fim do fluxo de mesa --------------------------------------------

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

        // Idempotency: if already paid, just record duplicate and return 200.
        if (row.status === "paid") {
          const wp = (row.webhook_payload as Record<string, unknown>) ?? {};
          await supabaseAdmin
            .from("infinitepay_payments")
            .update({
              webhook_payload: {
                ...wp,
                last: payload,
                duplicates: (Number(wp.duplicates) || 0) + 1,
              },
            })
            .eq("order_nsu", order_nsu);
          return jsonResp(200, { success: true, message: null });
        }

        // 2. Defense-in-depth: independently confirm via payment_check.
        // Even with a valid signature, the body alone CANNOT flip status to paid.
        const handle = (process.env.INFINITEPAY_HANDLE ?? "").replace(/^\$/, "");
        let confirmed = false;
        let confirmJson: any = null;
        if (handle) {
          try {
            const res = await fetch(`${API_BASE}/invoices/public/checkout/payment_check`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                handle,
                order_nsu,
                transaction_nsu: payload?.transaction_nsu ?? "",
                slug: payload?.invoice_slug ?? payload?.slug ?? "",
              }),
            });
            confirmJson = await res.json().catch(() => ({}));
            confirmed = confirmJson?.paid === true;
          } catch (e) {
            console.error("[infinitepay webhook] payment_check failed", e);
          }
        } else {
          console.error("[infinitepay webhook] INFINITEPAY_HANDLE not configured");
        }

        if (!confirmed) {
          // Webhook signed correctly, but InfinitePay did NOT confirm paid.
          // Record the attempt and leave status untouched.
          await supabaseAdmin
            .from("infinitepay_payments")
            .update({
              webhook_payload: {
                ...((row.webhook_payload as Record<string, unknown>) ?? {}),
                last_webhook: payload,
                last_check: confirmJson,
                last_check_at: new Date().toISOString(),
              },
            })
            .eq("order_nsu", order_nsu);
          return jsonResp(200, { success: true, message: "Aguardando confirmação" });
        }

        const paid_amount = Number(
          confirmJson?.paid_amount ?? payload?.paid_amount ?? payload?.amount ?? row.amount,
        );
        const { error: upErr } = await supabaseAdmin
          .from("infinitepay_payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            paid_amount,
            installments: confirmJson?.installments ?? payload?.installments ?? null,
            capture_method: confirmJson?.capture_method ?? payload?.capture_method ?? null,
            transaction_nsu: confirmJson?.transaction_nsu ?? payload?.transaction_nsu ?? null,
            invoice_slug: confirmJson?.invoice_slug ?? payload?.invoice_slug ?? payload?.slug ?? null,
            receipt_url: confirmJson?.receipt_url ?? payload?.receipt_url ?? null,
            webhook_payload: { webhook: payload, payment_check: confirmJson },
          })
          .eq("order_nsu", order_nsu);

        if (upErr) {
          console.error("[infinitepay webhook] update error", upErr);
          return jsonResp(500, { success: false, message: "Erro ao atualizar pedido" });
        }

        // Provisionamento automático (idempotente). Falhas não bloqueiam o webhook.
        try {
          const { autoProvisionFromPayment } = await import("@/lib/auto-provisioning.server");
          await autoProvisionFromPayment(order_nsu);
        } catch (e) {
          console.error("[infinitepay webhook] auto-provision error", e);
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
