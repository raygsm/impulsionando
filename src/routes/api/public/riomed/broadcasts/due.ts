import { createFileRoute } from "@tanstack/react-router";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * GET /api/public/riomed/broadcasts/due?limit=50
 * Retorna broadcasts em status 'queued' prontos para envio pelo N8N.
 */
export const Route = createFileRoute("/api/public/riomed/broadcasts/due")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!verifyRiomedWebhook(request, "")) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("riomed_whatsapp_broadcasts")
          .select("id, campaign_id, recipient_phone, recipient_name, message, customer_id")
          .eq("company_id", RIOMED_COMPANY_ID)
          .eq("status", "queued")
          .order("created_at", { ascending: true })
          .limit(limit);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, count: data?.length ?? 0, broadcasts: data ?? [] });
      },
    },
  },
});
