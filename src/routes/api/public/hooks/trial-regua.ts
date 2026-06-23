import { createFileRoute } from "@tanstack/react-router";

/**
 * W20 — Régua N8N de Trial (7 dias).
 *
 * Roda diariamente via pg_cron. Para cada `trial_subscriptions` com
 * status="active" e `ends_at` definido, enfileira em
 * `core_funnel_dispatch_queue` os toques abaixo (idempotente por
 * `event_name + entity_id`):
 *
 *   D+1   trial.welcome           (boas-vindas + tutorial)
 *   D-3   trial.midway            (lembrete a 3 dias do fim)
 *   D-1   trial.last_call         (último dia — converter agora)
 *   D 0   trial.expired           (expirou — recuperação 7 dias)
 *
 * Também marca como `expired` registros cujo `ends_at < now()` e ainda
 * estão `active` sem `converted_at`.
 */
export const Route = createFileRoute("/api/public/hooks/trial-regua")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey) {
          return new Response("missing apikey", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const now = new Date();
        const inDays = (n: number) => {
          const d = new Date(now);
          d.setUTCDate(d.getUTCDate() + n);
          return d;
        };

        // 1) Expira trials vencidos
        const { error: expErr } = await supabaseAdmin
          .from("trial_subscriptions")
          .update({ status: "expirado_sem_conversao" })
          .eq("status", "ativo")
          .is("converted_at", null)
          .lt("ends_at", now.toISOString());
        if (expErr) {
          console.error("[trial-regua] expire error", expErr);
        }

        // 2) Busca trials ativos
        const { data: trials, error } = await supabaseAdmin
          .from("trial_subscriptions")
          .select(
            "id, company_id, lead_id, contact_email, contact_whatsapp, contact_name, contact_company, started_at, ends_at, status",
          )
          .in("status", ["ativo", "expirado_sem_conversao"])
          .not("ends_at", "is", null);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let enqueued = 0;
        const today = now.toISOString().slice(0, 10);

        for (const t of trials ?? []) {
          const ends = t.ends_at ? new Date(t.ends_at) : null;
          const started = t.started_at ? new Date(t.started_at) : null;
          if (!ends) continue;

          const dayDiffEnd = Math.round(
            (ends.getTime() - now.getTime()) / 86_400_000,
          );
          const dayDiffStart = started
            ? Math.round((now.getTime() - started.getTime()) / 86_400_000)
            : 0;

          const events: string[] = [];
          if (dayDiffStart === 1) events.push("trial.welcome");
          if (dayDiffEnd === 3) events.push("trial.midway");
          if (dayDiffEnd === 1) events.push("trial.last_call");
          if (t.status === "expirado_sem_conversao" && dayDiffEnd <= 0 && dayDiffEnd >= -7) {
            events.push("trial.expired");
          }

          for (const ev of events) {
            // idempotência: 1 toque por evento+trial+dia
            const { data: exists } = await supabaseAdmin
              .from("core_funnel_dispatch_queue")
              .select("id")
              .eq("event_name", ev)
              .eq("entity_id", t.id)
              .gte("created_at", `${today}T00:00:00Z`)
              .limit(1)
              .maybeSingle();
            if (exists) continue;

            const { error: insErr } = await supabaseAdmin
              .from("core_funnel_dispatch_queue")
              .insert({
                event_name: ev,
                rule_id: "00000000-0000-0000-0000-000000000000",
                workflow_name: "trial-regua",
                stage: "convert",
                status: "pending",
                entity_type: "trial_subscription",
                entity_id: t.id,
                company_id: t.company_id,
                lead_id: t.lead_id,
                contact_email: t.contact_email,
                contact_phone: t.contact_whatsapp,
                payload: {
                  trial_id: t.id,
                  contact_name: t.contact_name,
                  contact_company: t.contact_company,
                  ends_at: t.ends_at,
                  days_to_end: dayDiffEnd,
                } as never,
              });
            if (insErr) {
              console.error("[trial-regua] enqueue error", ev, t.id, insErr);
              continue;
            }
            enqueued++;
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            scanned: trials?.length ?? 0,
            enqueued,
            at: now.toISOString(),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
