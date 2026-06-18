/**
 * Mapeamento de (nicho × nível de plano) → slugs de módulos-mãe (motherModules).
 * Usado para pré-selecionar módulos na jornada nicho-primeiro (/recomendacao/$nicho → /planos).
 */
export type RecLevel = "essencial" | "ideal" | "full";

export const PLAN_NAME_BY_LEVEL: Record<RecLevel, "Essencial" | "Integrado" | "Avançado"> = {
  essencial: "Essencial",
  ideal: "Integrado",
  full: "Avançado",
};

export const NICHE_MODULE_SLUGS: Record<string, Record<RecLevel, string[]>> = {
  "bares-restaurantes": {
    essencial: ["pdv", "automacao", "area_cliente"],
    ideal:     ["pdv", "automacao", "crm", "fidelizacao", "area_cliente", "bi"],
    full:      ["pdv", "eventos", "fidelizacao", "bi", "commerce", "automacao", "crm", "area_cliente"],
  },
  "clinicas": {
    essencial: ["agenda", "saude", "automacao"],
    ideal:     ["agenda", "saude", "area_cliente", "commerce", "automacao", "bi"],
    full:      ["agenda", "saude", "area_cliente", "bi", "automacao", "commerce", "parceiros"],
  },
  "psicologia": {
    essencial: ["agenda", "saude", "commerce"],
    ideal:     ["agenda", "saude", "area_cliente", "commerce", "automacao"],
    full:      ["agenda", "saude", "bi", "parceiros", "area_cliente"],
  },
  "imobiliaria": {
    essencial: ["crm", "area_cliente", "agenda"],
    ideal:     ["crm", "area_cliente", "agenda", "automacao", "bi"],
    full:      ["crm", "area_cliente", "agenda", "bi", "parceiros", "automacao"],
  },
  "contabilidade": {
    essencial: ["crm", "area_cliente", "automacao"],
    ideal:     ["area_cliente", "automacao", "crm", "erp", "bi"],
    full:      ["erp", "bi", "automacao", "parceiros", "area_cliente"],
  },
  "juridico": {
    essencial: ["crm", "area_cliente", "automacao"],
    ideal:     ["crm", "area_cliente", "automacao", "erp", "bi"],
    full:      ["crm", "area_cliente", "bi", "automacao", "parceiros"],
  },
  "microcervejarias": {
    essencial: ["commerce", "pdv"],
    ideal:     ["commerce", "pdv", "crm", "automacao"],
    full:      ["eventos", "bi", "erp", "automacao", "commerce", "pdv"],
  },
  "eventos": {
    essencial: ["eventos", "area_cliente"],
    ideal:     ["eventos", "area_cliente", "crm", "automacao", "bi"],
    full:      ["eventos", "bi", "parceiros", "crm", "automacao"],
  },
  "veiculos": {
    essencial: ["estoque", "crm"],
    ideal:     ["estoque", "crm", "automacao", "bi"],
    full:      ["estoque", "crm", "bi", "parceiros", "automacao"],
  },
  "servicos": {
    essencial: ["agenda", "crm"],
    ideal:     ["agenda", "crm", "commerce", "automacao"],
    full:      ["agenda", "crm", "bi", "automacao", "parceiros"],
  },
  "ecommerce": {
    essencial: ["commerce", "estoque"],
    ideal:     ["commerce", "estoque", "crm", "automacao"],
    full:      ["commerce", "estoque", "bi", "automacao", "parceiros"],
  },
  "white-label": {
    essencial: ["white_label"],
    ideal:     ["white_label", "commerce", "parceiros"],
    full:      ["white_label", "parceiros", "bi", "automacao"],
  },
};

export function getRecommendedSlugs(nicho: string | undefined, level: RecLevel | undefined): string[] {
  if (!nicho || !level) return [];
  return NICHE_MODULE_SLUGS[nicho]?.[level] ?? [];
}
