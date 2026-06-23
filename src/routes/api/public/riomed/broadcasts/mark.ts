import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * POST /api/public/riomed/broadcasts/mark
 * N8N reporta resultado do envio do WhatsApp.
 */
const BodySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["sending", "sent", "delivered", "read", "failed", "replied"]),
  provider_message_id: z.string().max(200).optional(),
  error: z.string().max(2000).optional(),
});

export const Route = createFileRoute("/api/public/riomed/broadcasts/mark")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifyRiomedWebhook(request, raw)) return new Response("Unauthorized", { status: 401 });

        let body;
        try {
          body = BodySchema.parse(JSON.parse(raw));
        } catch (e) {
          return Response.json({ ok: false, error: "invalid_body", detail: (e as Error).message }, { status: 422 });
        }

        const now = new Date().toISOString();
        const patch: Record<string, unknown> = {
          status: body.status,
          provider_message_id: body.provider_message_id ?? null,
          error: body.error ?? null,
        };
        if (body.status === "sent") patch.sent_at = now;
        if (body.status === "delivered") patch.delivered_at = now;
        if (body.status === "replied") patch.replied_at = now;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("riomed_whatsapp_broadcasts")
          .update(patch as never)
          .eq("id", body.id);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
