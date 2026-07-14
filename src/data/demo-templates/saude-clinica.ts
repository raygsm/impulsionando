import type { DemoTemplate } from "./types";

export const saudeClinica: DemoTemplate = {
  id: "saude-clinica",
  macro: "saude",
  sub: "clinica",
  macroLabel: "Saúde",
  subLabel: "Clínica",
  version: 1,
  status: "active",
  branding: {
    businessName: "Clínica Vida Plena",
    tagline: "Cuidado próximo, gestão precisa.",
    coverImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=70",
  },
  terminology: { customer: "Paciente", order: "Atendimento", product: "Procedimento", unit: "Consultório" },
  menu: [
    { id: "overview", label: "Visão geral" },
    { id: "agenda", label: "Agenda & Encaixes" },
    { id: "patients", label: "Pacientes" },
    { id: "prontuario", label: "Prontuário digital", minPlan: "ideal" },
    { id: "convenios", label: "Convênios & TISS", minPlan: "ideal" },
    { id: "finance", label: "Financeiro" },
    { id: "campaigns", label: "Recall & Campanhas", minPlan: "ideal" },
    { id: "bi", label: "BI clínico", minPlan: "full" },
    { id: "units", label: "Multi-unidades", minPlan: "full" },
  ],
  indicators: [
    { id: "today", label: "Agendamentos hoje", value: "38", trend: "up", hint: "+6 vs média" },
    { id: "ocupacao", label: "Ocupação da agenda", value: "82%" },
    { id: "noshow", label: "No-show 7d", value: "4,1%", trend: "down" },
    { id: "recall", label: "Pacientes p/ recall", value: "127", minPlan: "ideal" },
    { id: "receita", label: "Receita do mês", value: "R$ 184.320", trend: "up", minPlan: "full" },
  ],
  alerts: [
    { id: "conf", severity: "warning", title: "9 consultas sem confirmação amanhã", message: "Envie lembrete via WhatsApp para reduzir no-show." },
    { id: "recall", severity: "opportunity", title: "23 pacientes há +6 meses sem retorno", message: "Dispare campanha de recall com agenda sugerida.", minPlan: "ideal" },
    { id: "tiss", severity: "critical", title: "3 guias TISS pendentes de envio", message: "Envie hoje para não perder o faturamento do lote.", minPlan: "ideal" },
  ],
  actions: [
    { id: "novo", label: "Novo agendamento" },
    { id: "confirmar", label: "Confirmar consultas do dia" },
    { id: "recall", label: "Disparar campanha de recall", minPlan: "ideal" },
  ],
  tables: [
    {
      id: "next",
      title: "Próximos atendimentos",
      columns: [
        { key: "hora", label: "Hora" },
        { key: "paciente", label: "Paciente" },
        { key: "proc", label: "Procedimento" },
        { key: "prof", label: "Profissional" },
      ],
      rows: [
        { hora: "09:00", paciente: "Ana Souza", proc: "Consulta cardiologia", prof: "Dra. Marina" },
        { hora: "09:30", paciente: "Pedro Lima", proc: "Retorno", prof: "Dr. Ricardo" },
        { hora: "10:00", paciente: "Julia Reis", proc: "Ecocardiograma", prof: "Dra. Marina" },
        { hora: "10:40", paciente: "Marcos Dias", paciente_id: 4, proc: "Consulta", prof: "Dr. Ricardo" },
      ],
    },
  ],
  plans: {
    essential: {
      headline: "Agenda, pacientes e financeiro em um só lugar.",
      benefit: "Cadastro completo, agenda com encaixes, lembretes básicos e financeiro do dia.",
      extraFeatures: ["Agenda inteligente", "Cadastro de pacientes", "Lembretes SMS", "Financeiro básico"],
    },
    ideal: {
      headline: "Prontuário, convênios e recall automático.",
      benefit: "Prontuário digital, TISS, WhatsApp de confirmação e campanhas de recall.",
      extraFeatures: ["Prontuário digital", "TISS", "WhatsApp oficial", "Recall automático"],
    },
    full: {
      headline: "BI clínico e gestão multi-unidades.",
      benefit: "Indicadores clínicos, múltiplas unidades, auditoria e integrações premium.",
      extraFeatures: ["BI clínico", "Multi-unidades", "Auditoria LGPD", "Integrações premium"],
    },
  },
  recommendedPlan: "ideal",
  conversion: {
    primaryCTA: "Contratar Impulsionando para minha clínica",
    secondaryCTA: "Falar com um consultor",
  },
  seo: {
    title: "Demo Clínica — Agenda, prontuário e recall para clínicas | Impulsionando",
    description: "Demonstração navegável para clínicas: agenda, prontuário, TISS, WhatsApp e BI. Compare Essencial, Ideal e Full.",
    ogImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=70",
  },
};
