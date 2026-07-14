import type { DemoTemplate } from "./types";

export const imobiliariaLocacao: DemoTemplate = {
  id: "imobiliaria-locacao",
  macro: "imobiliaria",
  sub: "locacao",
  macroLabel: "Imobiliária",
  subLabel: "Locação & Vendas",
  version: 1,
  status: "active",
  branding: {
    businessName: "Garrido Imóveis",
    tagline: "Do primeiro clique à chave na mão.",
    coverImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=70",
  },
  terminology: { customer: "Cliente", order: "Proposta", product: "Imóvel", unit: "Loja" },
  menu: [
    { id: "overview", label: "Visão geral" },
    { id: "imoveis", label: "Portfólio de imóveis" },
    { id: "leads", label: "Leads & Visitas" },
    { id: "propostas", label: "Propostas & Contratos", minPlan: "ideal" },
    { id: "vitrine", label: "Vitrine pública" },
    { id: "cobranca", label: "Cobrança & Repasse", minPlan: "ideal" },
    { id: "bi", label: "BI comercial", minPlan: "full" },
    { id: "portais", label: "Integração portais", minPlan: "full" },
  ],
  indicators: [
    { id: "leads", label: "Leads na semana", value: "62", trend: "up" },
    { id: "visitas", label: "Visitas agendadas", value: "18" },
    { id: "propostas", label: "Propostas em curso", value: "9", minPlan: "ideal" },
    { id: "conv", label: "Conversão visita→proposta", value: "27%", trend: "up", minPlan: "ideal" },
    { id: "inadimp", label: "Inadimplência", value: "3,2%", trend: "down", minPlan: "full" },
  ],
  alerts: [
    { id: "sla", severity: "warning", title: "5 leads sem resposta há +2h", message: "SLA do funil comprometido — redistribua para corretores online." },
    { id: "vitrine", severity: "info", title: "12 imóveis sem foto de capa", message: "Corrija para aumentar o CTR na vitrine." },
    { id: "renov", severity: "opportunity", title: "8 contratos vencem em 60 dias", message: "Ative fluxo de renovação automática.", minPlan: "ideal" },
  ],
  actions: [
    { id: "novo", label: "Cadastrar imóvel" },
    { id: "distribuir", label: "Distribuir leads pendentes" },
    { id: "proposta", label: "Nova proposta", minPlan: "ideal" },
  ],
  tables: [
    {
      id: "top",
      title: "Imóveis mais visitados",
      columns: [
        { key: "cod", label: "Cód" },
        { key: "tipo", label: "Tipo" },
        { key: "bairro", label: "Bairro" },
        { key: "views", label: "Visitas" },
        { key: "leads", label: "Leads" },
      ],
      rows: [
        { cod: "AP-1204", tipo: "Apto 3 quartos", bairro: "Icaraí", views: 428, leads: 14 },
        { cod: "CA-089", tipo: "Casa condomínio", bairro: "Itaipu", views: 312, leads: 11 },
        { cod: "AP-0771", tipo: "Cobertura", bairro: "Ingá", views: 267, leads: 9 },
        { cod: "SL-045", tipo: "Sala comercial", bairro: "Centro", views: 204, leads: 6 },
      ],
    },
  ],
  plans: {
    essential: {
      headline: "Portfólio, leads e vitrine pública prontos.",
      benefit: "Cadastro de imóveis, captação de leads, agendamento de visitas e vitrine pronta.",
      extraFeatures: ["Portfólio", "Leads & visitas", "Vitrine pública", "WhatsApp básico"],
    },
    ideal: {
      headline: "Propostas, contratos e cobrança automática.",
      benefit: "Fluxo de propostas, geração de contratos, cobrança de aluguel e repasse ao proprietário.",
      extraFeatures: ["Propostas & contratos", "Cobrança & repasse", "Renovação automática", "Distribuição de leads"],
    },
    full: {
      headline: "BI, portais e escala multi-loja.",
      benefit: "BI comercial, integração com portais (ZAP, Viva Real), múltiplas lojas e assinatura digital.",
      extraFeatures: ["BI comercial", "Integração portais", "Multi-loja", "Assinatura digital"],
    },
  },
  recommendedPlan: "ideal",
  conversion: {
    primaryCTA: "Contratar Impulsionando para minha imobiliária",
    secondaryCTA: "Falar com um consultor",
  },
  seo: {
    title: "Demo Imobiliária — Portfólio, leads e contratos | Impulsionando",
    description: "Demonstração navegável para imobiliárias: portfólio, leads, propostas, cobrança e BI. Compare Essencial, Ideal e Full.",
    ogImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=70",
  },
};
