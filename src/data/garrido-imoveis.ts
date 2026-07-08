/**
 * Mock público (front-end) de imóveis Garrido para homologação da vitrine.
 * Nenhum dado real; nenhum acesso ao banco. Estrutura já compatível com o
 * Impulsionito (localização, orçamento, perfil, objetivo, investimento, aluguel, temporada).
 */
export type ImovelFinalidade = "venda" | "aluguel" | "temporada" | "lancamento";
export type ImovelCategoria =
  | "apartamento"
  | "casa"
  | "cobertura"
  | "comercial"
  | "rural"
  | "terreno";

export type ImovelStatus = "disponivel" | "reservado" | "vendido";

export type ImovelTag = "alto-padrao" | "lancamento" | "oportunidade" | "mobiliado" | "vista-mar";

export interface Imovel {
  slug: string;
  titulo: string;
  finalidade: ImovelFinalidade[];
  categoria: ImovelCategoria;
  status: ImovelStatus;
  precoVenda?: number;
  precoAluguel?: number;
  precoTemporada?: number;
  condominio?: number;
  iptu?: number;
  cidade: string;
  bairro: string;
  uf: string;
  cep: string;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaUtil: number;   // m²
  areaTotal: number;  // m²
  ano?: number;
  tags: ImovelTag[];
  destaques: string[];
  descricao: string;
  caracteristicas: string[];
  documentacao: string[];
  proximidades: string[];
  corretor: { nome: string; creci: string; whatsapp: string };
  fotos: string[];
  video?: string;
  mapa: { lat: number; lng: number };
  perfilImpulsionito: {
    objetivo: ("morar" | "investir" | "alugar" | "temporada")[];
    orcamentoFaixa: "economico" | "medio" | "alto" | "luxo";
    publico: ("familia" | "casal" | "solteiro" | "investidor" | "corporativo")[];
  };
}

