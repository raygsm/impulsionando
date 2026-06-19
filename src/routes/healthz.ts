import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            service: "impulsionando",
            ts: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          },
        ),
      HEAD: async () => new Response(null, { status: 200 }),
    },
  },
});
