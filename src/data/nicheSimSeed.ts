/**
 * Seeds e "stories" por macro-nicho para o simulador integrado da demo.
 * Cada nicho do site cai num dos 5 grupos:
 *   - clinica      (clinicas, psicologia)
 *   - imobiliaria  (imobiliaria)
 *   - bar          (bares-restaurantes, microcervejarias)
 *   - varejo       (ecommerce, veiculos)
 *   - servicos     (servicos, contabilidade, juridico, eventos, white-label)
 *
 * A história é o roteiro que o lead vê ao entrar — explica o que cada
 * ação no simulador representa na operação real do nicho.
 */
import type { RecLevel } from "./nicheRecommendations";

export type SimGroup = "clinica" | "imobiliaria" | "bar" | "varejo" | "servicos";

export type SimProduct = { sku: string; name: string; price: number; stock: number };

export type SimSeed = {
  group: SimGroup;
  storyTitle: string;
  storyBody: string;
  kpiHero: { label: string; value: string };
  products: SimProduct[];
  leadName: string;
  serviceLabel: string;     // nome usado no painel Agenda (ex.: "Consulta", "Visita ao imóvel")
  orderLabel: string;       // nome usado no painel Vendas (ex.: "Comanda", "Pedido", "Contrato")
  customerLabel: string;    // "Paciente", "Cliente", "Comprador" etc.
};

const GROUP_BY_NICHE: Record<string, SimGroup> = {
  clinicas: "clinica",
  psicologia: "clinica",
  imobiliaria: "imobiliaria",
  "bares-restaurantes": "bar",
  microcervejarias: "bar",
  ecommerce: "varejo",
  veiculos: "varejo",
  servicos: "servicos",
  contabilidade: "servicos",
  juridico: "servicos",
  eventos: "servicos",
  "white-label": "servicos",
};

const SEEDS: Record<SimGroup, SimSeed> = {
  clinica: {
    group: "clinica",
    storyTitle: "Clínica multiprofissional · sexta-feira, 14h",
    storyBody:
      "Você é gestor(a) de uma clínica com 4 profissionais. A recepção fechou a agenda da manhã, há retornos atrasados e a tesouraria precisa fechar o dia. Cada ação aqui dispara automações reais: agendar → confirmar via WhatsApp → cobrar → atualizar prontuário.",
    kpiHero: { label: "Consultas hoje", value: "0" },
    products: [
      { sku: "CONS-CARDIO", name: "Consulta cardiologia", price: 380, stock: 99 },
      { sku: "EXAM-LAB", name: "Pacote de exames", price: 220, stock: 99 },
      { sku: "PROC-MIN", name: "Procedimento ambulatorial", price: 540, stock: 99 },
    ],
    leadName: "Marina Costa",
    serviceLabel: "Consulta",
    orderLabel: "Atendimento",
    customerLabel: "Paciente",
  },
  imobiliaria: {
    group: "imobiliaria",
    storyTitle: "Imobiliária · campanha quente do final de semana",
    storyBody:
      "Sua vitrine recebeu 17 leads de um anúncio no Instagram. Cada lead deve virar visita agendada, com contrato e comissão registradas. O simulador mostra o caminho do lead frio à comissão paga, com a IA do Impulsionito ajudando o corretor.",
    kpiHero: { label: "Visitas agendadas", value: "0" },
    products: [
      { sku: "AP-205", name: "Apartamento 2 dorm. Tijuca", price: 480000, stock: 1 },
      { sku: "CA-118", name: "Casa Recreio 3 suítes", price: 1_250_000, stock: 1 },
      { sku: "SL-COM", name: "Sala comercial Centro", price: 320000, stock: 3 },
    ],
    leadName: "Família Andrade",
    serviceLabel: "Visita ao imóvel",
    orderLabel: "Proposta",
    customerLabel: "Comprador",
  },
  bar: {
    group: "bar",
    storyTitle: "Bar & restaurante · sexta-feira lotada",
    storyBody:
      "Casa cheia, 12 mesas ativas. Cada comanda baixa estoque, gera nota, atualiza o ranking de garçons e dispara cupom de retorno via WhatsApp. Simule abrir comanda, fechar conta e ver a fidelização disparar sozinha.",
    kpiHero: { label: "Comandas abertas", value: "0" },
    products: [
      { sku: "CHOPP-IPA", name: "Chopp IPA 500ml", price: 22, stock: 120 },
      { sku: "BURGER-CLASS", name: "Burger Clássico", price: 38, stock: 60 },
      { sku: "COMBO-CASAL", name: "Combo casal", price: 119, stock: 30 },
    ],
    leadName: "Mesa 7 · Rafael",
    serviceLabel: "Reserva",
    orderLabel: "Comanda",
    customerLabel: "Cliente",
  },
  varejo: {
    group: "varejo",
    storyTitle: "Varejo omnichannel · Black Friday rodando",
    storyBody:
      "Loja física + e-commerce + delivery. Cada venda baixa estoque único, gera fatura, alimenta o BI e dispara remarketing. Veja o pedido nascer no PDV ou no site e seguir até a recompra automática.",
    kpiHero: { label: "Receita hoje", value: "R$ 0" },
    products: [
      { sku: "TEN-AIR-42", name: "Tênis runner 42", price: 459, stock: 14 },
      { sku: "JKT-CORTAVENTO", name: "Jaqueta corta-vento", price: 289, stock: 22 },
      { sku: "ACS-MOCH-35L", name: "Mochila 35L", price: 199, stock: 40 },
    ],
    leadName: "Bruno Tavares",
    serviceLabel: "Retirada na loja",
    orderLabel: "Pedido",
    customerLabel: "Cliente",
  },
  servicos: {
    group: "servicos",
    storyTitle: "Prestador de serviços · pipeline da semana",
    storyBody:
      "Você fecha contratos recorrentes (mensalidades) e projetos pontuais. Cada lead vira proposta → contrato assinado → fatura recorrente → cobrança automática se atrasar. O CRM e o Financeiro andam grudados.",
    kpiHero: { label: "Propostas abertas", value: "0" },
    products: [
      { sku: "CTR-MENSAL", name: "Contrato mensal padrão", price: 1490, stock: 99 },
      { sku: "CTR-AVULSO", name: "Projeto avulso", price: 4800, stock: 99 },
      { sku: "CTR-PREMIUM", name: "Contrato premium", price: 3490, stock: 99 },
    ],
    leadName: "Construtora Andrade",
    serviceLabel: "Reunião comercial",
    orderLabel: "Contrato",
    customerLabel: "Cliente",
  },
};

export function getNicheSimSeed(niche: string | undefined): SimSeed {
  if (!niche) return SEEDS.servicos;
  const group = GROUP_BY_NICHE[niche] ?? "servicos";
  return SEEDS[group];
}

/** Mapa demo plan → plan code do checkout real. */
export const DEMO_PLAN_TO_CODE: Record<RecLevel, "essencial" | "integrado" | "avancado"> = {
  essencial: "essencial",
  ideal: "integrado",
  full: "avancado",
};

export const DEMO_PLAN_DISPLAY: Record<RecLevel, string> = {
  essencial: "Essencial",
  ideal: "Ideal",
  full: "Full",
};
