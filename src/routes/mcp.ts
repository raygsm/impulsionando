import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mcp")({
  component: () => null,
  beforeLoad: () => {
    throw new Response("Lovable MCP disabled in production", { status: 404 });
  },
});
