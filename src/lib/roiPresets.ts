/**
 * Catálogo de presets para simulação de ROI e economia de tempo por módulo.
 * Premissas conservadoras, baseadas em benchmarks de mercado e operação típica.
 * Todos os valores são parametrizáveis nos sliders.
 */
export type RoiPreset = {
  key: string;
  label: string;
  // entradas
  inputs: {
    volume: { label: string; min: number; max: number; step: number; default: number; unit: string };
    ticket?: { label: string; min: number; max: number; step: number; default: number };
    minutosManuais: { label: string; min: number; max: number; step: number; default: number };
  };
  // multiplicadores
  conversionUplift: number; // ex: 0.15 = +15% conversão
  retentionUplift?: number; // recompra/recorrência
  costPerHour: number; // custo médio operacional R$/h
  description: string;
};

export const ROI_PRESETS: RoiPreset[] = [
  {
    key: "crm",
    label: "CRM + Atendimento",
    description: "Pipeline, follow-up automático, templates e jornada de cliente.",
    inputs: {
      volume: { label: "Leads/mês", min: 50, max: 5000, step: 50, default: 600, unit: "leads" },
      ticket: { label: "Ticket médio (R$)", min: 50, max: 5000, step: 50, default: 350 },
      minutosManuais: { label: "Minutos manuais por lead", min: 1, max: 30, step: 1, default: 6 },
    },
    conversionUplift: 0.18,
    retentionUplift: 0.10,
    costPerHour: 35,
  },
  {
    key: "whatsapp",
    label: "WhatsApp + Automação",
    description: "Atendimento multi-atendente, templates, jornadas e recuperação.",
    inputs: {
      volume: { label: "Conversas/mês", min: 100, max: 20000, step: 100, default: 2500, unit: "conversas" },
      ticket: { label: "Ticket médio (R$)", min: 30, max: 3000, step: 10, default: 180 },
      minutosManuais: { label: "Minutos por conversa", min: 1, max: 15, step: 1, default: 3 },
    },
    conversionUplift: 0.22,
    retentionUplift: 0.08,
    costPerHour: 30,
  },
  {
    key: "afiliados",
    label: "Afiliados + Order Bump",
    description: "Split automático, order bump, ranking e recuperação de carrinho.",
    inputs: {
      volume: { label: "Vendas/mês", min: 20, max: 5000, step: 10, default: 300, unit: "vendas" },
      ticket: { label: "Ticket médio (R$)", min: 50, max: 3000, step: 10, default: 250 },
      minutosManuais: { label: "Minutos por venda (controle manual)", min: 1, max: 20, step: 1, default: 4 },
    },
    conversionUplift: 0.25,
    retentionUplift: 0.12,
    costPerHour: 40,
  },
  {
    key: "checkout",
    label: "Checkout + Pagamentos",
    description: "Pix, cartão até 12x, boleto, recuperação automática.",
    inputs: {
      volume: { label: "Tentativas/mês", min: 50, max: 10000, step: 50, default: 800, unit: "tentativas" },
      ticket: { label: "Ticket médio (R$)", min: 30, max: 5000, step: 10, default: 280 },
      minutosManuais: { label: "Minutos de conciliação por venda", min: 1, max: 15, step: 1, default: 3 },
    },
    conversionUplift: 0.20,
    retentionUplift: 0.05,
    costPerHour: 45,
  },
  {
    key: "eventos",
    label: "Eventos + Ingressos",
    description: "QR Code, check-in mobile e painel de presença em tempo real.",
    inputs: {
      volume: { label: "Participantes/evento", min: 50, max: 20000, step: 50, default: 800, unit: "ingressos" },
      ticket: { label: "Ingresso médio (R$)", min: 20, max: 2000, step: 10, default: 90 },
      minutosManuais: { label: "Minutos check-in manual", min: 1, max: 10, step: 1, default: 2 },
    },
    conversionUplift: 0.10,
    costPerHour: 25,
  },
  {
    key: "agenda",
    label: "Agenda + Confirmação",
    description: "Confirmação automática, lembretes e redução de no-show.",
    inputs: {
      volume: { label: "Agendamentos/mês", min: 50, max: 5000, step: 50, default: 500, unit: "agendamentos" },
      ticket: { label: "Ticket médio (R$)", min: 30, max: 2000, step: 10, default: 150 },
      minutosManuais: { label: "Minutos por confirmação", min: 1, max: 10, step: 1, default: 3 },
    },
    conversionUplift: 0.12,
    retentionUplift: 0.15,
    costPerHour: 28,
  },
];

export function computeRoi(preset: RoiPreset, volume: number, ticket: number, minutosManuais: number) {
  const receitaBase = volume * ticket;
  const upliftReceita = receitaBase * preset.conversionUplift;
  const upliftRetencao = preset.retentionUplift ? receitaBase * preset.retentionUplift : 0;
  const minutosTotais = volume * minutosManuais;
  const horasEconomizadas = minutosTotais / 60;
  // assumir 70% das horas viram economia real após automação
  const horasEconomizadasReais = horasEconomizadas * 0.7;
  const economiaCusto = horasEconomizadasReais * preset.costPerHour;
  const ganhoMensal = upliftReceita + upliftRetencao + economiaCusto;
  const ganhoAnual = ganhoMensal * 12;
  return {
    receitaBase,
    upliftReceita,
    upliftRetencao,
    horasEconomizadas: horasEconomizadasReais,
    economiaCusto,
    ganhoMensal,
    ganhoAnual,
  };
}
