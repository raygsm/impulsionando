import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Endpoint público chamado por pg_cron diariamente para rodar a régua de cobrança:
 * gera faturas, dispara cobranças D-7/D-1/D0/D+1, suspende contratos vencidos
 * e reativa após pagamento (a reativação ocorre via billing_mark_paid).
 *
 * Segurança: o pg_cron envia o apikey anon no header; a checagem é feita pela
 * camada de edge do projeto para /api/public/*. Este endpoint só dispara RPC.
 */
export const Route = createFileRoute("/api/public/hooks/billing-tick")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin.rpc("billing_run_cycle");
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true, result: data }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
