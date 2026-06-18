/**
 * Cron público: dispara a função de lembretes pendentes.
 * Acionado por pg_cron via SUPABASE_PUBLISHABLE_KEY no header `apikey`.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/mp-pending-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apikey || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data, error } = await supabaseAdmin.rpc(
            "mp_send_pending_reminders" as any,
          );
          if (error) throw error;
          return Response.json({ ok: true, result: data });
        } catch (e: any) {
          return Response.json(
            { ok: false, error: e?.message ?? "failed" },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        Response.json({ ok: true, hint: "POST com header apikey para executar." }),
    },
  },
});
