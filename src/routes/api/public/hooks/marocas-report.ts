// Endpoint disparado pelo pg_cron (a cada hora) para enviar os relatórios
// agendados. Verifica o apikey publishable do projeto e, opcionalmente,
// um shared secret extra (MAROCAS_REPORT_SECRET) para defesa em profundidade.
//
// Não aceita writes não autenticados: a única ação permitida é "varrer
// schedules e disparar"; nada é gravado fora das tabelas marocas_*.
import { createFileRoute } from "@tanstack/react-router";
import { dispatchMarocasReport } from "@/lib/marocas.functions";

export const Route = createFileRoute("/api/public/hooks/marocas-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apikey || !expectedKey || apikey !== expectedKey) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
        }
        const extra = process.env.MAROCAS_REPORT_SECRET;
        if (extra && request.headers.get("x-marocas-secret") !== extra) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
        }

        let body: { force_user_id?: string; period?: "dia" | "semana" } = {};
        try { body = await request.json(); } catch { /* corpo vazio é ok */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Janela atual: usa hora UTC do servidor (cron roda a cada hora).
        const now = new Date();
        const hour = now.getUTCHours();
        const weekday = now.getUTCDay();

        let q = (supabaseAdmin as any)
          .from("marocas_report_schedules")
          .select("id, user_id, period, hour, weekday, channels, enabled")
          .eq("enabled", true)
          .eq("hour", hour);
        if (body.period) q = q.eq("period", body.period);
        if (body.force_user_id) q = q.eq("user_id", body.force_user_id);

        const { data: schedules, error } = await q;
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        const eligible = (schedules ?? []).filter((s: any) => s.period === "dia" || (s.period === "semana" && s.weekday === weekday));

        const results: any[] = [];
        for (const s of eligible) {
          const from = new Date(now);
          if (s.period === "dia") {
            from.setUTCDate(now.getUTCDate() - 1);
          } else {
            from.setUTCDate(now.getUTCDate() - 7);
          }
          // Recupera email/telefone do usuário (best effort) via auth admin
          let email: string | null = null;
          try {
            const { data: u } = await supabaseAdmin.auth.admin.getUserById(s.user_id);
            email = u?.user?.email ?? null;
          } catch { /* ignore */ }

          const r = await dispatchMarocasReport({
            supabase: supabaseAdmin,
            userId: s.user_id,
            scheduleId: s.id,
            period: s.period,
            from: from.toISOString(),
            to: now.toISOString(),
            channels: s.channels,
            triggeredBy: "cron",
            recipientEmail: email,
          });
          results.push({ schedule_id: s.id, period: s.period, ...r });
        }

        return Response.json({ ok: true, fired: results.length, results });
      },
    },
  },
});
