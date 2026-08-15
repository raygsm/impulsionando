import { supabaseAdmin } from "@/integrations/supabase/client.server";

const VIA_CEP_BASE = "https://viacep.com.br/ws";
const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
const UFS = new Set(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]);

export type CoreAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  cidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
};

export type CoreMunicipality = { ibge: string; nome: string; uf: string };

async function withTimeout<T>(timeoutMs: number, fn: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function cacheLocality(address: CoreAddress) {
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
        source_reference: address.cep.replace(/\D/g, ""),
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "country_code,municipality_ibge_code,neighborhood_normalized" },
    );
  } catch {
    // Cache is enrichment only; provider lookup must remain available.
  }
}

export async function lookupBrazilCep(cep: string): Promise<CoreAddress> {
  const clean = String(cep ?? "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(clean)) throw new Error("invalid_cep");

  return withTimeout(4000, async (signal) => {
    const response = await fetch(`${VIA_CEP_BASE}/${clean}/json/`, { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("provider_unavailable");
    const data = (await response.json()) as Record<string, unknown>;
    if (data.erro === true || data.erro === "true") throw new Error("cep_not_found");

    const address: CoreAddress = {
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
    return address;
  });
}

export async function listBrazilMunicipalities(uf: string): Promise<CoreMunicipality[]> {
  const normalized = String(uf ?? "").trim().toUpperCase();
  if (!UFS.has(normalized)) throw new Error("invalid_uf");

  return withTimeout(5000, async (signal) => {
    const response = await fetch(`${IBGE_BASE}/${normalized}/municipios?orderBy=nome`, { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("provider_unavailable");
    const rows = (await response.json()) as Array<{ id?: number; nome?: string }>;
    return rows
      .filter((row) => Number.isFinite(Number(row.id)) && String(row.nome ?? "").trim())
      .map((row) => ({ ibge: String(row.id), nome: String(row.nome).trim(), uf: normalized }));
  });
}

export async function assertBrazilLocation(input: { cep: string; uf: string; cidade: string; ibge: string }) {
  const address = await lookupBrazilCep(input.cep);
  if (
    address.uf !== input.uf.toUpperCase() ||
    address.cidade !== input.cidade ||
    String(address.ibge ?? "") !== input.ibge
  ) {
    throw new Error("CEP, município e UF não correspondem. Consulte o CEP novamente e escolha os dados preenchidos pelo sistema.");
  }
  return address;
}

export async function assertBrazilMunicipality(input: { uf: string; cidade: string; ibge: string }) {
  if (!/^\d{7}$/.test(input.ibge)) throw new Error("Código IBGE do município inválido.");
  const municipalities = await listBrazilMunicipalities(input.uf);
  if (!municipalities.some((row) => row.ibge === input.ibge && row.nome === input.cidade)) {
    throw new Error("Município e UF não correspondem à lista oficial. Selecione novamente.");
  }
}
