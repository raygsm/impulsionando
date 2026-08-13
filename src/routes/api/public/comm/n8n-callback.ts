import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint historico preservado somente para compatibilidade de rota.
 *
 * O contrato antigo dependia de core_comm_dispatches,
 * core_comm_channel_config e core_comm_delivery_events, estruturas que nao
 * fazem parte do schema atual de producao. Em vez de simular sucesso ou
 * gerar erro interno, respondemos 410 de forma deterministica.
 *
 * Workflows n8n devem registrar execucoes em:
 * - /api/public/hooks/n8n-log (contrato principal, HMAC)
 * - /api/public/webhooks/n8n-callback (compatibilidade de workflow, HMAC)
 */
export const Route = createFileRoute("/api/public/comm/n8n-callback")({
  server: {
    handlers: {
      POST: async () => Response.json(
        {
          ok: false,
          error: "legacy_callback_retired",
          canonical_callback: "/api/public/hooks/n8n-log",
        },
        { status: 410 },
      ),
      GET: async () => Response.json(
        {
          ok: false,
          status: "retired",
          canonical_callback: "/api/public/hooks/n8n-log",
        },
        { status: 410 },
      ),
    },
  },
});