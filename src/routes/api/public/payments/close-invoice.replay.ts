/**
 * Endpoint público (autenticado por bearer master/admin) que reexecuta um
 * evento de close-invoice respeitando idempotência. Útil para integrações
 * automatizadas que precisam disparar replay sem passar pela UI.
 *
 * POST /api/public/payments/close-invoice/replay
 *   - Header `x-replay-secret` deve bater com IMPULSIONANDO_WEBHOOK_SECRET
 *     (segredo interno; nunca exposto ao cliente).
 *   - Body: { id: uuid, reason: string }
 *
 * Resposta: { ok, rpc, result } ou { duplicate: true } se já tiver sido
 * marcado como pago (RPCs `mark_*_paid` já são idempotentes).
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

const Body = z.object({
  id: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

const RPC_BY_KIND: Record<string, string> = {
  consumer: "mark_membership_invoice_paid",
  erp: "mark_billing_invoice_paid",
  table: "restaurant_mark_table_invoice_paid",
};

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/payments/close-invoice/replay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.IMPULSIONANDO_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }
        const provided = request.headers.get("x-replay-secret") ?? "";
        if (!safeEq(provided, secret)) {
          return new Response("unauthorized", { status: 401 });
        }
        let body: z.infer<typeof Body>;
        try {
          body = Body.parse(await request.json());
        } catch (e: any) {
          return Response.json({ error: "invalid_payload", detail: e?.message }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row, error } = await supabaseAdmin
          .from("webhook_event_log")
          .select("id, source, target_kind, target_id, replay_count, status")
          .eq("id", body.id)
          .maybeSingle();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!row) return Response.json({ error: "not_found" }, { status: 404 });
        if (row.source !== "close-invoice") {
          return Response.json({ error: "unsupported_source" }, { status: 400 });
        }
        const rpc = RPC_BY_KIND[row.target_kind ?? ""];
        if (!rpc) return Response.json({ error: "unknown_kind" }, { status: 400 });

        // marca replay (auditoria)
        await supabaseAdmin
          .from("webhook_event_log")
          .update({
            replay_count: (row.replay_count ?? 0) + 1,
            replay_reason: body.reason,
            replayed_at: new Date().toISOString(),
            status: "replayed",
          })
          .eq("id", body.id);

        const { data: rpcRes, error: rpcErr } = await (supabaseAdmin as any).rpc(rpc, {
          _invoice_id: row.target_id,
        });
        if (rpcErr) {
          await supabaseAdmin
            .from("webhook_event_log")
            .update({ status: "error", error: rpcErr.message })
            .eq("id", body.id);
          return Response.json({ error: rpcErr.message }, { status: 500 });
        }
        await supabaseAdmin
          .from("webhook_event_log")
          .update({
            result: { ok: true, rpc, data: rpcRes, replay: true },
            status: "processed",
            error: null,
          })
          .eq("id", body.id);

        return Response.json({ ok: true, rpc, result: rpcRes });
      },
    },
  },
});
