import { createFileRoute } from "@tanstack/react-router";
import { lookupBrazilCep } from "@/lib/core/locations.server";

function json(body: unknown, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

/**
 * Consulta pública de CEP mediada pelo Core Impulsionando.
 * O CEP é a porta de entrada do endereço: o Core normaliza município/UF/IBGE
 * e aprende bairros válidos sem transformar texto livre em fonte primária.
 */
export const Route = createFileRoute("/api/public/cep/$cep")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const clean = String(params.cep ?? "").replace(/\D/g, "");
        if (!/^\d{8}$/.test(clean)) return json({ ok: false, error: "invalid_cep" }, 400);

        try {
          const address = await lookupBrazilCep(clean);
          return json(
            { ok: true, address, source: "viacep" },
            200,
            "public, max-age=86400, stale-while-revalidate=604800",
          );
        } catch (error) {
          const code = error instanceof Error ? error.message : "provider_unavailable";
          if (code === "cep_not_found") return json({ ok: false, error: code }, 404);
          if (code === "invalid_cep") return json({ ok: false, error: code }, 400);
          if (error instanceof Error && error.name === "AbortError") return json({ ok: false, error: "provider_timeout" }, 504);
          return json({ ok: false, error: "provider_unavailable" }, 502);
        }
      },
    },
  },
});
