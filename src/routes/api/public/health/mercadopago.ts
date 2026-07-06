/**
 * Health check público do Mercado Pago.
 * Confirma:
 *   1. ACCESS_TOKEN configurado + ambiente (sandbox/production)
 *   2. PUBLIC_KEY configurada (necessária para tokenizar cartão no MP.js)
 *   3. WEBHOOK_SECRET configurado
 *   4. Chamada real a /v1/payment_methods para validar o token
 *
 * NUNCA expõe o token/segredo — apenas booleans, contagem e prefixo do public key.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  getMpAccessToken,
  getMpPublicKey,
  getMpWebhookSecret,
  getMpEnvironment,
} from "@/lib/mercadopago-env.server";

export const Route = createFileRoute("/api/public/health/mercadopago")({
  server: {
    handlers: {
      GET: async () => {
        const t0 = Date.now();
        const token = getMpAccessToken() ?? "";
        const pub = getMpPublicKey() ?? "";
        const wh = getMpWebhookSecret() ?? "";

        const environment = getMpEnvironment();

        let apiOk = false;
        let apiStatus: number | null = null;
        let methodsCount: number | null = null;
        let apiError: string | null = null;

        if (token) {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 6000);
            const r = await fetch("https://api.mercadopago.com/v1/payment_methods", {
              headers: { Authorization: `Bearer ${token}` },
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            apiStatus = r.status;
            if (r.ok) {
              const j: unknown = await r.json();
              methodsCount = Array.isArray(j) ? j.length : 0;
              apiOk = true;
            } else {
              apiError = (await r.text()).slice(0, 200);
            }
          } catch (e) {
            apiError = e instanceof Error ? e.message.slice(0, 200) : "fetch_failed";
          }
        }

        const ok = !!token && !!pub && apiOk;

        return new Response(
          JSON.stringify({
            status: ok ? "ok" : "degraded",
            service: "mercadopago-checkout-transparente",
            elapsed_ms: Date.now() - t0,
            ts: new Date().toISOString(),
            environment,
            secrets: {
              access_token_configured: !!token,
              public_key_configured: !!pub,
              public_key_prefix: pub ? `${pub.slice(0, 8)}…` : null,
              webhook_secret_configured: !!wh,
            },
            api: {
              ok: apiOk,
              http_status: apiStatus,
              payment_methods_count: methodsCount,
              error: apiError,
            },
            webhook_url: "https://sistema.impulsionando.com.br/api/mercadopago/webhook",
          }),
          {
            status: ok ? 200 : 503,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          },
        );
      },
      HEAD: async () => new Response(null, { status: 200 }),
    },
  },
})
