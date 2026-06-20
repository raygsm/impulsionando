/**
 * Cron mensal — envia relatório fiscal do mês anterior ao e-mail do contador
 * configurado em `core_settings.fiscal.accountant_email`.
 *
 * Auth: protegido pelo `apikey` (anon/publishable key) padrão de cron Lovable;
 * o handler valida o header antes de qualquer ação.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/fiscal-monthly-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          null;
        if (!expected || !provided || provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const { runMonthlyFiscalEmailCron } = await import(
            "@/lib/admin-fiscal.functions"
          );
          const result = await runMonthlyFiscalEmailCron();
          return Response.json(result);
        } catch (e: any) {
          console.error("[fiscal-monthly-email] failed", e);
          return new Response(
            JSON.stringify({ error: e?.message ?? "internal" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
