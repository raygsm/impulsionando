import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.mcp/invoke-tool/$tool")({
  server: {
    handlers: {
      POST: () => new Response(JSON.stringify({ error: "Lovable MCP disabled" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    },
  },
});
