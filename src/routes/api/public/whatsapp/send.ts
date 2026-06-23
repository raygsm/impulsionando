import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Enfileira mensagem de WhatsApp na message_outbox. Worker da plataforma despacha
 * pelo provedor configurado (Z-API/Meta). Compatível com nós HTTP Request do N8N.
 */
const BodySchema = z.object({
  company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
  to: z.string().min(8).max(40),
  name: z.string().max(200).optional(),
  message: z.string().min(1).max(4000),
  template_id: z.string().uuid().optional(),
  event_code: z.string().max(120).default("n8n.whatsapp.send"),
  reference_type: z.string().max(50).optional(),
  reference_id: z.string().max(120).optional(),
  scheduled_at: z.string().datetime().optional(),
  payload: z.record(z.unknown()).default({}),
});

export const Route = createFileRoute("/api/public/whatsapp/send")({
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
          .from("message_outbox")
          .insert({
            company_id: parsed.company_id,
            channel: "whatsapp",
            event_code: parsed.event_code,
            template_id: parsed.template_id ?? null,
            recipient_phone: parsed.to,
            recipient_name: parsed.name ?? null,
            body: parsed.message,
            payload: parsed.payload as Record<string, unknown>,
            reference_type: parsed.reference_type ?? null,
            reference_id: parsed.reference_id ?? null,
            scheduled_at: parsed.scheduled_at ?? new Date().toISOString(),
            status: "pending",
          } as never)
          .select("id")
          .single();

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, queued: true, id: (data as { id: string }).id });
      },
      GET: async () => Response.json({ ok: true, usage: "POST { to, message, name?, template_id?, reference_*? } com x-impulsionando-signature" }),
    },
  },
});
