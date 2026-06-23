import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * POST /api/public/riomed/fx/upsert
 * Registra nova cotação USD→BOB capturada pelo N8N. Desativa as anteriores.
 */
const BodySchema = z.object({
  rate: z.number().positive().max(100),
  source: z.string().min(1).max(120).default("n8n"),
  metadata: z.record(z.unknown()).default({}),
});

export const Route = createFileRoute("/api/public/riomed/fx/upsert")({
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Desativa cotações anteriores
        const { error: deactivateError } = await supabaseAdmin
          .from("cotacao_bob_usd")
          .update({ is_active: false } as never)
          .eq("is_active", true);
        if (deactivateError) return Response.json({ ok: false, error: deactivateError.message }, { status: 500 });

        const { data, error } = await supabaseAdmin
          .from("cotacao_bob_usd")
          .insert({
            rate: body.rate,
            source: body.source,
            metadata: body.metadata as Record<string, unknown>,
            is_active: true,
          } as never)
          .select("id, rate, captured_at")
          .single();

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, ...(data as object) });
      },
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("cotacao_bob_usd")
          .select("rate, source, captured_at, metadata")
          .eq("is_active", true)
          .order("captured_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return Response.json({ ok: true, current: data });
      },
    },
  },
});
