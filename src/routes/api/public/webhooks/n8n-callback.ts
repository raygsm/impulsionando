import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const Body = z.object({
  workflow: z.string().min(1),
  workflow_version: z.string().optional(),
  event: z.string().min(1),
  step: z.string().min(1).default("execute"),
  status: z.enum(["received", "ok", "retry", "failed", "skipped", "suppressed"]),
  niche_slug: z.string().optional().nullable(),
  channel: z.enum(["email", "whatsapp", "slack", "internal", "api", "sms"]).optional(),
  http_status: z.number().int().optional(),
  latency_ms: z.number().int().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  lead_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  executionId: z.string().optional(),
  idempotency_key: z.string().optional(),
  error: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
  finished_at: z.string().datetime().optional(),
});

const STAGE_TO_REGUA: Record<string, string> = {
  capture: "captacao",
  convert: "conversao",
  relate: "relacionamento",
  retain: "retencao",
  expand: "outro",
};

function inferRegua(event: string): string {
  const e = event.toLowerCase();
  if (e.includes("lead") || e.includes("capture") || e.includes("captacao")) return "captacao";
  if (e.includes("checkout") || e.includes("trial") || e.includes("convert") || e.includes("won")) return "conversao";
  if (e.includes("nps") || e.includes("birthday") || e.includes("reminder") || e.includes("relate")) return "relacionamento";
  if (e.includes("overdue") || e.includes("cancel") || e.includes("winback") || e.includes("retain") || e.includes("no_visit")) return "retencao";
  return "outro";
}

export const Route = createFileRoute("/api/public/webhooks/n8n-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Missing IMPULSIONANDO_WEBHOOK_SECRET", { status: 500 });
        }

        const raw = await request.text();
        const signature = request.headers.get("x-impulsionando-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(JSON.parse(raw));
        } catch (err: any) {
          return Response.json({ error: "invalid_body", detail: err?.message }, { status: 400 });
        }

        const regua = STAGE_TO_REGUA[parsed.niche_slug ?? ""] ?? inferRegua(parsed.event);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const row = {
          workflow_name: parsed.workflow,
          workflow_version: parsed.workflow_version ?? null,
          regua,
          event_name: parsed.event,
          step: parsed.step,
          status: parsed.status,
          channel: parsed.channel ?? null,
          http_status: parsed.http_status ?? null,
          latency_ms: parsed.latency_ms ?? null,
          contact_email: parsed.contact_email ?? null,
          contact_phone: parsed.contact_phone ?? null,
          lead_id: parsed.lead_id ?? null,
          tenant_id: parsed.tenant_id ?? null,
          entity_type: parsed.entity_type ?? null,
          entity_id: parsed.entity_id ?? null,
          payload: { ...(parsed.payload ?? {}), niche_slug: parsed.niche_slug ?? null, executionId: parsed.executionId ?? null },
          error: parsed.error ?? null,
          idempotency_key: parsed.idempotency_key ?? parsed.executionId ?? null,
          finished_at: parsed.finished_at ?? new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from("n8n_workflow_runs")
          .upsert(row as any, { onConflict: "workflow_name,step,idempotency_key", ignoreDuplicates: false });

        if (error) {
          console.error("[n8n-callback] insert failed", error);
          return Response.json({ error: "db_insert_failed", detail: error.message }, { status: 500 });
        }

        // Alert on failure (incident row + optional Slack ping)
        if (parsed.status === "failed") {
          try {
            await notifyFailure(supabaseAdmin, {
              workflow: parsed.workflow,
              event: parsed.event,
              niche_slug: parsed.niche_slug ?? null,
              error: parsed.error ?? null,
              tenant_id: parsed.tenant_id ?? null,
              executionId: parsed.executionId ?? null,
            });
          } catch (e) {
            console.error("[n8n-callback] notifyFailure failed", e);
          }
        }

        return Response.json({ ok: true });
      },
    },
    },
  },
});

async function notifyFailure(
  supabaseAdmin: any,
  ctx: {
    workflow: string;
    event: string;
    niche_slug: string | null;
    error: string | null;
    tenant_id: string | null;
    executionId: string | null;
  },
) {
  const title = `N8N failure: ${ctx.workflow} (${ctx.event})`;
  const description = [
    ctx.niche_slug ? `Nicho: ${ctx.niche_slug}` : "Global",
    ctx.error ? `Erro: ${ctx.error}` : null,
    ctx.executionId ? `Execução: ${ctx.executionId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // 1) Persist incident (dedupe by open+title within 30min via metadata)
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("core_incidents")
    .select("id, event_count")
    .eq("status", "open")
    .eq("title", title)
    .gte("detected_at", since)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin
      .from("core_incidents")
      .update({
        event_count: (existing.event_count ?? 1) + 1,
        updated_at: new Date().toISOString(),
        metadata: { last_error: ctx.error, last_execution: ctx.executionId, tenant_id: ctx.tenant_id },
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("core_incidents").insert({
      scope: "runtime_scope",
      runtime_scope: `n8n:${ctx.niche_slug ?? "global"}:${ctx.event}`,
      severity: "sev3",
      status: "open",
      title,
      description,
      source: "n8n",
      metadata: {
        workflow: ctx.workflow,
        event: ctx.event,
        niche_slug: ctx.niche_slug,
        error: ctx.error,
        executionId: ctx.executionId,
        tenant_id: ctx.tenant_id,
      },
    });
  }

  // 2) Best-effort Slack ping when SLACK_OPS_WEBHOOK is configured
  const slackWebhook = process.env.SLACK_OPS_WEBHOOK;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `:rotating_light: *${title}*\n${description}`,
        }),
      });
    } catch (e) {
      console.error("[n8n-callback] slack post failed", e);
    }
  }
}
