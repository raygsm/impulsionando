import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Lists the public niche slugs served by the Impulsionando marketing site.
 * Reads only the public sitemap — no auth, no PII.
 */
export default defineTool({
  name: "list_public_niches",
  title: "List public niches",
  description: "List the public niche pages (slugs and URLs) exposed by the Impulsionando marketing site.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Maximum number of niche URLs to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ limit }) => {
    const origin = "https://impulsionando.com.br";
    try {
      const res = await fetch(`${origin}/sitemap.xml`, { headers: { accept: "application/xml" } });
      if (!res.ok) {
        return {
          content: [{ type: "text", text: `Failed to fetch sitemap: HTTP ${res.status}` }],
          isError: true,
        };
      }
      const xml = await res.text();
      const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
        .map((m) => m[1])
        .filter((u) => u.includes("/nichos/"))
        .slice(0, limit ?? 50);
      return {
        content: [{ type: "text", text: urls.join("\n") || "(no niche URLs found)" }],
        structuredContent: { urls },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  },
});
