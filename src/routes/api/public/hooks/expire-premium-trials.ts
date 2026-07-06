/**
 * Cron público: expira trials Premium (SKU teste-premium-30d) vencidos.
 * Reverte plano ao anterior (ou Essencial), desliga Vitrine e módulos vitrine.
 * Chamado por pg_cron (header `apikey` = SUPABASE_PUBLISHABLE_KEY).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/expire-premium-trials")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apikey || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.rpc("mp_expire_premium_trials" as never);
          if (error) throw error;
          return Response.json({ ok: true, result: data });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
        }
      },
      GET: async () =>
        Response.json({ ok: true, hint: "POST com header apikey para expirar trials." }),
    },
  },
});
