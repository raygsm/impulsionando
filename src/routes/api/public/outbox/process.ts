import { createFileRoute } from "@tanstack/react-router";

// Periodic processor for public.message_outbox.
// Called by pg_cron every minute via net.http_post.
// Authentication: requires the Supabase anon/publishable key in the
// `apikey` header (matches the project's other cron-triggered routes).

export const Route = createFileRoute("/api/public/outbox/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const apikey = request.headers.get("apikey");
        const altSecret = request.headers.get("x-outbox-secret");
        const outboxSecret = process.env.OUTBOX_PROCESS_SECRET;

        const ok =
          (expected && apikey && apikey === expected) ||
          (outboxSecret && altSecret && altSecret === outboxSecret);

        if (!ok) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { processOutboxBatch } = await import("@/lib/outboxProcess.server");
          const result = await processOutboxBatch(50);
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[/api/public/outbox/process] error:", e);
          return new Response(
            JSON.stringify({
              error: "internal_error",
              message: e instanceof Error ? e.message : String(e),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
