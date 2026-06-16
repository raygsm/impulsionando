import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Endpoint público chamado pelos workflows N8N a cada step para registrar
 * trilha de auditoria (eventos, HMAC, chamadas de API/Z-API, sucessos e falhas).
 *
 * Auth: HMAC-SHA256 sobre o body cru, header `x-impulsionando-signature`,
 * chave em `IMPULSIONANDO_WEBHOOK_SECRET`. Fallback: apikey anon (compatível
 * com nosso padrão de hooks internos).
 *
 * Idempotência: `idempotency_key` (workflow_name + step + key) evita duplicar
 * quando o N8N reexecuta o mesmo node.
 */

const BodySchema = z.object({
  workflow_name: z.string().min(1).max(200),
  workflow_version: z.string().max(50).optional(),
  regua: z.enum(["captacao", "conversao", "relacionamento", "retencao", "outro"]),
  event_name: z.string().min(1).max(200),
  step: z.string().min(1).max(200),
  status: z.enum(["received", "ok", "retry", "failed", "skipped", "suppressed"]),
  channel: z.enum(["email", "whatsapp", "slack", "internal", "api", "sms"]).optional(),
  http_status: z.number().int().min(0).max(599).optional(),
  latency_ms: z.number().int().min(0).max(600000).optional(),
  contact_email: z.string().email().max(320).optional(),
  contact_phone: z.string().max(40).optional(),
  lead_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().max(120).optional(),
  payload: z.record(z.unknown()).default({}),
  error: z.string().max(2000).optional(),
  idempotency_key: z.string().max(200).optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function fallbackApiKey(request: Request): boolean {
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (!anon) return false;
  const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
  const auth = request.headers.get("authorization");
  return apikey === anon || (auth?.toLowerCase() === `bearer ${anon.toLowerCase()}`);
}

export const Route = createFileRoute("/api/public/hooks/n8n-log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET ?? "";
        const sig = request.headers.get("x-impulsionando-signature");
        const okHmac = !!secret && verifySignature(raw, sig, secret);
        const okKey = !okHmac && fallbackApiKey(request);
        if (!okHmac && !okKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        let parsed;
        try {
          parsed = BodySchema.parse(JSON.parse(raw));
        } catch (e) {
          return Response.json(
            { ok: false, error: "invalid_body", detail: (e as Error).message },
            { status: 422 },
          );
        }

        try {
          const row = {
            workflow_name: parsed.workflow_name,
            workflow_version: parsed.workflow_version ?? null,
            regua: parsed.regua,
            event_name: parsed.event_name,
            step: parsed.step,
            status: parsed.status,
            channel: parsed.channel ?? null,
            http_status: parsed.http_status ?? null,
            latency_ms: parsed.latency_ms ?? null,
            contact_email: parsed.contact_email?.toLowerCase() ?? null,
            contact_phone: parsed.contact_phone ?? null,
            lead_id: parsed.lead_id ?? null,
            tenant_id: parsed.tenant_id ?? null,
            entity_type: parsed.entity_type ?? null,
            entity_id: parsed.entity_id ?? null,
            payload: parsed.payload as Record<string, unknown>,
            error: parsed.error ?? null,
            idempotency_key: parsed.idempotency_key ?? null,
            started_at: parsed.started_at ?? new Date().toISOString(),
            finished_at: parsed.finished_at ?? null,
          };

          // Idempotência: se vier idempotency_key, checa existência antes de inserir
          // (o índice único é parcial, então não dá pra usar upsert via PostgREST).
          if (parsed.idempotency_key) {
            const { data: existing, error: selErr } = await supabaseAdmin
              .from("n8n_workflow_runs")
              .select("id")
              .eq("workflow_name", parsed.workflow_name)
              .eq("step", parsed.step)
              .eq("idempotency_key", parsed.idempotency_key)
              .maybeSingle();
            if (selErr) throw selErr;
            if (existing) {
              return Response.json({ ok: true, duplicate: true, id: existing.id });
            }
          }
          const { error } = await supabaseAdmin.from("n8n_workflow_runs").insert(row as never);
          if (error) throw error;

          // Alerta de falha crítica → notifica staff (in-app) quando step terminou em failed.
          if (parsed.status === "failed") {
            try {
              await supabaseAdmin.rpc("notify_user" as never, {
                p_user_id: null,
                p_company_id: null,
                p_category: "system",
                p_severity: "error",
                p_title: `N8N falhou: ${parsed.workflow_name}`,
                p_message: `${parsed.step} • ${parsed.error ?? "erro desconhecido"}`,
                p_action_url: "/core/integracoes/n8n",
                p_action_label: "Abrir trilha",
              } as never);
            } catch {
              // notify_user pode não estar disponível para broadcast — ignoramos.
            }
          }

          return Response.json({ ok: true });
        } catch (e) {
          return Response.json(
            { ok: false, error: (e as Error).message },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        Response.json({
          ok: true,
          usage:
            "POST with x-impulsionando-signature (HMAC-SHA256 over raw body) and the schema documented in docs/n8n/README.md",
        }),
    },
  },
});
