/**
 * Health check do webhook Mercado Pago.
 * Verifica:
 *   1. URL /api/mercadopago/webhook está viva (self GET → 200).
 *   2. Segredo HMAC configurado (indica assinatura obrigatória).
 *   3. Ambiente (sandbox/production).
 *   4. Atividade recente no log (mp_webhook_log) — 24h e 7d.
 *   5. Alerta se URL indisponível OU sem eventos há > 7d em produção.
 *
 * Response 200 = ok; 503 = degraded/alert.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  getMpAccessToken,
  getMpWebhookSecret,
  getMpEnvironment,
} from "@/lib/mercadopago-env.server";

const WEBHOOK_PATH = "/api/mercadopago/webhook";

export const Route = createFileRoute("/api/public/health/mp-webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const t0 = Date.now();
        const environment = getMpEnvironment();
        const secretConfigured = !!getMpWebhookSecret();
        const tokenConfigured = !!getMpAccessToken();

        // 1) Self-test da URL
        const origin = new URL(request.url).origin;
        const webhookUrl = `${origin}${WEBHOOK_PATH}`;
        let urlAlive = false;
        let urlStatus: number | null = null;
        let urlError: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 5000);
          const r = await fetch(webhookUrl, { method: "GET", signal: ctrl.signal });
          clearTimeout(timer);
          urlStatus = r.status;
          urlAlive = r.ok;
        } catch (e) {
          urlError = e instanceof Error ? e.message.slice(0, 200) : "fetch_failed";
        }

        // 2) Atividade recente
        let events24h = 0;
        let events7d = 0;
        let errors7d = 0;
        let lastEventAt: string | null = null;
        let lastTopic: string | null = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin.rpc("mp_get_webhook_health" as never);
          const h = (data ?? {}) as Record<string, unknown>;
          events24h = Number(h.events_24h ?? 0);
          events7d = Number(h.events_7d ?? 0);
          errors7d = Number(h.errors_7d ?? 0);
          lastEventAt = (h.last_event_at as string | null) ?? null;
          lastTopic = (h.last_topic as string | null) ?? null;
        } catch { /* ignore */ }

        // 3) Alertas
        const alerts: string[] = [];
        if (!urlAlive) alerts.push("webhook_url_offline");
        if (!secretConfigured) alerts.push("hmac_secret_missing");
        if (!tokenConfigured) alerts.push("access_token_missing");
        if (environment === "production" && events7d === 0) alerts.push("no_events_last_7d");
        if (errors7d > 0) alerts.push(`errors_last_7d:${errors7d}`);

        const status = alerts.length === 0 ? "ok" : "alert";

        return new Response(
          JSON.stringify({
            status,
            service: "mercadopago-webhook",
            environment,
            webhook_url: webhookUrl,
            elapsed_ms: Date.now() - t0,
            ts: new Date().toISOString(),
            url: { alive: urlAlive, http_status: urlStatus, error: urlError },
            security: {
              hmac_secret_configured: secretConfigured,
              access_token_configured: tokenConfigured,
            },
            activity: {
              events_24h: events24h,
              events_7d: events7d,
              errors_7d: errors7d,
              last_event_at: lastEventAt,
              last_topic: lastTopic,
            },
            alerts,
            registration_hint: {
              sandbox: "Painel MP Sandbox → Suas integrações → Webhooks — registrar esta webhook_url e eventos: payment, subscription_preapproval",
              production: "Painel MP Produção → Suas integrações → Webhooks — registrar mesma URL e eventos",
            },
          }, null, 2),
          {
            status: alerts.length === 0 ? 200 : 503,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          },
        );
      },
      HEAD: async () => new Response(null, { status: 200 }),
    },
  },
});
