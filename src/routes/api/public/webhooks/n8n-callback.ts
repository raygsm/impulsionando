import { createFileRoute } from "@tanstack/react-router";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Endpoint de compatibilidade para workflows antigos.
 * Mantém o contrato legado, mas persiste no mesmo registry/ledger moderno
 * utilizado por /api/public/hooks/n8n-log.
 */
const Body = z.object({
  workflow: z.string().min(1).max(240),
  workflow_version: z.string().optional(),
  event: z.string().min(1).max(200),
  step: z.string().min(1).default("execute"),
  status: z.enum(["received", "ok", "retry", "failed", "skipped", "suppressed"]),
  tenant_id: z.string().uuid().optional(),
  tenant_slug: z.string().min(1).max(120).optional(),
  executionId: z.string().max(200).optional(),
  idempotency_key: z.string().max(240).optional(),
  error: z.string().max(4000).optional(),
  payload: z.record(z.string(), z.any()).optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

function validSignature(raw: string, signature: string, secret: string) {
  const normalized = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (!secret || !/^[a-f0-9]{64}$/i.test(normalized)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(normalized, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function mapStatus(status: z.infer<typeof Body>["status"]) {
  if (status === "ok") return "SUCCEEDED";
  if (status === "failed") return "FAILED";
  if (status === "skipped" || status === "suppressed") return "CANCELLED";
  return "RUNNING";
}

async function resolveTenantSlug(parsed: z.infer<typeof Body>) {
  if (parsed.tenant_slug) return parsed.tenant_slug;
  if (!parsed.tenant_id) return "impulsionando";
  const { data, error } = await supabaseAdmin
    .from("communication_tenants" as never)
    .select("slug" as never)
    .eq("id" as never, parsed.tenant_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("tenant_not_found");
  return String((data as any).slug);
}

export const Route = createFileRoute("/api/public/webhooks/n8n-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
        if (!secret) return new Response("Missing webhook secret", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-impulsionando-signature") ?? "";
        if (!validSignature(raw, signature, secret)) return new Response("Invalid signature", { status: 401 });

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(JSON.parse(raw));
        } catch (error) {
          return Response.json({ ok: false, error: "invalid_body", detail: (error as Error).message }, { status: 422 });
        }

        try {
          const tenantSlug = await resolveTenantSlug(parsed);
          const status = mapStatus(parsed.status);
          const terminal = status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
          const correlationId = parsed.idempotency_key
            ?? parsed.executionId
            ?? `${parsed.workflow}:${parsed.step}:${randomUUID()}`;

          const { data: runId, error } = await supabaseAdmin.rpc("record_n8n_registry_run" as never, {
            p_tenant_slug: tenantSlug,
            p_workflow_slug: parsed.workflow,
            p_correlation_id: correlationId,
            p_n8n_execution_id: parsed.executionId ?? null,
            p_status: status,
            p_started_at: parsed.started_at ?? new Date().toISOString(),
            p_finished_at: parsed.finished_at ?? (terminal ? new Date().toISOString() : null),
            p_error: parsed.error ? { message: parsed.error, event: parsed.event, step: parsed.step } : null,
          } as never);
          if (error) throw error;

          return Response.json({ ok: true, run_id: runId, status, compatibility_endpoint: true });
        } catch (error) {
          console.error("[n8n-callback] ledger failure", error);
          return Response.json({ ok: false, error: "ledger_write_failed" }, { status: 500 });
        }
      },
    },
  },
});
