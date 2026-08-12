import { createFileRoute } from "@tanstack/react-router";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Callback de auditoria do n8n.
 *
 * Segurança:
 * - exige HMAC-SHA256 do body cru em `x-impulsionando-signature`;
 * - não aceita chave anônima/publicável do Supabase como autenticação;
 * - persiste por RPC service-role no ledger único `communication_workflow_runs`.
 */
const BodySchema = z.object({
  workflow_name: z.string().min(1).max(240),
  workflow_version: z.string().max(50).optional(),
  tenant_slug: z.string().min(1).max(120).default("impulsionando"),
  n8n_execution_id: z.string().max(200).optional(),
  regua: z.enum(["captacao", "conversao", "relacionamento", "retencao", "outro"]).optional(),
  event_name: z.string().max(200).optional(),
  step: z.string().max(200).optional(),
  status: z.enum(["received", "running", "ok", "retry", "failed", "skipped", "suppressed"]),
  channel: z.enum(["email", "whatsapp", "slack", "internal", "api", "sms"]).optional(),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().max(120).optional(),
  payload: z.record(z.unknown()).default({}),
  error: z.string().max(4000).optional(),
  idempotency_key: z.string().max(240).optional(),
  correlation_id: z.string().max(240).optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const normalized = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(normalized, "hex");
  const wanted = Buffer.from(expected, "hex");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function ledgerStatus(status: z.infer<typeof BodySchema>["status"]) {
  switch (status) {
    case "ok": return "SUCCEEDED";
    case "failed": return "FAILED";
    case "skipped":
    case "suppressed": return "CANCELLED";
    case "received":
    case "running":
    case "retry":
    default: return "RUNNING";
  }
}

export const Route = createFileRoute("/api/public/hooks/n8n-log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
        if (!secret) return new Response("Webhook secret not configured", { status: 503 });

        const signature = request.headers.get("x-impulsionando-signature");
        if (!verifySignature(raw, signature, secret)) return new Response("Unauthorized", { status: 401 });

        let parsed: z.infer<typeof BodySchema>;
        try {
          parsed = BodySchema.parse(JSON.parse(raw));
        } catch (error) {
          return Response.json({ ok: false, error: "invalid_body", detail: (error as Error).message }, { status: 422 });
        }

        const correlationId = parsed.correlation_id
          ?? parsed.idempotency_key
          ?? parsed.n8n_execution_id
          ?? `${parsed.workflow_name}:${parsed.step ?? parsed.event_name ?? "run"}:${randomUUID()}`;

        const status = ledgerStatus(parsed.status);
        const finishedAt = parsed.finished_at
          ?? (status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED" ? new Date().toISOString() : null);
        const errorPayload = parsed.error
          ? { message: parsed.error, step: parsed.step ?? null, event_name: parsed.event_name ?? null }
          : null;

        const { data: runId, error } = await supabaseAdmin.rpc("record_n8n_registry_run" as never, {
          p_tenant_slug: parsed.tenant_slug,
          p_workflow_slug: parsed.workflow_name,
          p_correlation_id: correlationId,
          p_n8n_execution_id: parsed.n8n_execution_id ?? null,
          p_status: status,
          p_started_at: parsed.started_at ?? new Date().toISOString(),
          p_finished_at: finishedAt,
          p_error: errorPayload,
        } as never);

        if (error) {
          const notFound = /workflow|registry|tenant/i.test(error.message) && /not|missing|found/i.test(error.message);
          return Response.json(
            { ok: false, error: notFound ? "workflow_not_registered" : "ledger_write_failed" },
            { status: notFound ? 404 : 500 },
          );
        }

        if (status === "FAILED") {
          try {
            await supabaseAdmin.rpc("notify_user" as never, {
              p_user_id: null,
              p_company_id: null,
              p_category: "system",
              p_severity: "error",
              p_title: `n8n falhou: ${parsed.workflow_name}`,
              p_message: `${parsed.step ?? parsed.event_name ?? "execução"} • ${parsed.error ?? "erro sem detalhe"}`,
              p_action_url: "/admin/integracoes/n8n",
              p_action_label: "Abrir execuções",
            } as never);
          } catch {
            // A falha de notificação não invalida o registro já persistido.
          }
        }

        return Response.json({ ok: true, run_id: runId, status });
      },
      GET: async () => Response.json({ ok: true, auth: "hmac", ledger: "communication_workflow_runs" }),
    },
  },
});