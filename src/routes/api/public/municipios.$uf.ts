import { createFileRoute } from "@tanstack/react-router";
import { listBrazilMunicipalities } from "@/lib/core/locations.server";

function json(body: unknown, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cacheControl },
  });
}

export const Route = createFileRoute("/api/public/municipios/$uf")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const uf = String(params.uf ?? "").trim().toUpperCase();
        try {
          const municipalities = await listBrazilMunicipalities(uf);
          return json(
            { ok: true, uf, municipalities, source: "ibge" },
            200,
            "public, max-age=604800, stale-while-revalidate=2592000",
          );
        } catch (error) {
          const code = error instanceof Error ? error.message : "provider_unavailable";
          if (code === "invalid_uf") return json({ ok: false, error: code }, 400);
          if (error instanceof Error && error.name === "AbortError") return json({ ok: false, error: "provider_timeout" }, 504);
          return json({ ok: false, error: "provider_unavailable" }, 502);
        }
      },
    },
  },
});
