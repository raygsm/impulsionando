import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  server: {
    handlers: {
      GET: () => new Response(JSON.stringify({ disabled: true }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    },
  },
});
