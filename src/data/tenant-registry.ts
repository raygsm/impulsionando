/**
 * ═══════════════════════════════════════════════════════════════════
 *  Registro Oficial de Tenants Homologados — Ecossistema Impulsionando
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fonte única de verdade para a Vitrine ESTÁTICA (tenants-modelo) e
 * para o Impulsionito. A Vitrine dinâmica (`/vitrine`) segue puxando
 * de `getPublicVitrine` (Supabase); este arquivo lista apenas os
 * MODELOS OFICIAIS DE SEGMENTO, cada um representando o padrão
 * consolidado para o seu vertical.
 *
 * Cada tenant modelo declara:
 *  - slug de rota interna (para navegação SPA)
 *  - segmento oficial (para Vitrine)
 *  - metadados semânticos para Impulsionito recomendar corretamente
 *
 * Ao criar um novo tenant, verificar se o segmento já tem modelo
 * antes de duplicar arquitetura.
 */

export type TenantSegment =
  | "saude"
  | "equipamentos-medico-hospitalares"
  | "nutraceuticos"
  | "imobiliario"
  | "property-management"
  | "gastronomia"
  | "eventos-e-producao"
  | "servicos"
  | "white-label";

export type ImpulsionitoDimensao =
  | "produtos"
  | "servicos"
  | "imoveis"
  | "consultas"
  | "eventos"
  | "delivery"
  | "reservas"
  | "locacoes";

export type TenantModel = {
  /** Slug interno (usado em Link to). */
  slug: string;
  /** Nome comercial exibido. */
  name: string;
  /** Rota-raiz do tenant. */
  route: string;
  /** Segmento oficial da Vitrine. */
  segment: TenantSegment;
  /** Rótulo humano do segmento. */
  segmentLabel: string;
  /** Descrição curta (1 linha) — usada em cards. */
  tagline: string;
  /** Descrição longa (2-4 linhas) — usada em página do tenant na Vitrine. */
  description: string;
  /** CSS custom property de cor primária (do tokens-tenants.css). */
  primaryVar: string;
  /**
   * Data-attribute a ser aplicado no wrapper para ativar tokens do
   * tenant. Ex.: <div data-tenant="garrido">.
   */
  dataTenant: string;
  /** Dimensões que o Impulsionito pode recomendar deste tenant. */
  impulsionitoDimensoes: ImpulsionitoDimensao[];
  /**
   * Metadados semânticos que o Impulsionito usa para casar contexto
   * do usuário com o tenant. TODOS opcionais — quanto mais rico,
   * melhor a recomendação.
   */
  semantica: {
    /** Objetivos do usuário que este tenant atende. */
    objetivos?: string[];
    /** Público-alvo prioritário. */
    publico?: string[];
    /** Ocasiões/contextos de uso. */
    ocasiao?: string[];
    /** Faixa de preço geral. */
    faixaPreco?: "acessivel" | "medio" | "premium" | "luxo" | "sob-consulta";
    /** Regiões de atuação (UF). */
    regioes?: string[];
    /** Palavras-chave para busca semântica. */
    tags?: string[];
  };
  /** Status de homologação. */
  status: "homologado" | "em-homologacao" | "planejado";
  /** Referência ao dataset semântico (opcional). */
  datasetPath?: string;
};

