/**
 * Dependências entre módulos principais (slugs em motherModules.ts).
 *
 * - required: módulos sem os quais este NÃO opera. Devem ser contratados juntos.
 * - recommended: forte combinação — desbloqueiam o potencial máximo.
 * - optional: bônus que agregam quando já estão na operação.
 *
 * Usado em /modulos (catálogo) e /modulos/$slug (detalhe) para deixar claro
 * ao cliente o que precisa, o que ajuda e o que é extra antes de contratar.
 */
export type ModuleDeps = {
  required: string[];
  recommended: string[];
  optional: string[];
};

export const MODULE_DEPENDENCIES: Record<string, ModuleDeps> = {
  erp:           { required: [],                   recommended: ["bi", "crm"],                  optional: ["estoque", "commerce"] },
  crm:           { required: [],                   recommended: ["automacao", "agenda"],        optional: ["bi", "commerce", "fidelizacao"] },
  automacao:     { required: ["crm"],              recommended: ["agenda", "commerce"],         optional: ["eventos", "delivery"] },
  agenda:        { required: [],                   recommended: ["crm", "automacao"],           optional: ["commerce", "saude", "area_cliente"] },
  commerce:      { required: [],                   recommended: ["crm", "automacao"],           optional: ["estoque", "fidelizacao", "bi"] },
  pdv:           { required: ["estoque"],          recommended: ["commerce", "fidelizacao"],    optional: ["bi", "delivery"] },
  estoque:       { required: [],                   recommended: ["commerce", "pdv"],            optional: ["bi", "erp"] },
  saude:         { required: ["agenda"],           recommended: ["crm", "area_cliente"],        optional: ["automacao", "commerce"] },
  eventos:       { required: ["commerce"],         recommended: ["crm", "automacao"],           optional: ["fidelizacao", "bi"] },
  delivery:      { required: ["commerce"],         recommended: ["automacao", "pdv"],           optional: ["fidelizacao", "bi"] },
  bi:            { required: [],                   recommended: ["crm", "commerce"],            optional: ["erp", "estoque", "eventos"] },
  white_label:   { required: [],                   recommended: ["crm", "commerce", "bi"],      optional: ["automacao", "parceiros"] },
  fidelizacao:   { required: ["crm"],              recommended: ["commerce", "automacao"],      optional: ["area_cliente", "eventos"] },
  area_cliente:  { required: [],                   recommended: ["agenda", "commerce"],         optional: ["fidelizacao", "saude"] },
  parceiros:     { required: [],                   recommended: ["crm", "commerce"],            optional: ["bi", "white_label"] },
};

/** Indica se o módulo precisa de credenciais/serviços externos para operar. */
export const MODULE_EXTERNAL_REQUIREMENTS: Record<string, string[]> = {
  automacao:    ["WhatsApp Business API ou conector Z-API", "SMTP transacional"],
  commerce:     ["Gateway de pagamento (Mercado Pago, Pix)"],
  delivery:     ["Gateway de pagamento", "Integração de mapas (opcional)"],
  eventos:      ["Gateway de pagamento"],
  white_label:  ["Domínio próprio", "Certificado SSL gerenciado"],
  saude:        ["Termos e LGPD configurados"],
  bi:           ["Origens de dados ativas (CRM, Commerce, Agenda)"],
};

export function getDeps(slug: string): ModuleDeps {
  return MODULE_DEPENDENCIES[slug] ?? { required: [], recommended: [], optional: [] };
}