const CORRETORES = [
  { nome: "Rafael Garrido", creci: "CRECI-RJ 45.812", whatsapp: "5521999990001" },
  { nome: "Marina Costa",   creci: "CRECI-RJ 52.104", whatsapp: "5521999990002" },
  { nome: "Bruno Almeida",  creci: "CRECI-RJ 48.209", whatsapp: "5521999990003" },
];

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const IMOVEIS: Imovel[] = [
  {
    slug: "cobertura-duplex-leblon-vista-mar",
    titulo: "Cobertura Duplex à Beira-mar no Leblon",
    finalidade: ["venda"],
    categoria: "cobertura",
    status: "disponivel",
    precoVenda: 8_900_000,
    condominio: 6_800,
    iptu: 1_450,
    cidade: "Rio de Janeiro", bairro: "Leblon", uf: "RJ", cep: "22440-032",
    quartos: 4, suites: 3, banheiros: 5, vagas: 3, areaUtil: 320, areaTotal: 420, ano: 2019,
    tags: ["alto-padrao", "vista-mar"],
    destaques: ["Vista frontal para o mar", "Piscina privativa", "Terraço 180m²"],
    descricao:
      "Cobertura duplex com acabamento premium, vista deslumbrante para o mar do Leblon, piscina privativa aquecida e terraço gourmet com churrasqueira. Prédio com concierge 24h, spa, academia e sala de cinema.",
    caracteristicas: [
      "Ar-condicionado central", "Piso porcelanato importado", "Automação residencial",
      "Aquecimento a gás", "Elevador privativo", "Depósito e bicicletário",
    ],
    documentacao: ["Escritura registrada", "IPTU quitado", "Certidões negativas em dia"],
    proximidades: ["Praia do Leblon (100m)", "Colégio Santo Agostinho", "Shopping Leblon", "Estação Jardim de Alah"],
    corretor: CORRETORES[0],
    fotos: [
      img("1512917774080-9991f1c4c750"),
      img("1600585154340-be6161a56a0c"),
      img("1560448204-e02f11c3d0e2"),
      img("1600607687939-ce8a6c25118c"),
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    mapa: { lat: -22.9838, lng: -43.2226 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "luxo", publico: ["familia", "investidor"] },
  },
  {
    slug: "apartamento-3q-botafogo-reformado",
    titulo: "Apartamento 3 Quartos Totalmente Reformado em Botafogo",
    finalidade: ["venda", "aluguel"],
    categoria: "apartamento",
    status: "disponivel",
    precoVenda: 1_290_000,
    precoAluguel: 6_200,
    condominio: 1_100,
    iptu: 210,
    cidade: "Rio de Janeiro", bairro: "Botafogo", uf: "RJ", cep: "22280-020",
    quartos: 3, suites: 1, banheiros: 2, vagas: 1, areaUtil: 110, areaTotal: 110, ano: 2001,
    tags: ["oportunidade"],
    destaques: ["Reforma nova completa", "Andar alto com sol da manhã", "Portaria 24h"],
    descricao:
      "Apartamento 100% reformado, com projeto de arquitetura assinado. Sala ampliada, cozinha aberta com ilha, três dormitórios (uma suíte), varanda gourmet e vista livre do Cristo Redentor.",
    caracteristicas: ["Sala ampliada", "Cozinha planejada", "Varanda", "Interfone", "Salão de festas"],
    documentacao: ["Escritura registrada", "Regularizado na prefeitura"],
    proximidades: ["Metrô Botafogo", "Shopping Rio Sul", "PUC-Rio", "Praia de Botafogo"],
    corretor: CORRETORES[1],
    fotos: [
      img("1502672260266-1c1ef2d93688"),
      img("1560448204-603b3fc33ddc"),
      img("1493809842364-78817add7ffb"),
      img("1522708323590-d24dbb6b0267"),
    ],
    mapa: { lat: -22.9519, lng: -43.1878 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "medio", publico: ["familia", "casal"] },
  },
  {
    slug: "casa-condominio-barra-4suites",
    titulo: "Casa em Condomínio Fechado — 4 Suítes na Barra",
    finalidade: ["venda"],
    categoria: "casa",
    status: "disponivel",
    precoVenda: 3_450_000,
    condominio: 2_400,
    iptu: 780,
    cidade: "Rio de Janeiro", bairro: "Barra da Tijuca", uf: "RJ", cep: "22793-081",
    quartos: 4, suites: 4, banheiros: 5, vagas: 4, areaUtil: 380, areaTotal: 620, ano: 2015,
    tags: ["alto-padrao"],
    destaques: ["Condomínio com lazer completo", "4 suítes com closet", "Piscina + churrasqueira"],
    descricao:
      "Casa em condomínio fechado com segurança 24h, área gourmet integrada à piscina, home theater e escritório. Perfeita para família que busca conforto, segurança e lazer sem sair de casa.",
    caracteristicas: ["Piscina", "Churrasqueira", "Escritório", "Home theater", "Jardim", "Depósito"],
    documentacao: ["Escritura registrada", "Habite-se", "Certidões em dia"],
    proximidades: ["Barra Shopping", "Escola Americana", "Praia da Barra", "Recreio dos Bandeirantes"],
    corretor: CORRETORES[0],
    fotos: [
      img("1600596542815-ffad4c1539a9"),
      img("1613977257363-707ba9348227"),
      img("1580587771525-78b9dba3b914"),
      img("1600566753190-17f0baa2a6c3"),
    ],
    mapa: { lat: -23.0045, lng: -43.3653 },
    perfilImpulsionito: { objetivo: ["morar"], orcamentoFaixa: "alto", publico: ["familia"] },
  },
  {
    slug: "studio-copacabana-mobiliado-temporada",
    titulo: "Studio Mobiliado em Copacabana — Ideal Temporada",
    finalidade: ["temporada", "aluguel"],
    categoria: "apartamento",
    status: "disponivel",
    precoTemporada: 320,
    precoAluguel: 3_800,
    condominio: 780,
    iptu: 95,
    cidade: "Rio de Janeiro", bairro: "Copacabana", uf: "RJ", cep: "22011-002",
    quartos: 1, suites: 1, banheiros: 1, vagas: 0, areaUtil: 38, areaTotal: 38, ano: 2010,
    tags: ["mobiliado"],
    destaques: ["100m da praia", "Wi-Fi 300Mb", "Check-in autônomo"],
    descricao:
      "Studio totalmente mobiliado e decorado, pronto para temporada. Cozinha americana equipada, cama queen, smart TV e ar-condicionado. Prédio com portaria 24h.",
    caracteristicas: ["Mobiliado", "Ar-condicionado", "Smart TV", "Wi-Fi", "Portaria 24h"],
    documentacao: ["Contrato temporada padrão", "Cauções via cartão"],
    proximidades: ["Praia de Copacabana", "Metrô Cardeal Arcoverde", "Restaurantes 24h"],
    corretor: CORRETORES[2],
    fotos: [
      img("1522771739844-6a9f6d5f14af"),
      img("1560185127-6ed189bf02f4"),
      img("1502005229762-cf1b2da7c5d6"),
    ],
    mapa: { lat: -22.9707, lng: -43.1823 },
    perfilImpulsionito: { objetivo: ["temporada", "investir", "alugar"], orcamentoFaixa: "economico", publico: ["solteiro", "casal", "investidor"] },
  },
  {
    slug: "lancamento-tijuca-2q-varanda",
    titulo: "Lançamento Tijuca — 2 Quartos com Varanda Gourmet",
    finalidade: ["venda", "lancamento"],
    categoria: "apartamento",
    status: "disponivel",
    precoVenda: 720_000,
    condominio: 0,
    iptu: 0,
    cidade: "Rio de Janeiro", bairro: "Tijuca", uf: "RJ", cep: "20510-060",
    quartos: 2, suites: 1, banheiros: 2, vagas: 1, areaUtil: 62, areaTotal: 62, ano: 2027,
    tags: ["lancamento"],
    destaques: ["Entrega 2027", "Sinal + obra + financiamento", "ITBI grátis"],
    descricao:
      "Empreendimento novo na Tijuca, próximo ao metrô. Unidades 2Q com suíte, varanda gourmet, lazer completo (piscina, academia, coworking, pet place). Documentação 100% financiável.",
    caracteristicas: ["Piscina", "Academia", "Coworking", "Pet place", "Salão de festas", "Bicicletário"],
    documentacao: ["Registro de Incorporação (RI) publicado", "Financiamento CEF/Itaú/Bradesco"],
    proximidades: ["Metrô Uruguai", "Shopping Tijuca", "PUC Tijuca"],
    corretor: CORRETORES[1],
    fotos: [
      img("1545324418-cc1a3fa10c00"),
      img("1493809842364-78817add7ffb"),
      img("1519643381401-22c77e60520e"),
    ],
    mapa: { lat: -22.9247, lng: -43.2325 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "medio", publico: ["casal", "familia", "investidor"] },
  },
  {
    slug: "sala-comercial-centro-rio",
    titulo: "Sala Comercial no Centro do Rio — Andar Alto",
    finalidade: ["venda", "aluguel"],
    categoria: "comercial",
    status: "disponivel",
    precoVenda: 480_000,
    precoAluguel: 3_200,
    condominio: 950,
    iptu: 180,
    cidade: "Rio de Janeiro", bairro: "Centro", uf: "RJ", cep: "20040-005",
    quartos: 0, suites: 0, banheiros: 2, vagas: 1, areaUtil: 55, areaTotal: 55, ano: 2008,
    tags: ["oportunidade"],
    destaques: ["Andar alto com vista", "Ar-condicionado central", "Portaria e segurança 24h"],
    descricao:
      "Sala comercial ampla no coração do Centro, próxima à Cinelândia. Pronta para instalação de escritório, clínica ou consultoria. Prédio com fibra ótica, gerador e infraestrutura corporativa.",
    caracteristicas: ["Ar-condicionado central", "Copa", "2 banheiros", "Piso técnico", "Cabeamento estruturado"],
    documentacao: ["Escritura registrada", "IPTU quitado", "Averbação em ordem"],
    proximidades: ["Metrô Cinelândia", "VLT", "Aeroporto Santos Dumont"],
    corretor: CORRETORES[2],
    fotos: [
      img("1497366216548-37526070297c"),
      img("1497366754035-f200968a6e72"),
      img("1524758631624-e2822e304c36"),
    ],
    mapa: { lat: -22.9106, lng: -43.1751 },
    perfilImpulsionito: { objetivo: ["investir", "morar"], orcamentoFaixa: "economico", publico: ["investidor", "corporativo"] },
  },
  {
    slug: "sitio-itaipava-piscina-natural",
    titulo: "Sítio em Itaipava com Piscina Natural — 12.000m²",
    finalidade: ["venda"],
    categoria: "rural",
    status: "disponivel",
    precoVenda: 2_100_000,
    condominio: 0,
    iptu: 0,
    cidade: "Petrópolis", bairro: "Itaipava", uf: "RJ", cep: "25735-004",
    quartos: 4, suites: 2, banheiros: 4, vagas: 6, areaUtil: 380, areaTotal: 12_000, ano: 2012,
    tags: ["alto-padrao"],
    destaques: ["Piscina natural com nascente", "Pomar e horta orgânica", "Casa sede + caseiro"],
    descricao:
      "Sítio com casa sede de 380m², piscina natural alimentada por nascente, pomar produtivo, casa de caseiro independente e trilhas particulares. Escritura 100% regularizada.",
    caracteristicas: ["Nascente", "Poço artesiano", "Casa de caseiro", "Churrasqueira", "Sauna", "Gerador"],
    documentacao: ["Escritura registrada", "CCIR", "ITR quitado"],
    proximidades: ["Centro de Itaipava (5km)", "Cervejaria Bohemia", "BR-040"],
    corretor: CORRETORES[0],
    fotos: [
      img("1502672023488-70e25813eb80"),
      img("1449844908441-8829872d2607"),
      img("1500673922987-e212871fec22"),
    ],
    mapa: { lat: -22.4147, lng: -43.1533 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "alto", publico: ["familia", "investidor"] },
  },
  {
    slug: "apartamento-2q-flamengo-vista-baia",
    titulo: "2 Quartos no Flamengo com Vista da Baía",
    finalidade: ["venda"],
    categoria: "apartamento",
    status: "disponivel",
    precoVenda: 890_000,
    condominio: 1_450,
    iptu: 180,
    cidade: "Rio de Janeiro", bairro: "Flamengo", uf: "RJ", cep: "22220-000",
    quartos: 2, suites: 1, banheiros: 2, vagas: 1, areaUtil: 82, areaTotal: 82, ano: 1998,
    tags: ["vista-mar"],
    destaques: ["Vista frontal da baía", "Reformado", "Piso alto"],
    descricao:
      "Apartamento 2 quartos com vista frontal para a Baía de Guanabara e o Pão de Açúcar. Sala com dois ambientes, cozinha americana e dependência revertida em despensa.",
    caracteristicas: ["Reformado", "Cozinha americana", "Piso vinílico", "Ar-condicionado"],
    documentacao: ["Escritura registrada", "IPTU quitado"],
    proximidades: ["Metrô Flamengo", "Aterro do Flamengo", "Colégio Andrews"],
    corretor: CORRETORES[1],
    fotos: [
      img("1560448204-e02f11c3d0e2"),
      img("1560185008-a33f5c7b1844"),
      img("1522708323590-d24dbb6b0267"),
    ],
    mapa: { lat: -22.9327, lng: -43.1758 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "medio", publico: ["casal", "familia"] },
  },
  {
    slug: "cobertura-ipanema-alto-padrao",
    titulo: "Cobertura Linear em Ipanema — 3 Suítes",
    finalidade: ["venda", "temporada"],
    categoria: "cobertura",
    status: "disponivel",
    precoVenda: 6_450_000,
    precoTemporada: 2_800,
    condominio: 5_200,
    iptu: 1_100,
    cidade: "Rio de Janeiro", bairro: "Ipanema", uf: "RJ", cep: "22410-002",
    quartos: 3, suites: 3, banheiros: 4, vagas: 2, areaUtil: 240, areaTotal: 340, ano: 2018,
    tags: ["alto-padrao"],
    destaques: ["Piscina privativa", "Terraço com vista", "Duas quadras da praia"],
    descricao:
      "Cobertura linear com projeto assinado, piscina privativa, spa e terraço 100m² com vista panorâmica. Localização premium, a duas quadras da Praia de Ipanema.",
    caracteristicas: ["Automação", "Piscina", "Spa", "Adega", "Elevador privativo"],
    documentacao: ["Escritura registrada", "IPTU quitado"],
    proximidades: ["Praia de Ipanema", "Metrô General Osório", "Feira de Ipanema"],
    corretor: CORRETORES[0],
    fotos: [
      img("1600596542815-ffad4c1539a9"),
      img("1600607687939-ce8a6c25118c"),
      img("1613977257363-707ba9348227"),
    ],
    mapa: { lat: -22.9838, lng: -43.2058 },
    perfilImpulsionito: { objetivo: ["morar", "temporada", "investir"], orcamentoFaixa: "luxo", publico: ["familia", "investidor"] },
  },
  {
    slug: "apartamento-3q-recreio-frente-mar",
    titulo: "3 Quartos Frente-Mar no Recreio",
    finalidade: ["venda", "aluguel"],
    categoria: "apartamento",
    status: "disponivel",
    precoVenda: 1_150_000,
    precoAluguel: 5_400,
    condominio: 1_650,
    iptu: 260,
    cidade: "Rio de Janeiro", bairro: "Recreio dos Bandeirantes", uf: "RJ", cep: "22795-008",
    quartos: 3, suites: 1, banheiros: 2, vagas: 2, areaUtil: 110, areaTotal: 110, ano: 2012,
    tags: ["vista-mar"],
    destaques: ["Frente-mar", "Varanda grande", "Lazer completo"],
    descricao:
      "Apartamento frente-mar com varanda ampla, 3 quartos (1 suíte), 2 vagas e lazer completo (piscina, quadra, playground, salão de festas).",
    caracteristicas: ["Varanda", "2 vagas", "Piscina", "Quadra", "Playground"],
    documentacao: ["Escritura registrada", "IPTU quitado"],
    proximidades: ["Praia do Recreio", "BRT Pontal", "Escolas particulares"],
    corretor: CORRETORES[2],
    fotos: [
      img("1512917774080-9991f1c4c750"),
      img("1502672260266-1c1ef2d93688"),
      img("1560448204-603b3fc33ddc"),
    ],
    mapa: { lat: -23.0248, lng: -43.4653 },
    perfilImpulsionito: { objetivo: ["morar", "investir"], orcamentoFaixa: "medio", publico: ["familia"] },
  },
  {
    slug: "terreno-marica-loteamento-fechado",
    titulo: "Terreno 450m² em Loteamento Fechado — Maricá",
    finalidade: ["venda"],
    categoria: "terreno",
    status: "disponivel",
    precoVenda: 320_000,
    condominio: 380,
    iptu: 45,
    cidade: "Maricá", bairro: "Itaipuaçu", uf: "RJ", cep: "24936-500",
    quartos: 0, suites: 0, banheiros: 0, vagas: 0, areaUtil: 450, areaTotal: 450,
    tags: ["oportunidade"],
    destaques: ["Escritura + RGI", "Loteamento com portaria", "Financiamento direto"],
    descricao:
      "Terreno plano em loteamento fechado, com portaria, ruas asfaltadas, água e luz. Pronto para construir. Escritura + RGI, aceita financiamento direto com o loteador.",
    caracteristicas: ["Plano", "Muros laterais", "Água", "Luz", "Portaria 24h"],
    documentacao: ["Escritura + RGI", "Financiamento direto"],
    proximidades: ["Praia de Itaipuaçu", "RJ-106"],
    corretor: CORRETORES[1],
    fotos: [
      img("1500382017468-9049fed747ef"),
      img("1500382017468-9049fed747ef"),
    ],
    mapa: { lat: -22.9722, lng: -42.9647 },
    perfilImpulsionito: { objetivo: ["investir"], orcamentoFaixa: "economico", publico: ["investidor", "familia"] },
  },
  {
    slug: "loja-galeria-ipanema-passagem",
    titulo: "Loja em Galeria de Alto Fluxo — Ipanema",
    finalidade: ["aluguel"],
    categoria: "comercial",
    status: "disponivel",
    precoAluguel: 12_500,
    condominio: 2_800,
    iptu: 480,
    cidade: "Rio de Janeiro", bairro: "Ipanema", uf: "RJ", cep: "22410-020",
    quartos: 0, suites: 0, banheiros: 1, vagas: 0, areaUtil: 42, areaTotal: 42, ano: 2005,
    tags: ["oportunidade"],
    destaques: ["Alto fluxo de pedestres", "Galeria consolidada", "Vitrine dupla"],
    descricao:
      "Loja em galeria com alto fluxo, vitrine dupla, ideal para varejo de moda, óticas ou cafeteria. Contrato flexível para novos negócios.",
    caracteristicas: ["Vitrine dupla", "Ar-condicionado", "Depósito", "Copa"],
    documentacao: ["Contrato padrão 30 meses", "Fiador ou seguro-fiança"],
    proximidades: ["Praia de Ipanema", "Metrô General Osório"],
    corretor: CORRETORES[2],
    fotos: [
      img("1441986300917-64674bd600d8"),
      img("1567521464027-f127ff144326"),
    ],
    mapa: { lat: -22.9843, lng: -43.2019 },
    perfilImpulsionito: { objetivo: ["investir"], orcamentoFaixa: "medio", publico: ["corporativo", "investidor"] },
  },
];

export const CIDADES = Array.from(new Set(IMOVEIS.map((i) => i.cidade))).sort();
export const BAIRROS = Array.from(new Set(IMOVEIS.map((i) => i.bairro))).sort();

export function findImovel(slug: string): Imovel | undefined {
  return IMOVEIS.find((i) => i.slug === slug);
}

export function relacionados(slug: string, limit = 3): Imovel[] {
  const base = findImovel(slug);
  if (!base) return [];
  return IMOVEIS
    .filter((i) => i.slug !== slug)
    .map((i) => ({
      i,
      score:
        (i.bairro === base.bairro ? 3 : 0) +
        (i.categoria === base.categoria ? 2 : 0) +
        (i.finalidade.some((f) => base.finalidade.includes(f)) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.i);
}

export function formatBRL(v?: number) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
