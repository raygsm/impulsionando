import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Lista cotações "frias" do RioMed (status sent/draft sem won_at, parados há N dias).
 * Usado pelo workflow N8N `riomed-03-cotacao-fria` para reengajar via WhatsApp.
 */
const BodySchema = z
  .object({
    company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
    cold_days: z.number().int().min(1).max(180).default(7),
    limit: z.number().int().min(1).max(200).default(50),
  })
  .default({});

export const Route = createFileRoute("/api/public/riomed/quotes/cold")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifyRiomedWebhook(request, raw)) return new Response("Unauthorized", { status: 401 });

        let parsed;
        try {
          parsed = BodySchema.parse(raw ? JSON.parse(raw) : {});
        } catch (e) {
          return Response.json({ ok: false, error: "invalid_body", detail: (e as Error).message }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoff = new Date(Date.now() - parsed.cold_days * 86400_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("riomed_quotes")
          .select("id, code, customer_id, lead_id, total, currency, status, sent_at, updated_at, channel")
          .eq("company_id", parsed.company_id)
          .in("status", ["sent", "draft", "negotiating"])
          .is("won_at", null)
          .lte("updated_at", cutoff)
          .order("updated_at", { ascending: true })
          .limit(parsed.limit);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, count: data?.length ?? 0, quotes: data ?? [] });
      },
      GET: async () => Response.json({ ok: true, usage: "POST { cold_days, limit } com x-impulsionando-signature" }),
    },
  },
});
