import { createFileRoute } from "@tanstack/react-router";

// Periodic processor for public.message_outbox.
// Protected by a shared secret (OUTBOX_PROCESS_SECRET) passed via the
// `x-outbox-secret` header. pg_cron pings this endpoint every minute via
// net.http_post; external callers without the secret are rejected.

export const Route = createFileRoute("/api/public/outbox/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.OUTBOX_PROCESS_SECRET;
        if (!secret) {
          return new Response(JSON.stringify({ error: "secret_not_configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const header = request.headers.get("x-outbox-secret");
        if (header !== secret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { processOutboxBatch } = await import("@/lib/outboxProcess.server");
        try {
          const result = await processOutboxBatch(50);
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[/api/public/outbox/process] error:", e);
          return new Response(
            JSON.stringify({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
