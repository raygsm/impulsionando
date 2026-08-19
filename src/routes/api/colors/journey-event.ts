import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { z } from "zod";

const allowedEvents = z.enum([
  "PAGE_VIEW",
  "PRODUCT_VIEW",
  "CTA_CLICK",
  "WHATSAPP_CLICK",
  "PRECHECKOUT_OPENED",
  "CHECKOUT_CLICKED",
  "LEAD_SUBMITTED",
  "CHECKOUT_STARTED",
  "CHECKOUT_ABANDON_SIGNAL",
]);

const schema = z.object({
  event: allowedEvents,
  sessionId: z.string().max(120).optional(),
  visitorId: z.string().max(120).optional(),
  host: z.string().max(200).optional(),
  path: z.string().max(500).optional(),
  productSlug: z.string().max(120).optional(),
  productName: z.string().max(200).optional(),
  origin: z.string().max(160).optional(),
  target: z.string().max(500).optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  affiliateCode: z.string().max(120).optional(),
});

export const Route = createFileRoute("/api/colors/journey-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try { raw = await request.json(); } catch { return Response.json({ ok: false, erro: "Dados inválidos." }, { status: 400 }); }
        const parsed = schema.safeParse(raw);
        if (!parsed.success) return Response.json({ ok: false, erro: "Evento inválido." }, { status: 400 });

        const d = parsed.data;
        if (d.host && d.host !== "colorssaude.impulsionando.com.br") {
          return Response.json({ ok: false, erro: "Origem não autorizada." }, { status: 403 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb: any = supabaseAdmin;
        const eventId = `web:${d.event.toLowerCase()}:${d.sessionId ?? "anon"}:${Date.now()}:${randomUUID().slice(0, 8)}`;
        const payload = {
          source: "colors_web",
          session_id: d.sessionId ?? null,
          visitor_id: d.visitorId ?? null,
          host: d.host ?? "colorssaude.impulsionando.com.br",
          path: d.path ?? "/",
          product_slug: d.productSlug ?? null,
          product_name: d.productName ?? null,
          origin: d.origin ?? null,
          target: d.target ?? null,
          affiliate_code: d.affiliateCode ?? null,
          utm: {
            utm_source: d.utmSource ?? null,
            utm_medium: d.utmMedium ?? null,
            utm_campaign: d.utmCampaign ?? null,
            utm_content: d.utmContent ?? null,
            utm_term: d.utmTerm ?? null,
          },
        };

        const { error } = await sb.from("colors_event_bus").insert({
          event_id: eventId,
          event_type: d.event,
          aggregate_type: "web_session",
          aggregate_id: d.sessionId ?? d.visitorId ?? eventId,
          payload,
        });
        if (error) {
          console.error("[Colors journey] insert failed", error);
          return Response.json({ ok: false, erro: "Não foi possível registrar a jornada." }, { status: 500 });
        }
        return Response.json({ ok: true, eventId });
      },
    },
  },
});
