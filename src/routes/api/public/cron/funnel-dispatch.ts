// Fase 10 — Despachador da régua de funil: dispara workflows N8N a partir
// da fila `core_funnel_dispatch_queue`. Chamado por pg_cron a cada minuto.
import { createFileRoute } from "@tanstack/react-router";

const N8N_BASE = process.env.N8N_BASE_URL ?? "";
const N8N_TOKEN = process.env.N8N_WEBHOOK_TOKEN ?? "";
const MAX_BATCH = 25;
const MAX_ATTEMPTS = 5;

export const Route = createFileRoute("/api/public/cron/funnel-dispatch")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("core_funnel_dispatch_queue")
          .select("id, workflow_name, stage, event_name, niche_slug, company_id, lead_id, entity_type, entity_id, contact_email, contact_phone, payload, attempts")
          .eq("status", "queued")
          .lte("scheduled_at", new Date().toISOString())
          .lt("attempts", MAX_ATTEMPTS)
          .order("scheduled_at", { ascending: true })
          .limit(MAX_BATCH);

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
        }

        if (!N8N_BASE) {
          return Response.json({ ok: false, reason: "N8N_BASE_URL not configured", pending: due?.length ?? 0 });
        }

        let sent = 0, failed = 0;
        for (const row of (due ?? []) as any[]) {
          const url = `${N8N_BASE.replace(/\/$/, "")}/webhook/${row.workflow_name}`;
          const idempotencyKey = `funnel:${row.id}`;
          const payload = {
            dispatch_id: row.id,
            stage: row.stage,
            event: row.event_name,
            niche_slug: row.niche_slug,
            company_id: row.company_id,
            lead_id: row.lead_id,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            contact_email: row.contact_email,
            contact_phone: row.contact_phone,
            data: row.payload ?? {},
          };
          const started = Date.now();
          let status: "sent" | "failed" = "failed";
          let http = 0; let errMsg: string | null = null;

          try {
            const headers: Record<string, string> = {
              "content-type": "application/json",
              "x-idempotency-key": idempotencyKey,
            };
            if (N8N_TOKEN) headers["authorization"] = `Bearer ${N8N_TOKEN}`;
            const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
            http = res.status;
            if (res.ok) { status = "sent"; sent++; }
            else { errMsg = `HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`; failed++; }
          } catch (e: any) {
            errMsg = String(e?.message ?? e).slice(0, 500);
            failed++;
          }

          await supabaseAdmin.from("core_funnel_dispatch_queue").update({
            status,
            attempts: (row.attempts ?? 0) + 1,
            sent_at: status === "sent" ? new Date().toISOString() : null,
            last_error: errMsg,
          }).eq("id", row.id);

          await supabaseAdmin.from("n8n_workflow_runs").insert({
            workflow_name: row.workflow_name,
            regua: row.stage,
            event_name: row.event_name,
            step: "dispatch",
            status,
            channel: "http",
            http_status: http || null,
            latency_ms: Date.now() - started,
            contact_email: row.contact_email,
            contact_phone: row.contact_phone,
            lead_id: row.lead_id,
            tenant_id: row.company_id,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            payload,
            error: errMsg,
            idempotency_key: idempotencyKey,
            started_at: new Date(started).toISOString(),
            finished_at: new Date().toISOString(),
          } as any);
        }

        return Response.json({ ok: true, processed: due?.length ?? 0, sent, failed });
      },
    },
  },
});
