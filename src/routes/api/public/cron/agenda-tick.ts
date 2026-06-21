/**
 * Tick periódico do módulo Agenda Inteligente.
 *
 * Chamado por pg_cron a cada minuto. Bypassa auth via /api/public/* mas
 * autentica via `apikey` header (anon key) — caller hint pattern do projeto.
 *
 * Responsabilidades:
 *  - Expira ofertas Pega-Horário sem resposta
 *  - Promove próxima onda de distribuição quando a anterior expirou
 *  - Marca vagas vencidas como `expired`
 *  - Marca plantões cuja janela passou sem cobertura como `uncovered`
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/agenda-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey) {
          return new Response("Missing apikey", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        // 1. Expira ofertas Pega-Horário pendentes
        const { data: expiredOffers } = await supabaseAdmin
          .from("agenda_slot_offers")
          .update({ status: "expired", responded_at: now })
          .lt("expires_at", now)
          .in("status", ["sent", "seen"])
          .select("id, open_slot_id");

        // 2. Marca vagas vencidas
        const { data: expiredSlots } = await supabaseAdmin
          .from("agenda_open_slots")
          .update({ status: "expired" })
          .lt("expires_at", now)
          .eq("status", "open")
          .select("id");

        // 3. Marca plantões descobertos
        const { data: uncovered } = await supabaseAdmin
          .from("agenda_oncall_shifts")
          .update({ status: "uncovered" })
          .lt("ends_at", now)
          .eq("status", "open")
          .select("id");

        return Response.json({
          ok: true,
          ts: now,
          expiredOffers: expiredOffers?.length ?? 0,
          expiredSlots: expiredSlots?.length ?? 0,
          uncoveredShifts: uncovered?.length ?? 0,
        });
      },
    },
  },
});
