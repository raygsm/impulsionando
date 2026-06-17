import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cron diário: para cada membro do Clube, enfileira em message_outbox
 * todos os passos da jornada de 21 dias cujo day_offset coincide com
 * (hoje - created_at do consumer_profile) e que ainda não foram
 * disparados (idempotente via clube_journey_log).
 *
 * Acionado por pg_cron com header apikey = SUPABASE_ANON_KEY
 * (auth de edge já protege /api/public/*).
 */
export const Route = createFileRoute("/api/public/hooks/clube-journey-tick")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { data: steps, error: stepsErr } = await supabaseAdmin
            .from("clube_journey_steps")
            .select("id, day_offset, channel, audience, event_code, subject, body")
            .eq("active", true);
          if (stepsErr) throw stepsErr;

          const { data: members, error: memErr } = await supabaseAdmin
            .from("consumer_profiles")
            .select("user_id, full_name, whatsapp, current_level, referral_code, total_visits, created_at");
          if (memErr) throw memErr;

          const now = Date.now();
          let enqueued = 0;

          for (const m of members ?? []) {
            const days = Math.floor((now - new Date(m.created_at).getTime()) / 86400000);
            const dueSteps = (steps ?? []).filter((s: any) => s.day_offset === days);
            if (!dueSteps.length) continue;

            // recupera email do auth.users via admin
            const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
            const email = userRow?.user?.email ?? null;

            // check audience: free vs premium
            const { data: ms } = await supabaseAdmin
              .from("consumer_memberships")
              .select("plan, status")
              .eq("user_id", m.user_id)
              .maybeSingle();
            const isPremium = ms?.plan === "premium" && ms?.status === "active";

            for (const s of dueSteps as any[]) {
              if (s.audience === "free" && isPremium) continue;
              if (s.audience === "premium" && !isPremium) continue;

              // idempotência
              const { data: already } = await supabaseAdmin
                .from("clube_journey_log")
                .select("id")
                .eq("user_id", m.user_id)
                .eq("step_id", s.id)
                .maybeSingle();
              if (already) continue;

              const vars: Record<string, string> = {
                name: m.full_name ?? "membro",
                level: m.current_level ?? "explorador",
                referral_code: m.referral_code ?? "",
                visits_to_next: String(Math.max(0, 5 - (m.total_visits ?? 0))),
              };
              const render = (tpl: string | null | undefined) =>
                (tpl ?? "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

              await supabaseAdmin.from("message_outbox").insert({
                event_code: s.event_code,
                channel: s.channel,
                recipient_user_id: m.user_id,
                recipient_email: s.channel === "email" ? email : null,
                recipient_phone: s.channel === "whatsapp" ? m.whatsapp : null,
                recipient_name: m.full_name,
                subject: render(s.subject),
                body: render(s.body),
                status: "queued",
                scheduled_at: new Date().toISOString(),
                reference_type: "clube_journey",
                reference_id: s.id,
              });
              await supabaseAdmin.from("clube_journey_log").insert({
                user_id: m.user_id,
                step_id: s.id,
              });
              enqueued++;
            }
          }

          return new Response(JSON.stringify({ ok: true, enqueued }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