export const TENANT_MODELS: TenantModel[] = [
  {
    slug: "chrismed",
    name: "CHRISMED",
    route: "/chrismed",
    segment: "saude",
    segmentLabel: "Saúde",
    tagline: "Clínica premium com atendimento presencial, teleconsulta e domiciliar.",
    description:
      "Modelo oficial do segmento de Saúde: agenda, teleconsulta, atendimento domiciliar, prontuário e integração multi-idioma. Referência para clínicas boutique e consultórios.",
    primaryVar: "--chrismed-primary",
    dataTenant: "chrismed",
    impulsionitoDimensoes: ["servicos", "consultas"],
    semantica: {
      objetivos: ["consulta", "check-up", "acompanhamento", "segunda-opiniao"],
      publico: ["adulto", "familia", "idoso", "internacional"],
      ocasiao: ["preventivo", "sintomatico", "pos-operatorio"],
      faixaPreco: "premium",
      regioes: ["RJ"],
      tags: ["clinica", "teleconsulta", "domiciliar", "multi-idioma"],
    },
    status: "homologado",
  },
  {
    slug: "riomed",
    name: "RIOMED",
    route: "/riomed",
    segment: "equipamentos-medico-hospitalares",
    segmentLabel: "Equipamentos Médico-Hospitalares",
    tagline: "Distribuidora médico-hospitalar com catálogo profissional.",
    description:
      "Modelo oficial do segmento de Equipamentos Médico-Hospitalares: catálogo B2B, cotação, entrega técnica e SLA. Referência para distribuidores e importadores do setor.",
    primaryVar: "--riomed-primary",
    dataTenant: "riomed",
    impulsionitoDimensoes: ["produtos"],
    semantica: {
      objetivos: ["equipar-clinica", "reposicao", "cotacao-b2b"],
      publico: ["clinica", "hospital", "consultorio", "distribuidor"],
      faixaPreco: "sob-consulta",
      regioes: ["RJ", "SP", "MG", "ES"],
      tags: ["b2b", "medico-hospitalar", "cotacao", "sla"],
    },
    status: "homologado",
  },
  {
    slug: "colors",
    name: "Colors Saúde",
    route: "/colors",
    segment: "nutraceuticos",
    segmentLabel: "Nutracêuticos",
    tagline: "E-commerce de nutracêuticos premium com jornada de conversão otimizada.",
    description:
      "Modelo oficial do segmento de Nutracêuticos: PDP orientada a conversão, prova social, garantias e cross-sell. Referência para marcas D2C de suplementos e wellness.",
    primaryVar: "--colors-primary",
    dataTenant: "colors",
    impulsionitoDimensoes: ["produtos"],
    semantica: {
      objetivos: ["performance", "imunidade", "detox", "sono", "energia", "beleza"],
      publico: ["atleta", "wellness", "profissional-ocupado", "50+"],
      ocasiao: ["rotina-diaria", "pre-treino", "pos-treino", "temporada"],
      faixaPreco: "premium",
      tags: ["nutraceuticos", "suplementos", "wellness", "d2c"],
    },
    status: "homologado",
    datasetPath: "src/data/colors-products.ts",
  },
  {
    slug: "garrido",
    name: "Imobiliária Garrido",
    route: "/garrido",
    segment: "imobiliario",
    segmentLabel: "Imobiliário",
    tagline: "Compra, venda, locação e temporada com curadoria de imóveis premium.",
    description:
      "Modelo oficial do segmento Imobiliário: busca inteligente, fichas ricas, financiamento, avaliação e captação. Referência para imobiliárias boutique com foco em alto padrão.",
    primaryVar: "--garrido-primary",
    dataTenant: "garrido",
    impulsionitoDimensoes: ["imoveis"],
    semantica: {
      objetivos: ["morar", "investir", "alugar", "vender", "temporada"],
      publico: ["familia", "investidor", "expat", "aposentado"],
      faixaPreco: "premium",
      regioes: ["RJ"],
      tags: ["imobiliaria", "alto-padrao", "curadoria", "financiamento"],
    },
    status: "homologado",
    datasetPath: "src/data/garrido-imoveis.ts",
  },
  {
    slug: "marocas",
    name: "Marocas",
    route: "/marocas",
    segment: "property-management",
    segmentLabel: "Property Management",
    tagline: "Gestão completa de aluguel por temporada e imóveis prontos para hóspedes.",
    description:
      "Modelo oficial do segmento Property Management / Short Stay: enxoval, limpeza, manutenção, vistoria, planos recorrentes e concierge. Referência para gestores de temporada.",
    primaryVar: "--marocas-primary",
    dataTenant: "marocas",
    impulsionitoDimensoes: ["servicos", "reservas"],
    semantica: {
      objetivos: ["gestao-imovel", "aluguel-temporada", "manutencao", "enxoval"],
      publico: ["proprietario", "investidor-imobiliario", "hospede"],
      faixaPreco: "premium",
      regioes: ["RJ"],
      tags: ["property-management", "short-stay", "temporada", "concierge"],
    },
    status: "homologado",
  },
  {
    slug: "foodservice",
    name: "Food Service",
    route: "/foodservice",
    segment: "gastronomia",
    segmentLabel: "Gastronomia",
    tagline: "Cardápio digital, delivery, comanda QR e fidelidade para bar e restaurante.",
    description:
      "Modelo oficial do segmento de Gastronomia: cardápio semântico (dieta, ocasião, harmonização), delivery, reservas, KDS, comanda QR, fidelidade e CRM. Referência para bares, restaurantes, pizzarias, hamburguerias, cafeterias e adegas.",
    primaryVar: "--fs-amber",
    dataTenant: "foodservice",
    impulsionitoDimensoes: ["produtos", "delivery", "reservas"],
    semantica: {
      objetivos: ["comer-fora", "delivery", "encontro", "celebracao", "happy-hour"],
      publico: ["casal", "familia", "grupo-amigos", "corporativo"],
      ocasiao: ["almoco", "jantar", "aniversario", "reuniao", "date-night"],
      faixaPreco: "medio",
      tags: ["gastronomia", "delivery", "bar", "restaurante", "cardapio-digital"],
    },
    status: "homologado",
    datasetPath: "src/data/foodservice-menu.ts",
  },
  {
    slug: "wmp",
    name: "WMP",
    route: "/wmp",
    segment: "eventos-e-producao",
    segmentLabel: "Eventos e Produção",
    tagline: "Produção de eventos com pré-diagnóstico acústico, som, luz e palco.",
    description:
      "Modelo oficial do segmento de Eventos e Produção (também referência do segmento Serviços): briefing inteligente com engenharia acústica, ART, laudo de dB e rede de parceiros. Referência para produtoras de eventos, casamentos e corporativos.",
    primaryVar: "--wmp-primary",
    dataTenant: "wmp",
    impulsionitoDimensoes: ["servicos", "eventos"],
    semantica: {
      objetivos: ["som-e-luz", "palco", "coordenacao-evento", "parceria"],
      publico: ["noivos", "corporativo", "produtora", "artista", "cerimonialista"],
      ocasiao: ["casamento", "corporativo", "festival", "show", "formatura"],
      faixaPreco: "premium",
      regioes: ["RJ", "SP", "MG", "ES"],
      tags: ["eventos", "producao", "som", "luz", "palco", "acustica"],
    },
    status: "homologado",
    datasetPath: "src/data/wmp-content.ts",
  },
  {
    slug: "whitelabel",
    name: "White Label Impulsionando",
    route: "/white-label",
    segment: "white-label",
    segmentLabel: "White Label / Arquitetura SaaS",
    tagline: "Sua marca, seu domínio, seus clientes — a tecnologia é nossa.",
    description:
      "Modelo oficial da vertente White Label: arquitetura SaaS multi-tenant pronta para agências, consultorias, franqueadoras e grupos empresariais revenderem o ecossistema Impulsionando com marca própria, planos próprios e faturamento próprio.",
    primaryVar: "--whitelabel-primary",
    dataTenant: "whitelabel",
    impulsionitoDimensoes: ["servicos"],
    semantica: {
      objetivos: ["revender-saas", "monetizar-carteira", "produtizar-servico"],
      publico: ["agencia", "consultoria", "franqueadora", "grupo-empresarial"],
      faixaPreco: "sob-consulta",
      tags: ["white-label", "saas", "multi-tenant", "revenda", "arquitetura"],
    },
    status: "homologado",
  },
];

/** Todos os segmentos oficiais do ecossistema (para filtros/vitrine). */
export const OFFICIAL_SEGMENTS: Array<{ id: TenantSegment; label: string }> = [
  { id: "saude", label: "Saúde" },
  { id: "equipamentos-medico-hospitalares", label: "Equipamentos Médico-Hospitalares" },
  { id: "nutraceuticos", label: "Nutracêuticos" },
  { id: "imobiliario", label: "Imobiliário" },
  { id: "property-management", label: "Property Management" },
  { id: "gastronomia", label: "Gastronomia" },
  { id: "eventos-e-producao", label: "Eventos e Produção" },
  { id: "servicos", label: "Serviços" },
  { id: "white-label", label: "White Label / Arquitetura SaaS" },
];

export function getTenantModel(slug: string): TenantModel | undefined {
  return TENANT_MODELS.find((t) => t.slug === slug);
}

export function getModelForSegment(segment: TenantSegment): TenantModel | undefined {
  // Serviços é coberto pelo modelo WMP por decisão de homologação.
  if (segment === "servicos") return TENANT_MODELS.find((t) => t.slug === "wmp");
  return TENANT_MODELS.find((t) => t.segment === segment);
}
