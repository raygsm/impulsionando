import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Enfileira e-mail na message_outbox. Worker da plataforma despacha pelo
 * provedor (Resend/SES). Compatível com nós HTTP Request do N8N.
 */
const BodySchema = z.object({
  company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
  to: z.string().email().max(320),
  name: z.string().max(200).optional(),
  subject: z.string().min(1).max(300),
  html: z.string().max(200_000).optional(),
  text: z.string().max(50_000).optional(),
  template_id: z.string().uuid().optional(),
  event_code: z.string().max(120).default("n8n.email.send"),
  reference_type: z.string().max(50).optional(),
  reference_id: z.string().max(120).optional(),
  scheduled_at: z.string().datetime().optional(),
  payload: z.record(z.unknown()).default({}),
});

export const Route = createFileRoute("/api/public/email/send")({
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

        if (!parsed.html && !parsed.text && !parsed.template_id) {
          return Response.json({ ok: false, error: "missing_body: informe html, text ou template_id" }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("message_outbox")
          .insert({
            company_id: parsed.company_id,
            channel: "email",
            event_code: parsed.event_code,
            template_id: parsed.template_id ?? null,
            recipient_email: parsed.to.toLowerCase(),
            recipient_name: parsed.name ?? null,
            subject: parsed.subject,
            body: parsed.html ?? parsed.text ?? "",
            payload: { ...(parsed.payload as Record<string, unknown>), text: parsed.text, html: parsed.html },
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
      GET: async () => Response.json({ ok: true, usage: "POST { to, subject, html|text|template_id, name? } com x-impulsionando-signature" }),
    },
  },
});
