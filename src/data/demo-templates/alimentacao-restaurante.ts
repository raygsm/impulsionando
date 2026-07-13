import type { DemoTemplate } from "./types";

export const alimentacaoRestaurante: DemoTemplate = {
  id: "alimentacao-restaurante",
  macro: "alimentacao",
  sub: "restaurante",
  macroLabel: "Alimentação",
  subLabel: "Restaurante",
  version: 1,
  status: "active",
  branding: {
    businessName: "Cantina Bella Massa",
    tagline: "Sabor de casa, gestão de verdade.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70",
  },
  terminology: {
    customer: "Cliente",
    order: "Pedido",
    product: "Prato",
    unit: "Mesa",
  },
  menu: [
    { id: "overview", label: "Visão geral", icon: "gauge" },
    { id: "orders", label: "Pedidos & Mesas", icon: "utensils" },
    { id: "menu", label: "Cardápio", icon: "book-open" },
    { id: "customers", label: "Clientes", icon: "users" },
    { id: "stock", label: "Estoque de insumos", icon: "package", minPlan: "ideal" },
    { id: "journeys", label: "Automação & Fidelidade", icon: "sparkles", minPlan: "ideal" },
    { id: "finance", label: "Financeiro", icon: "wallet" },
    { id: "reports", label: "Relatórios executivos", icon: "bar-chart-3", minPlan: "full" },
    { id: "units", label: "Multi-unidades", icon: "building-2", minPlan: "full" },
  ],
  indicators: [
    { id: "revenue", label: "Faturamento hoje", value: "R$ 8.420", trend: "up", hint: "+12% vs ontem" },
    { id: "ticket", label: "Ticket médio", value: "R$ 68", trend: "up" },
    { id: "tables", label: "Mesas ocupadas", value: "14/22" },
    { id: "retention", label: "Retenção 30d", value: "38%", trend: "up", minPlan: "ideal" },
    { id: "waste", label: "Perda de insumos", value: "2,1%", trend: "down", minPlan: "full" },
  ],
  alerts: [
    { id: "stock-fille", severity: "critical", title: "Filé mignon abaixo do mínimo", message: "Restam 2,4 kg. Sugerimos pedido ao fornecedor Frigo Sul." },
    { id: "no-show", severity: "warning", title: "3 reservas sem confirmação para hoje", message: "Ative confirmação automática no WhatsApp para reduzir faltas.", minPlan: "ideal" },
    { id: "opportunity", severity: "opportunity", title: "12 clientes não voltam há 45 dias", message: "Dispare campanha de recuperação com voucher de 10%.", minPlan: "ideal" },
  ],
  actions: [
    { id: "new-order", label: "Abrir novo pedido", helper: "Balcão, mesa ou delivery" },
    { id: "confirm-reservations", label: "Confirmar reservas do dia" },
    { id: "campaign", label: "Disparar campanha de recuperação", minPlan: "ideal" },
  ],
  tables: [
    {
      id: "top-dishes",
      title: "Pratos mais vendidos na semana",
      columns: [
        { key: "dish", label: "Prato" },
        { key: "sold", label: "Vendidos" },
        { key: "revenue", label: "Receita" },
      ],
      rows: [
        { dish: "Nhoque ao Sugo", sold: 84, revenue: "R$ 3.360" },
        { dish: "Lasanha Bolonhesa", sold: 71, revenue: "R$ 3.195" },
        { dish: "Fettuccine Alfredo", sold: 63, revenue: "R$ 2.520" },
        { dish: "Tiramisù", sold: 52, revenue: "R$ 1.040" },
      ],
    },
    {
      id: "critical-stock",
      title: "Insumos em atenção",
      minPlan: "ideal",
      columns: [
        { key: "item", label: "Insumo" },
        { key: "qty", label: "Quantidade" },
        { key: "status", label: "Status" },
      ],
      rows: [
        { item: "Filé mignon", qty: "2,4 kg", status: "Crítico" },
        { item: "Molho de tomate", qty: "6 latas", status: "Baixo" },
        { item: "Vinho tinto seco", qty: "8 gf", status: "Baixo" },
        { item: "Farinha 00", qty: "12 kg", status: "Ok" },
      ],
    },
  ],
  plans: {
    essential: {
      headline: "Organize pedidos, mesas e caixa em um só lugar.",
      benefit: "Ideal para começar: cadastro de clientes, cardápio, pedidos e visão financeira do dia.",
      extraFeatures: ["Cadastro de clientes", "Cardápio digital", "Pedidos e mesas", "Financeiro básico"],
    },
    ideal: {
      headline: "Automatize relacionamento e controle seu estoque.",
      benefit: "Adiciona controle de insumos, confirmação de reservas por WhatsApp, campanhas e fidelidade.",
      extraFeatures: ["Estoque de insumos", "Fidelidade & cashback", "Confirmação WhatsApp", "Campanhas segmentadas"],
    },
    full: {
      headline: "Gestão multi-unidades com inteligência executiva.",
      benefit: "Adiciona relatórios executivos, múltiplas unidades, permissões avançadas e integrações premium.",
      extraFeatures: ["Multi-unidades", "Relatórios executivos", "BI de perdas", "Permissões avançadas", "Integrações premium"],
    },
  },
  recommendedPlan: "ideal",
  conversion: {
    primaryCTA: "Contratar Impulsionando para meu restaurante",
    secondaryCTA: "Falar com um consultor",
  },
  seo: {
    title: "Demo Restaurante — Gestão completa para bares e restaurantes | Impulsionando",
    description: "Demonstração navegável para restaurantes: pedidos, mesas, cardápio, estoque de insumos, fidelidade e multi-unidades. Compare os planos Essencial, Ideal e Full.",
    ogImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70",
  },
};
