import { createFileRoute } from "@tanstack/react-router";

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
const TIMEOUT_MS = 5000;
const UFS = new Set(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]);

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
        if (!UFS.has(uf)) return json({ ok: false, error: "invalid_uf" }, 400);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const response = await fetch(`${IBGE_BASE}/${uf}/municipios?orderBy=nome`, {
            signal: controller.signal,
            headers: { accept: "application/json" },
          });
          if (!response.ok) return json({ ok: false, error: "provider_unavailable" }, 502);
          const rows = (await response.json()) as Array<{ id?: number; nome?: string }>;
          const municipalities = rows
            .filter((row) => Number.isFinite(Number(row.id)) && String(row.nome ?? "").trim())
            .map((row) => ({ ibge: String(row.id), nome: String(row.nome).trim(), uf }));
          return json({ ok: true, uf, municipalities, source: "ibge" }, 200, "public, max-age=604800, stale-while-revalidate=2592000");
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return json({ ok: false, error: "provider_timeout" }, 504);
          return json({ ok: false, error: "provider_unavailable" }, 502);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
