import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

async function cacheLocality(address: {
  uf: string;
  cidade: string;
  bairro: string;
  ibge?: string;
  cep: string;
}) {
  if (!address.ibge || !/^[A-Z]{2}$/.test(address.uf) || !address.cidade) return;
  try {
    await supabaseAdmin.from("core_localities").upsert(
      {
        country_code: "BR",
        state_code: address.uf,
        municipality_ibge_code: address.ibge,
        municipality_name: address.cidade,
        neighborhood_name: address.bairro || null,
        source: "viacep",
        source_reference: address.cep,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "country_code,municipality_ibge_code,neighborhood_normalized" },
    );
  } catch {
    // Cache é enriquecimento; nunca deve derrubar a consulta pública de CEP.
  }
}

/**
 * Consulta pública de CEP mediada pelo Core Impulsionando.
 * O CEP é a porta de entrada do endereço: o Core normaliza município/UF/IBGE
 * e aprende bairros/logradouros válidos sem transformar texto livre em fonte
 * primária de dados.
 */
export const Route = createFileRoute("/api/public/cep/$cep")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const clean = String(params.cep ?? "").replace(/\D/g, "");
        if (!/^\d{8}$/.test(clean)) return json({ ok: false, error: "invalid_cep" }, 400);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          const response = await fetch(`${VIA_CEP_BASE}/${clean}/json/`, {
            signal: controller.signal,
            headers: { accept: "application/json" },
          });
          if (!response.ok) return json({ ok: false, error: "provider_unavailable" }, 502);

          const data = (await response.json()) as Record<string, unknown>;
          if (data.erro === true || data.erro === "true") return json({ ok: false, error: "cep_not_found" }, 404);

          const address = {
            cep: String(data.cep ?? clean),
            logradouro: String(data.logradouro ?? ""),
            complemento: String(data.complemento ?? ""),
            unidade: String(data.unidade ?? ""),
            bairro: String(data.bairro ?? ""),
            cidade: String(data.localidade ?? ""),
            uf: String(data.uf ?? "").toUpperCase(),
            estado: String(data.estado ?? ""),
            regiao: String(data.regiao ?? ""),
            ibge: data.ibge ? String(data.ibge) : undefined,
            gia: data.gia ? String(data.gia) : undefined,
            ddd: data.ddd ? String(data.ddd) : undefined,
            siafi: data.siafi ? String(data.siafi) : undefined,
          };

          void cacheLocality(address);

          return json(
            { ok: true, address, source: "viacep" },
            200,
            "public, max-age=86400, stale-while-revalidate=604800",
          );
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
