/**
 * /api/public/comm/tick — endpoint público chamado pelo pg_cron a cada 30s
 * para processar a fila do Centro de Comunicação.
 *
 * Autenticação: header `apikey` com a publishable key do Supabase (padrão
 * documentado do Impulsionando para jobs internos).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/comm/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apiKey || !expected || apiKey !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        try {
          const { runCommTick } = await import("@/lib/comm/tick.server");
          const result = await runCommTick(50);
          return Response.json({ ok: true, ...result });
        } catch (err) {
          return Response.json(
            { ok: false, error: (err as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
