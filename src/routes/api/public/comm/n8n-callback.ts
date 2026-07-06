/**
 * /api/public/comm/n8n-callback — recebe o retorno assinado do n8n para
 * marcar dispatches como delivered/failed/read.
 *
 * Assinatura: HMAC SHA-256 sobre o body cru, com secret armazenado na env
 * apontada por core_comm_channel_config.n8n_secret_ref do tenant que
 * originou o dispatch.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/comm/n8n-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-impulsionando-signature") ?? "";
        const raw = await request.text();
        let body: {
          dispatch_id?: string;
          status?: "sent" | "delivered" | "failed" | "read";
          provider_message_id?: string;
          error?: string;
          meta?: Record<string, unknown>;
        };
        try { body = JSON.parse(raw); } catch { return new Response("bad_json", { status: 400 }); }
        if (!body.dispatch_id || !body.status) return new Response("bad_payload", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        const { data: dispatch } = await admin
          .from("core_comm_dispatches")
          .select("id, company_id")
          .eq("id", body.dispatch_id)
          .maybeSingle();
        if (!dispatch) return new Response("dispatch_not_found", { status: 404 });

        const { data: cfg } = await admin
          .from("core_comm_channel_config")
          .select("n8n_secret_ref")
          .eq("company_id", dispatch.company_id)
          .eq("channel", "n8n")
          .maybeSingle();
        const secret = cfg?.n8n_secret_ref ? process.env[cfg.n8n_secret_ref] ?? "" : "";
        if (!secret) return new Response("no_secret_configured", { status: 401 });

        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("invalid_signature", { status: 401 });
        }

        const patch: Record<string, unknown> = { last_error: body.error ?? null };
        if (body.status === "sent" || body.status === "delivered") {
          patch.status = body.status;
          patch.sent_at = new Date().toISOString();
          if (body.provider_message_id) patch.provider_message_id = body.provider_message_id;
        } else if (body.status === "failed") {
          patch.status = "failed";
        }
        await admin.from("core_comm_dispatches").update(patch).eq("id", body.dispatch_id);
        await admin.from("core_comm_delivery_events").insert({
          dispatch_id: body.dispatch_id,
          event_type: body.status,
          channel: "n8n",
          payload: { meta: body.meta ?? null, provider_message_id: body.provider_message_id ?? null },
          error: body.error ?? null,
        });
        return Response.json({ ok: true });
      },
    },
  },
});
