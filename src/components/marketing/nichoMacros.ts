/**
 * Agrupamento canônico dos nichos do frontend por macro-nicho.
 *
 * Espelha a tabela `core_macro_nichos` no banco (saude, alimentacao,
 * fornecedores, imobiliario, servicos, educacao, eventos) e adiciona dois
 * agrupamentos exclusivamente de frontend (varejo, parceiros) para acomodar
 * slugs sem macro próprio no banco (ecommerce, veiculos, white-label).
 *
 * Cada entrada lista os slugs de `NICHO_DETAILS` que pertencem ao macro.
 * Subnichos próximos (ex.: clínicas/consultórios e psicologia/terapias) ficam
 * lado a lado dentro do mesmo macro — nunca paralelos a macros diferentes.
 */
export type MacroNichoGroup = {
  /** slug canônico do macro (alinhado com core_macro_nichos.slug quando existe). */
  slug: string;
  /** Título exibido na UI. */
  label: string;
  /** Descrição curta do macro para listagens/cabeçalhos. */
  description: string;
  /** Slugs de `NICHO_DETAILS` que pertencem ao macro, na ordem desejada. */
  slugs: string[];
};

export const MACRO_NICHOS: MacroNichoGroup[] = [
  {
    slug: "saude",
    label: "Saúde, Bem-estar e Performance",
    description:
      "Clínicas, consultórios, psicologia, terapias, fisioterapia, nutrição, academias e estúdios. Todo cuidado com a pessoa em um único macro.",
    // clínicas (médicas + consultórios) e psicologia (+ terapias) já vivem
    // mesclados nos próprios NichoDetails — aqui ficam como irmãos sob Saúde,
    // junto com saúde generalista e fitness.
    slugs: ["clinicas", "psicologia", "saude", "fitness"],
  },
  {
    slug: "alimentacao",
    label: "Alimentação, Bebidas e Experiências",
    description:
      "Bares, restaurantes, hamburguerias, pizzarias, cafeterias e microcervejarias. Operação de salão, delivery e fidelidade no mesmo lugar.",
    slugs: ["bares-restaurantes", "microcervejarias"],
  },
  {
    slug: "fornecedores",
    label: "Fornecedores e Indústria",
    description:
      "Distribuidoras, vinícolas, destilarias, torrefações e indústrias que vendem para revendas, bares, restaurantes e marketplaces B2B.",
    slugs: ["fornecedores"],
  },
  {
    slug: "imobiliario",
    label: "Imobiliário",
    description:
      "Imobiliárias, corretores autônomos, administradoras e incorporadoras. Vitrine inteligente, CRM, propostas e portal do cliente.",
    slugs: ["imobiliaria"],
  },
  {
    slug: "servicos",
    label: "Serviços Profissionais",
    description:
      "Escritórios e prestadores de serviço: jurídico, contabilidade, marketing, tecnologia, consultorias e RH com agenda, contratos e cobrança.",
    slugs: ["servicos", "juridico", "contabilidade"],
  },
  {
    slug: "educacao",
    label: "Educação",
    description:
      "Escolas, cursos livres, idiomas, faculdades e educação corporativa. Matrículas, polos, financeiro e portal do aluno integrados.",
    slugs: ["educacao"],
  },
  {
    slug: "eventos",
    label: "Eventos e Experiências",
    description:
      "Casas de eventos, congressos, feiras, casamentos, formaturas e shows. Ingressos, check-in, listas e relacionamento pós-evento.",
    slugs: ["eventos"],
  },
  {
    slug: "varejo",
    label: "Varejo, E-commerce e Veículos",
    description:
      "Lojas físicas, e-commerce, catálogos digitais e revendas de veículos. Estoque, pedidos, leads, propostas e financiamento integrado.",
    slugs: ["ecommerce", "veiculos"],
  },
  {
    slug: "parceiros",
    label: "White Label e Parceiros",
    description:
      "Agências, integradores, revendedores e consultorias que vendem a plataforma com a própria marca.",
    slugs: ["white-label"],
  },
];

/** Retorna o macro a que um determinado slug de nicho pertence (ou null). */
export function macroFor(slug: string): MacroNichoGroup | null {
  return MACRO_NICHOS.find((m) => m.slugs.includes(slug)) ?? null;
}
