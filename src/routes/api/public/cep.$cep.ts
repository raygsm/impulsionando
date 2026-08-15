import { createFileRoute } from "@tanstack/react-router";

const VIA_CEP_BASE = "https://viacep.com.br/ws";
const TIMEOUT_MS = 4000;

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
 * Consulta pública de CEP mediada pelo servidor Impulsionando.
 *
 * Objetivos:
 * - impedir que formulários dependam diretamente do provedor externo;
 * - validar/sanitizar o CEP antes da chamada;
 * - impor timeout curto;
 * - manter um contrato estável para todos os clientes do Core;
 * - permitir troca futura do provedor sem alterar cada formulário.
 */
export const Route = createFileRoute("/api/public/cep/$cep")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const clean = String(params.cep ?? "").replace(/\D/g, "");
        if (!/^\d{8}$/.test(clean)) {
          return json({ ok: false, error: "invalid_cep" }, 400);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          const response = await fetch(`${VIA_CEP_BASE}/${clean}/json/`, {
            signal: controller.signal,
            headers: { accept: "application/json" },
          });

          if (!response.ok) {
            return json({ ok: false, error: "provider_unavailable" }, 502);
          }

          const data = (await response.json()) as Record<string, unknown>;
          if (data.erro === true || data.erro === "true") {
            return json({ ok: false, error: "cep_not_found" }, 404);
          }

          return json(
            {
              ok: true,
              address: {
                cep: String(data.cep ?? ""),
                logradouro: String(data.logradouro ?? ""),
                complemento: String(data.complemento ?? ""),
                unidade: String(data.unidade ?? ""),
                bairro: String(data.bairro ?? ""),
                cidade: String(data.localidade ?? ""),
                uf: String(data.uf ?? ""),
                estado: String(data.estado ?? ""),
                regiao: String(data.regiao ?? ""),
                ibge: data.ibge ? String(data.ibge) : undefined,
                gia: data.gia ? String(data.gia) : undefined,
                ddd: data.ddd ? String(data.ddd) : undefined,
                siafi: data.siafi ? String(data.siafi) : undefined,
              },
              source: "viacep",
            },
            200,
            "public, max-age=86400, stale-while-revalidate=604800",
          );
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return json({ ok: false, error: "provider_timeout" }, 504);
          }
          return json({ ok: false, error: "provider_unavailable" }, 502);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
