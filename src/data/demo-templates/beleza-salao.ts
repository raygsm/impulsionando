import type { DemoTemplate } from "./types";

export const belezaSalao: DemoTemplate = {
  id: "beleza-salao",
  macro: "beleza",
  sub: "salao",
  macroLabel: "Beleza & Bem-estar",
  subLabel: "Salão & Estética",
  version: 1,
  status: "active",
  branding: {
    businessName: "Studio Colors",
    tagline: "Beleza que fideliza.",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=70",
  },
  terminology: { customer: "Cliente", order: "Serviço", product: "Procedimento", unit: "Cadeira" },
  menu: [
    { id: "overview", label: "Visão geral" },
    { id: "agenda", label: "Agenda por profissional" },
    { id: "clientes", label: "Clientes & Ficha" },
    { id: "comissoes", label: "Comissões", minPlan: "ideal" },
    { id: "estoque", label: "Estoque de produtos", minPlan: "ideal" },
    { id: "fidelidade", label: "Fidelidade & Cashback", minPlan: "ideal" },
    { id: "finance", label: "Financeiro" },
    { id: "bi", label: "BI de operação", minPlan: "full" },
  ],
  indicators: [
    { id: "hoje", label: "Atendimentos hoje", value: "24", trend: "up" },
    { id: "ticket", label: "Ticket médio", value: "R$ 142" },
    { id: "ocup", label: "Ocupação das cadeiras", value: "76%" },
    { id: "fid", label: "Clientes fidelizados", value: "312", minPlan: "ideal" },
    { id: "com", label: "Comissões do mês", value: "R$ 18.940", minPlan: "ideal" },
  ],
  alerts: [
    { id: "conf", severity: "warning", title: "6 agendamentos sem confirmação", message: "Envie lembrete WhatsApp automático." },
    { id: "prod", severity: "critical", title: "Coloração 9.0 acabando", message: "Estoque em 3 unidades — reponha hoje.", minPlan: "ideal" },
    { id: "aniv", severity: "opportunity", title: "14 aniversariantes na semana", message: "Envie voucher automático de 15%.", minPlan: "ideal" },
  ],
  actions: [
    { id: "novo", label: "Novo agendamento" },
    { id: "conf", label: "Confirmar agenda do dia" },
    { id: "voucher", label: "Enviar vouchers de aniversário", minPlan: "ideal" },
  ],
  tables: [
    {
      id: "top-serv",
      title: "Serviços mais realizados",
      columns: [
        { key: "serv", label: "Serviço" },
        { key: "qty", label: "Realizados" },
        { key: "rec", label: "Receita" },
      ],
      rows: [
        { serv: "Escova progressiva", qty: 42, rec: "R$ 8.400" },
        { serv: "Corte + coloração", qty: 61, rec: "R$ 7.930" },
        { serv: "Manicure + Pedicure", qty: 118, rec: "R$ 5.900" },
        { serv: "Design de sobrancelha", qty: 87, rec: "R$ 3.480" },
      ],
    },
  ],
  plans: {
    essential: {
      headline: "Agenda, clientes e caixa organizados.",
      benefit: "Agenda por profissional, ficha do cliente e financeiro básico.",
      extraFeatures: ["Agenda por profissional", "Ficha do cliente", "Financeiro básico", "Lembretes"],
    },
    ideal: {
      headline: "Comissões, estoque e fidelidade automática.",
      benefit: "Comissões, controle de produtos, fidelidade, cashback e campanhas de aniversário.",
      extraFeatures: ["Comissões", "Estoque", "Fidelidade & cashback", "Campanhas WhatsApp"],
    },
    full: {
      headline: "BI e gestão multi-unidade.",
      benefit: "BI de operação, permissões avançadas, multi-unidade e integrações premium.",
      extraFeatures: ["BI de operação", "Multi-unidade", "Permissões avançadas", "Integrações premium"],
    },
  },
  recommendedPlan: "ideal",
  conversion: {
    primaryCTA: "Contratar Impulsionando para meu salão",
    secondaryCTA: "Falar com um consultor",
  },
  seo: {
    title: "Demo Salão — Agenda, comissões e fidelidade | Impulsionando",
    description: "Demonstração navegável para salões e estética: agenda, comissões, estoque, fidelidade e BI. Compare Essencial, Ideal e Full.",
    ogImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=70",
  },
};
