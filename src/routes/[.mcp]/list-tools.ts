import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.mcp/list-tools")({
  server: {
    handlers: {
      GET: () => new Response(JSON.stringify({ tools: [], disabled: true }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    },
  },
});
