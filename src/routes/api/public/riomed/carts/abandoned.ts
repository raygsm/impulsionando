import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Carrinhos abandonados do RioMed. Workflow N8N `riomed-04-recuperacao-carrinho`
 * decide se aciona vendedor (alto valor) ou e-mail de recuperação.
 */
const BodySchema = z
  .object({
    company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
    idle_minutes: z.number().int().min(5).max(10080).default(30),
    high_value_threshold: z.number().nonnegative().default(2000),
    limit: z.number().int().min(1).max(200).default(50),
  })
  .default({});

export const Route = createFileRoute("/api/public/riomed/carts/abandoned")({
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
        const cutoff = new Date(Date.now() - parsed.idle_minutes * 60_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("riomed_public_carts")
          .select("id, session_token, customer_id, user_id, status, modality, currency, subtotal, total, items_count, updated_at")
          .eq("company_id", parsed.company_id)
          .in("status", ["open", "active", "pending"])
          .gt("items_count", 0)
          .lte("updated_at", cutoff)
          .order("updated_at", { ascending: true })
          .limit(parsed.limit);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        const carts = (data ?? []).map((c) => ({
          ...c,
          tier: Number(c.total ?? 0) >= parsed.high_value_threshold ? "high_value" : "standard",
        }));
        return Response.json({ ok: true, count: carts.length, carts });
      },
      GET: async () => Response.json({ ok: true, usage: "POST { idle_minutes, high_value_threshold, limit } com x-impulsionando-signature" }),
    },
  },
});
