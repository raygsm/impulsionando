import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cron diário: enfileira passos da jornada de 21 dias em message_outbox
 * (idempotente via clube_journey_log).
 *
 * - Retry com backoff exponencial em cada operação por membro/passo
 * - Cada tentativa é registrada em clube_cron_log (job="clube-journey-tick-attempt")
 * - Execução completa registrada como success/partial/error
 * - Notifica admins via notifications quando há falhas residuais
 */

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 250;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(
  label: string,
  ctx: { user_id?: string; step_id?: string },
  fn: () => Promise<T>,
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startedAt = new Date().toISOString();
    try {
      const result = await fn();
      if (attempt > 1) {
        await supabaseAdmin.from("clube_cron_log").insert({
          job: "clube-journey-tick-attempt",
          status: "success",
          enqueued: 0,
          skipped: 0,
          error_count: attempt - 1,
          error_message: `recovered after ${attempt} attempts (${label})`,
          details: { label, attempt, ...ctx } as any,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
        });
      }
      return result;
    } catch (e: any) {
      lastErr = e;
      // unique_violation não deve fazer retry
      if (e?.code === "23505") throw e;
      await supabaseAdmin.from("clube_cron_log").insert({
        job: "clube-journey-tick-attempt",
        status: attempt === MAX_RETRIES ? "error" : "partial",
        enqueued: 0,
        skipped: 0,
        error_count: 1,
        error_message: `${label}: ${e?.message ?? String(e)}`,
        details: { label, attempt, max: MAX_RETRIES, ...ctx } as any,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      });
      if (attempt === MAX_RETRIES) break;
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
      await sleep(delay);
    }
  }
  throw lastErr;
}

export const Route = createFileRoute("/api/public/hooks/clube-journey-tick")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = new Date().toISOString();
        let enqueued = 0;
        let skipped = 0;
        const errors: Array<{ user_id?: string; step_id?: string; message: string }> = [];

        try {
          const { data: steps, error: stepsErr } = await withRetry("fetch-steps", {}, async () => {
            const r = await supabaseAdmin
              .from("clube_journey_steps")
              .select("id, day_offset, channel, audience, event_code, subject, body")
              .eq("active", true);
            if (r.error) throw r.error;
            return r;
          });
          if (stepsErr) throw stepsErr;

          const { data: members, error: memErr } = await withRetry("fetch-members", {}, async () => {
            const r = await supabaseAdmin
              .from("consumer_profiles")
              .select("user_id, full_name, whatsapp, current_level, referral_code, total_visits, created_at");
            if (r.error) throw r.error;
            return r;
          });
          if (memErr) throw memErr;

          const now = Date.now();

          for (const m of members ?? []) {
            try {
              const days = Math.floor((now - new Date(m.created_at).getTime()) / 86400000);
              const dueSteps = (steps ?? []).filter((s: any) => s.day_offset === days);
              if (!dueSteps.length) continue;

              const userRow = await withRetry("auth-getUser", { user_id: m.user_id }, async () => {
                const r = await supabaseAdmin.auth.admin.getUserById(m.user_id);
                if (r.error) throw r.error;
                return r.data;
              });
              const email = userRow?.user?.email ?? null;

              const ms = await withRetry("fetch-membership", { user_id: m.user_id }, async () => {
                const r = await supabaseAdmin
                  .from("consumer_memberships")
                  .select("plan, status")
                  .eq("user_id", m.user_id)
                  .maybeSingle();
                if (r.error) throw r.error;
                return r.data;
              });
              const isPremium = ms?.plan === "premium" && ms?.status === "active";

              for (const s of dueSteps as any[]) {
                if (s.audience === "free" && isPremium) { skipped++; continue; }
                if (s.audience === "premium" && !isPremium) { skipped++; continue; }

                const vars: Record<string, string> = {
                  name: m.full_name ?? "membro",
                  level: m.current_level ?? "explorador",
                  referral_code: m.referral_code ?? "",
                  visits_to_next: String(Math.max(0, 5 - (m.total_visits ?? 0))),
                };
                const render = (tpl: string | null | undefined) =>
                  (tpl ?? "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

                // Insert no log primeiro (unique constraint garante idempotência;
                // 23505 = já enviado → não-retriable).
                try {
                  await withRetry("insert-log", { user_id: m.user_id, step_id: s.id }, async () => {
                    const r = await supabaseAdmin
                      .from("clube_journey_log")
                      .insert({ user_id: m.user_id, step_id: s.id });
                    if (r.error) throw r.error;
                    return r;
                  });
                } catch (e: any) {
                  if (e?.code === "23505") { skipped++; continue; }
                  throw e;
                }

                try {
                  await withRetry("enqueue-outbox", { user_id: m.user_id, step_id: s.id }, async () => {
                    const r = await supabaseAdmin.from("message_outbox").insert({
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
                    if (r.error) throw r.error;
                    return r;
                  });
                  enqueued++;
                } catch (e) {
                  // Rollback do log para permitir retry no próximo tick
                  await supabaseAdmin
                    .from("clube_journey_log")
                    .delete()
                    .eq("user_id", m.user_id)
                    .eq("step_id", s.id);
                  throw e;
                }
              }
            } catch (innerErr: any) {
              errors.push({ user_id: m.user_id, message: innerErr?.message ?? String(innerErr) });
              console.error("[clube-journey-tick] member error", m.user_id, innerErr);
            }
          }

          const status = errors.length === 0 ? "success" : "partial";
          await supabaseAdmin.from("clube_cron_log").insert({
            job: "clube-journey-tick",
            status,
            enqueued,
            skipped,
            error_count: errors.length,
            error_message: errors.length ? errors[0].message : null,
            details: { errors: errors.slice(0, 50) } as any,
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          });

          if (errors.length) {
            await notifyAdmins(
              `Jornada do Clube com ${errors.length} falha(s)`,
              `Enfileiradas ${enqueued}, puladas ${skipped}. Primeiro erro: ${errors[0].message}`,
            );
          }

          return new Response(
            JSON.stringify({ ok: true, status, enqueued, skipped, errors: errors.length }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          console.error("[clube-journey-tick] fatal", e);
          try {
            await supabaseAdmin.from("clube_cron_log").insert({
              job: "clube-journey-tick",
              status: "error",
              enqueued,
              skipped,
              error_count: errors.length + 1,
              error_message: msg,
              details: { errors, fatal: true } as any,
              started_at: startedAt,
              finished_at: new Date().toISOString(),
            });
            await notifyAdmins("Cron da Jornada do Clube falhou", msg);
          } catch (logErr) {
            console.error("[clube-journey-tick] failed to log fatal error", logErr);
          }
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

async function notifyAdmins(title: string, message: string) {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (!admins?.length) return;
  const rows = admins.map((a: any) => ({
    user_id: a.user_id,
    category: "system",
    severity: "error",
    title,
    message,
    action_url: "/admin/clube?tab=cron",
    action_label: "Ver execuções",
  }));
  await supabaseAdmin.from("notifications").insert(rows);
}
