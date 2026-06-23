import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Receptor de eventos operacionais do N8N para o RioMed.
 * Grava em riomed_operational_events para auditoria + métricas.
 */
const BodySchema = z.object({
  company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
  source: z.string().min(1).max(120).default("n8n"),
  event_code: z.string().min(1).max(120),
  level: z.enum(["debug", "info", "warning", "error", "critical"]).default("info"),
  message: z.string().max(2000).optional(),
  correlation_id: z.string().max(200).optional(),
  payload: z.record(z.unknown()).default({}),
});

export const Route = createFileRoute("/api/public/riomed/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifyRiomedWebhook(request, raw)) return new Response("Unauthorized", { status: 401 });

        let parsed;
        try {
          parsed = BodySchema.parse(JSON.parse(raw));
        } catch (e) {
          return Response.json({ ok: false, error: "invalid_body", detail: (e as Error).message }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("riomed_operational_events")
          .insert({
            company_id: parsed.company_id,
            source: parsed.source,
            event_code: parsed.event_code,
            level: parsed.level,
            message: parsed.message ?? null,
            correlation_id: parsed.correlation_id ?? null,
            payload: parsed.payload as Record<string, unknown>,
          } as never)
          .select("id")
          .single();

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, id: (data as { id: string }).id });
      },
      GET: async () => Response.json({ ok: true, usage: "POST { event_code, level?, message?, payload? } com x-impulsionando-signature" }),
    },
  },
});
