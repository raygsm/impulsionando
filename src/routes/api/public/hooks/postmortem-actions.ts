import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Postmortem Action Items dispatcher — cron hook.
 *
 * Para cada incidente resolvido com postmortem publicado:
 *  - varre `postmortem_action_items` (JSONB array de { title, owner, due_at, done }).
 *  - para itens não concluídos cujo `due_at` está <= D+2 e ainda não enfileirados,
 *    cria evento no `message_outbox` (canal `inapp`) para a equipe Impulsionando.
 *  - dedupe por `reference_type='postmortem_action'` + `reference_id='<incident_id>#<idx>'`.
 *
 * Roda a cada 6h (pg_cron `postmortem_actions_tick`).
 */

type ActionItem = {
  title?: string;
  owner?: string | null;
  due_at?: string | null;
  done?: boolean;
};

export const Route = createFileRoute("/api/public/hooks/postmortem-actions")({
  server: {
    handlers: {
      POST: async () => run(),
      GET: async () => run(),
    },
  },
});

async function run() {
  const started = Date.now();
  const horizonMs = 2 * 86400000;
  const now = Date.now();

  const { data: rows, error } = await supabaseAdmin
    .from("core_incidents")
    .select("id, scope, url, severity, title, postmortem_action_items, postmortem_published_at")
    .eq("status", "resolved")
    .not("postmortem_published_at", "is", null)
    .gte(
      "postmortem_published_at",
      new Date(Date.now() - 180 * 86400000).toISOString(),
    )
    .limit(500);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  let queued = 0;
  let skipped = 0;
  let overdue = 0;

  for (const inc of rows ?? []) {
    const items = Array.isArray((inc as any).postmortem_action_items)
      ? ((inc as any).postmortem_action_items as ActionItem[])
      : [];
    if (!items.length) continue;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx] ?? {};
      if (item.done) continue;
      if (!item.title) continue;

      const due = item.due_at ? Date.parse(item.due_at) : NaN;
      if (!Number.isFinite(due)) {
        skipped++;
        continue;
      }
      if (due - now > horizonMs) {
        skipped++;
        continue;
      }
      const isOverdue = due < now;
      if (isOverdue) overdue++;

      const refId = `${(inc as any).id}#${idx}`;

      // Dedup: already enqueued?
      const { data: existing } = await supabaseAdmin
        .from("message_outbox")
        .select("id")
        .eq("reference_type", "postmortem_action")
        .eq("reference_id", refId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const label = isOverdue ? "VENCIDA" : "vence em breve";
      const subject = `[Postmortem] Ação ${label}: ${item.title}`;
      const body =
        `Incidente: ${(inc as any).title}\n` +
        `Severidade: ${(inc as any).severity}\n` +
        `Escopo: ${(inc as any).scope}${(inc as any).url ? ` (${(inc as any).url})` : ""}\n` +
        `Responsável: ${item.owner ?? "—"}\n` +
        `Prazo: ${item.due_at ?? "—"}\n` +
        `Ação: ${item.title}`;

      const { error: insErr } = await supabaseAdmin.from("message_outbox").insert({
        event_code: "postmortem.action_due",
        channel: "inapp",
        subject,
        body,
        status: "pending",
        scheduled_at: new Date().toISOString(),
        max_attempts: 3,
        reference_type: "postmortem_action",
        reference_id: refId,
        payload: {
          incident_id: (inc as any).id,
          action_index: idx,
          owner: item.owner ?? null,
          due_at: item.due_at ?? null,
          overdue: isOverdue,
          severity: (inc as any).severity,
          scope: (inc as any).scope,
          url: (inc as any).url ?? null,
        },
      });

      if (insErr) {
        // Don't abort — keep processing remaining items.
        continue;
      }
      queued++;
    }
  }

  return json({
    ok: true,
    queued,
    skipped,
    overdue,
    incidents_scanned: rows?.length ?? 0,
    duration_ms: Date.now() - started,
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
