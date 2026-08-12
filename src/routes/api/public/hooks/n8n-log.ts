import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BodySchema = z.object({
  tenant_slug: z.string().min(1).max(120).optional(),
  workflow_slug: z.string().min(1).max(240).optional(),
  automation_key: z.string().min(1).max(200).optional(),
  n8n_execution_id: z.union([z.string(), z.number()]).optional(),
  correlation_id: z.string().max(240).optional(),
  workflow_name: z.string().min(1).max(240),
  workflow_version: z.string().max(50).optional(),
  regua: z.enum(["captacao", "conversao", "relacionamento", "retencao", "operational", "events", "payments", "outro"]),
  event_name: z.string().min(1).max(200),
  step: z.string().min(1).max(200),
  status: z.enum(["received", "queued", "running", "ok", "success", "succeeded", "completed", "retry", "failed", "error", "cancelled", "skipped", "suppressed"]),
  channel: z.enum(["email", "whatsapp", "slack", "internal", "api", "sms"]).optional(),
  http_status: z.number().int().min(0).max(599).optional(),
  latency_ms: z.number().int().min(0).max(600000).optional(),
  contact_email: z.string().email().max(320).optional(),
  contact_phone: z.string().max(40).optional(),
  lead_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  entity_type: z.string().max(80).optional(),
  entity_id: z.string().max(160).optional(),
  payload: z.record(z.unknown()).default({}),
  error: z.string().max(4000).optional(),
  idempotency_key: z.string().max(240).optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

type Body = z.infer<typeof BodySchema>;

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const normalized = signature.replace(/^sha256=/i, "").trim();
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(normalized, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Temporary compatibility only while legacy workflows are migrated to HMAC.
function legacyApiKeyAllowed(request: Request): boolean {
  if (process.env.N8N_ALLOW_LEGACY_ANON_HOOK !== "true") return false;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (!anon) return false;
  const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
  const auth = request.headers.get("authorization");
  return apikey === anon || auth === `Bearer ${anon}`;
}

function statusForLedger(status: Body["status"]): string | null {
  if (["received", "queued"].includes(status)) return "queued";
  if (["running", "retry"].includes(status)) return "running";
  if (["ok", "success", "succeeded", "completed", "skipped", "suppressed"].includes(status)) return "success";
  if (["failed", "error"].includes(status)) return "failed";
  if (status === "cancelled") return "cancelled";
  return null;
}

function legacyImpulsionandoSlug(body: Body): string | null {
  const normalized = body.workflow_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (!normalized.includes("impulsionando")) return null;
  const parts = normalized.split(/[·|]/).map((part) => part.trim()).filter(Boolean);
  const leaf = parts.at(-1)?.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!leaf) return null;
  return `impulsionando.${body.regua}.${leaf}`;
}

export const Route = createFileRoute("/api/public/hooks/n8n-log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET?.trim() ?? "";
        const signature = request.headers.get("x-impulsionando-signature");
        const authenticated = (!!secret && verifySignature(raw, signature, secret)) || legacyApiKeyAllowed(request);
        if (!authenticated) return new Response("Unauthorized", { status: 401 });

        let body: Body;
        try {
          body = BodySchema.parse(JSON.parse(raw));
        } catch (error) {
          return Response.json({ ok: false, error: "invalid_body", detail: (error as Error).message }, { status: 422 });
        }

        const ledgerStatus = statusForLedger(body.status);
        if (!ledgerStatus) return Response.json({ ok: true, ignored: true, reason: "non_terminal_status" });

        const correlationId = body.correlation_id || body.idempotency_key || `${body.workflow_name}:${body.step}:${Date.now()}`;
        const executionId = body.n8n_execution_id == null ? null : String(body.n8n_execution_id);
        const errorPayload = body.error
          ? {
              message: body.error,
              step: body.step,
              event_name: body.event_name,
              channel: body.channel ?? null,
              http_status: body.http_status ?? null,
              payload: body.payload,
            }
          : null;

        try {
          let runId: string | null = null;
          let workflowSlug = body.workflow_slug ?? legacyImpulsionandoSlug(body);

          if (workflowSlug) {
            const { data: registry } = await supabaseAdmin
              .from("n8n_workflow_registry")
              .select("workflow_slug")
              .eq("workflow_slug", workflowSlug)
              .order("version", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!registry) workflowSlug = undefined;
          }

          if (workflowSlug) {
            const { data, error } = await supabaseAdmin.rpc("record_n8n_registry_run" as never, {
              p_tenant_slug: body.tenant_slug ?? "impulsionando",
              p_workflow_slug: workflowSlug,
              p_correlation_id: correlationId,
              p_n8n_execution_id: executionId,
              p_status: ledgerStatus,
              p_started_at: body.started_at ?? new Date().toISOString(),
              p_finished_at: body.finished_at ?? (["success", "failed", "cancelled"].includes(ledgerStatus) ? new Date().toISOString() : null),
              p_error: errorPayload,
            } as never);
            if (error) throw error;
            runId = data as string;
          } else if (body.automation_key) {
            const { data, error } = await supabaseAdmin.rpc("record_n8n_workflow_run" as never, {
              p_tenant_slug: body.tenant_slug ?? "impulsionando",
              p_automation_key: body.automation_key,
              p_correlation_id: correlationId,
              p_n8n_execution_id: executionId,
              p_status: ledgerStatus,
              p_started_at: body.started_at ?? new Date().toISOString(),
              p_finished_at: body.finished_at ?? (["success", "failed", "cancelled"].includes(ledgerStatus) ? new Date().toISOString() : null),
              p_error: errorPayload,
            } as never);
            if (error) throw error;
            runId = data as string;
          } else {
            return Response.json({ ok: false, error: "workflow_not_mapped", workflow_name: body.workflow_name }, { status: 409 });
          }

          return Response.json({ ok: true, id: runId, workflow_slug: workflowSlug ?? null, automation_key: body.automation_key ?? null });
        } catch (error) {
          console.error("[n8n-log] failed", error);
          return Response.json({ ok: false, error: "workflow_run_record_failed" }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, auth: "hmac-sha256", ledger: "communication_workflow_runs" }),
    },
  },
});
