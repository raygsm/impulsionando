/**
 * Score de compatibilidade entre um candidato e uma empresa.
 * Retorna 0–100 + motivos legíveis.
 */
export type Candidato = {
  cidade?: string | null;
  bairro?: string | null;
  experiencia?: string | null;
  disponibilidade?: string | null;
  escolaridade?: string | null;
  pretensao_salarial?: string | null;
  nicho?: string | null;
};
export type EmpresaConfig = {
  cidades_interesse?: string[] | null;
  bairros_interesse?: string[] | null;
  nicho?: string | null;
};

export function compatibilityScore(c: Candidato, e: EmpresaConfig) {
  const motivos: string[] = [];
  let score = 40; // base

  const cidades = (e.cidades_interesse ?? []).map((s) => s.toLowerCase());
  if (c.cidade && cidades.includes(c.cidade.toLowerCase())) {
    score += 20; motivos.push("✔️ mesma cidade");
  }
  const bairros = (e.bairros_interesse ?? []).map((s) => s.toLowerCase());
  if (c.bairro && bairros.includes(c.bairro.toLowerCase())) {
    score += 10; motivos.push("✔️ bairro de interesse");
  }
  if (c.experiencia && !/sem experi/i.test(c.experiencia)) {
    score += 10; motivos.push("✔️ experiência comprovada");
  }
  if (c.disponibilidade?.toLowerCase().startsWith("imediata")) {
    score += 10; motivos.push("✔️ disponibilidade imediata");
  }
  if (e.nicho && c.nicho && e.nicho.toLowerCase() === c.nicho.toLowerCase()) {
    score += 10; motivos.push("✔️ experiência no nicho");
  }

  return { score: Math.min(100, score), motivos };
}
