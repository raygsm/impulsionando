/**
 * Catálogo mock (frontend-only) dos workflows N8N do Ecossistema Impulsionando.
 * Fonte de verdade: docs/n8n/CATALOGO.md + docs/n8n/generate-workflows.mjs.
 * Este arquivo NÃO faz I/O — apenas alimenta as telas de /core/automacao.
 *
 * Nenhum item aqui dispara canal real. Todos nascem em modo:demo, rascunho.
 */

export type Regua =
  | "captacao" | "conversao" | "relacionamento" | "retencao"
  | "financeiro" | "suporte" | "vitrine" | "nicho";

export type Canal = "whatsapp" | "email" | "impulsionito" | "internal";
export type Plano = "free" | "essencial" | "pro" | "premium" | "wl";
export type Status = "rascunho" | "pronto" | "ativo" | "pausado" | "erro" | "aguardando_credencial";
export type Modo = "demo" | "producao";

export interface Workflow {
  id: number;
  slug: string;
  nome: string;
  regua: Regua;
  gatilho: string;
  canais: Canal[];
  planoMin: Plano;
  status: Status;
  modo: Modo;
  nichos?: string[];
}

const c = (id: number, slug: string, nome: string, regua: Regua, gatilho: string, canais: Canal[], planoMin: Plano): Workflow => ({
  id, slug, nome, regua, gatilho, canais, planoMin, status: "rascunho", modo: "demo",
});

export const CATALOG: Workflow[] = [
  c(1, "lead-captado", "Lead captado", "captacao", "form/lp → lead", ["email","impulsionito"], "free"),
  c(2, "lead-qualificado", "Lead qualificado", "captacao", "score ≥ threshold", ["whatsapp","email"], "essencial"),
  c(3, "lead-sem-resposta", "Lead sem resposta", "captacao", "48h sem interação", ["whatsapp","email"], "essencial"),
  c(4, "lead-quente", "Lead quente", "captacao", "intent alto", ["whatsapp","internal"], "pro"),
  c(5, "lead-vitrine", "Lead da vitrine", "captacao", "clique/contato vitrine", ["email","impulsionito"], "free"),
  c(6, "lead-whatsapp", "Lead via WhatsApp", "captacao", "msg WhatsApp", ["whatsapp"], "essencial"),
  c(7, "lead-quiz", "Lead via quiz", "captacao", "quiz concluído", ["email","impulsionito"], "free"),
  c(8, "lead-redes-sociais", "Lead redes sociais", "captacao", "Meta/Insta/TikTok Ads", ["whatsapp","email"], "pro"),
  c(9, "cadastro-iniciado", "Cadastro iniciado", "conversao", "signup.start", ["email"], "free"),
  c(10, "cadastro-abandonado", "Cadastro abandonado", "conversao", "30min sem completar", ["email","whatsapp"], "essencial"),
  c(11, "cadastro-concluido", "Cadastro concluído", "conversao", "user.created", ["email","impulsionito"], "free"),
  c(12, "checkout-iniciado", "Checkout iniciado", "conversao", "checkout.started", ["email"], "essencial"),
  c(13, "pix-gerado", "PIX gerado", "conversao", "invoice.pix_created", ["whatsapp","email"], "essencial"),
  c(14, "pix-expirado", "PIX expirado", "conversao", "invoice.pix_expired", ["whatsapp","email"], "essencial"),
  c(15, "cartao-recusado", "Cartão recusado", "conversao", "payment.card_declined", ["email","whatsapp"], "essencial"),
  c(16, "pagamento-aprovado", "Pagamento aprovado", "conversao", "payment.approved", ["email","whatsapp","impulsionito"], "essencial"),
  c(17, "boleto-emitido", "Boleto emitido", "conversao", "invoice.boleto_created", ["email"], "essencial"),
  c(18, "boleto-pago", "Boleto pago", "conversao", "invoice.boleto_paid", ["email","whatsapp"], "essencial"),
  c(19, "trial-premium-iniciado", "Teste Premium iniciado", "conversao", "subscription.trial_started", ["email","impulsionito"], "free"),
  c(20, "boas-vindas", "Boas-vindas", "relacionamento", "account.activated", ["email","impulsionito"], "free"),
  c(21, "onboarding-d0", "Onboarding D0", "relacionamento", "+0d", ["impulsionito","email"], "free"),
  c(22, "onboarding-d1", "Onboarding D1", "relacionamento", "+1d", ["email","whatsapp"], "free"),
  c(23, "onboarding-d3", "Onboarding D3", "relacionamento", "+3d", ["email"], "free"),
  c(24, "onboarding-d7", "Onboarding D7", "relacionamento", "+7d", ["email"], "free"),
  c(25, "modulo-nao-configurado", "Módulo não configurado", "relacionamento", "48h sem config", ["impulsionito","email"], "essencial"),
  c(26, "cliente-sem-uso", "Cliente sem uso", "relacionamento", "14d sem login", ["email","whatsapp"], "essencial"),
  c(27, "cliente-engajado", "Cliente engajado", "relacionamento", "uso alto", ["email","impulsionito"], "pro"),
  c(28, "sugestao-recurso", "Sugestão de recurso", "relacionamento", "heurística IA", ["impulsionito"], "pro"),
  c(29, "tutorial-automatico", "Tutorial automático", "relacionamento", "primeira vez", ["impulsionito"], "free"),
  c(30, "impulsionito-proativo", "Impulsionito proativo", "relacionamento", "padrão detectado", ["impulsionito"], "pro"),
  c(31, "trial-d15", "Trial D15", "retencao", "+15d trial", ["email","impulsionito"], "free"),
  c(32, "trial-d25", "Trial D25", "retencao", "+25d trial", ["email","whatsapp"], "free"),
  c(33, "trial-d29", "Trial D29 (última chance)", "retencao", "+29d trial", ["whatsapp","email"], "free"),
  c(34, "trial-expirado", "Trial expirado", "retencao", "trial.ended", ["email","impulsionito"], "free"),
  c(35, "renovacao-proxima", "Renovação próxima", "retencao", "7d antes venc.", ["email","whatsapp"], "essencial"),
  c(36, "cancelamento-solicitado", "Cancelamento solicitado", "retencao", "cancel.requested", ["internal","email"], "essencial"),
  c(37, "cancelamento-confirmado", "Cancelamento confirmado", "retencao", "cancel.confirmed", ["email","internal"], "essencial"),
  c(38, "reativacao", "Reativação", "retencao", "ex-cliente volta", ["email","whatsapp"], "essencial"),
  c(39, "upsell-oportunidade", "Upsell oportunidade", "retencao", "heurística uso", ["impulsionito","email"], "pro"),
  c(40, "downgrade-preventivo", "Downgrade preventivo", "retencao", "baixo uso + venc.", ["impulsionito","email"], "pro"),
  c(41, "pagamento-confirmado", "Pagamento confirmado", "financeiro", "payment.confirmed", ["email","whatsapp"], "essencial"),
  c(42, "pagamento-recusado", "Pagamento recusado", "financeiro", "payment.failed", ["email","whatsapp"], "essencial"),
  c(43, "inadimplencia", "Inadimplência", "financeiro", "+3d atraso", ["whatsapp","email"], "essencial"),
  c(44, "suspensao-automatica", "Suspensão automática", "financeiro", "+15d inadimplência", ["email","internal"], "essencial"),
  c(45, "reativacao-pos-pagamento", "Reativação pós-pagamento", "financeiro", "payment pós-suspensão", ["email","impulsionito"], "essencial"),
  c(46, "repasse-pendente", "Repasse pendente", "financeiro", "payout.pending", ["internal","email"], "wl"),
  c(47, "repasse-realizado", "Repasse realizado", "financeiro", "payout.completed", ["email"], "wl"),
  c(48, "nota-fiscal-pendente", "NF pendente", "financeiro", "invoice.nf_pending", ["internal","email"], "pro"),
  c(49, "nota-fiscal-emitida", "NF emitida", "financeiro", "invoice.nf_issued", ["email"], "pro"),
  c(50, "tenant-emitir-nf-cliente-final", "Tenant → NF cliente final", "financeiro", "pedido pago consumidor", ["internal","email"], "pro"),
  c(51, "chamado-aberto", "Chamado aberto", "suporte", "ticket.created", ["email","internal"], "free"),
  c(52, "sla-vencendo", "SLA vencendo", "suporte", "30min do SLA", ["internal"], "essencial"),
  c(53, "sla-vencido", "SLA vencido", "suporte", "SLA passou", ["internal","email"], "essencial"),
  c(54, "chamado-resolvido", "Chamado resolvido", "suporte", "ticket.resolved", ["email"], "free"),
  c(55, "avaliacao-negativa", "Avaliação negativa", "suporte", "csat ≤ 2", ["internal","email"], "essencial"),
  c(56, "escalonamento-humano", "Escalonamento humano", "suporte", "flag manual/IA", ["internal"], "free"),
  c(57, "vitrine-publicado", "Tenant publicado", "vitrine", "vitrine_enabled", ["email","internal"], "essencial"),
  c(58, "vitrine-removido", "Tenant removido", "vitrine", "vitrine_disabled", ["internal"], "essencial"),
  c(59, "clube-favorito-novo", "Clube — favorito novo", "vitrine", "consumer favorited", ["impulsionito","email"], "free"),
  c(60, "clube-voucher-usado", "Clube — voucher usado", "vitrine", "voucher.redeemed", ["email","whatsapp"], "free"),
  c(61, "vitrine-avaliacao", "Vitrine — avaliação", "vitrine", "review.created", ["email"], "essencial"),
  c(62, "clube-empresa-proxima", "Clube — empresa próxima", "vitrine", "geo match CEP", ["impulsionito","email"], "free"),
  c(63, "clube-recomendacao", "Clube — recomendação", "vitrine", "recomendação IA", ["impulsionito","email"], "free"),
];

export const NICHO_VARIANTS: Workflow[] = ([
  ["clinica","consulta-confirmada","Consulta confirmada","appointment.confirmed",["whatsapp","email"]],
  ["clinica","no-show","No-show","appointment.no_show",["whatsapp","internal"]],
  ["clinica","retorno","Retorno de consulta","appointment.followup_due",["whatsapp","email"]],
  ["clinica","teleconsulta","Teleconsulta","appointment.tele_scheduled",["whatsapp","email"]],
  ["bar","pedido-recebido","Pedido recebido","order.received",["whatsapp"]],
  ["bar","pedido-saiu-entrega","Saiu para entrega","order.out_for_delivery",["whatsapp"]],
  ["bar","pedido-delivery","Entregue","order.delivered",["whatsapp"]],
  ["bar","avaliacao-pos-consumo","Avaliação pós-consumo","order.completed +2h",["whatsapp","email"]],
  ["bar","cupom-retorno","Cupom de retorno","7d pós consumo",["whatsapp"]],
  ["imob","lead-imovel","Lead imóvel","lead.property_interest",["whatsapp","email"]],
  ["imob","visita-agendada","Visita agendada","visit.scheduled",["whatsapp","email"]],
  ["imob","visita-confirmada","Visita confirmada","visit.confirmed",["whatsapp"]],
  ["imob","proposta-sem-resposta","Proposta sem resposta","proposal.no_response 48h",["whatsapp","email"]],
  ["eventos","ingresso-vendido","Ingresso vendido","ticket.purchased",["email","whatsapp"]],
  ["eventos","lembrete-antes","Lembrete pré-evento","24h antes",["whatsapp","email"]],
  ["eventos","checkin","Check-in","attendee.checked_in",["internal"]],
  ["eventos","pos-evento","Pós-evento","event.ended +2h",["email","whatsapp"]],
  ["wl","novo-cliente","WL — novo cliente","partner.tenant_created",["email","internal"]],
  ["wl","tenant-suspenso","WL — tenant suspenso","tenant.suspended",["internal","email"]],
  ["wl","tenant-convertido","WL — tenant convertido","tenant.converted_paid",["email","internal"]],
  ["clube","boas-vindas","Clube — boas-vindas","consumer.created",["email","impulsionito"]],
  ["clube","voucher-disponivel","Clube — voucher disponível","voucher.available",["email","impulsionito"]],
  ["clube","beneficio-expirando","Clube — benefício expirando","benefit.expires_in 3d",["email","impulsionito"]],
] as const).map(([niche, slug, nome, gatilho, canais], i) => ({
  id: 900 + i, slug: `${niche}-${slug}`, nome, regua: "nicho" as const,
  gatilho, canais: canais as Canal[], planoMin: "essencial" as const,
  status: "rascunho" as const, modo: "demo" as const, nichos: [niche],
}));

export const ALL_WORKFLOWS: Workflow[] = [...CATALOG, ...NICHO_VARIANTS];

export const TENANTS_MOCK = [
  { slug: "core",     nome: "Core Impulsionando", plano: "premium",  nicho: "multi",           modo: "demo" as Modo, bloqueios: ["uso interno"] },
  { slug: "demo",     nome: "Demo público",       plano: "free",     nicho: "multi",           modo: "demo" as Modo, bloqueios: ["nunca vai a produção"] },
  { slug: "chrismed", nome: "CHRISMED",           plano: "pro",      nicho: "clinica_medica",  modo: "demo" as Modo, bloqueios: ["Z-API pendente","templates não aprovados"] },
  { slug: "riomed",   nome: "RioMed",             plano: "pro",      nicho: "b2b_medico",      modo: "demo" as Modo, bloqueios: ["ver RIOMED_README"] },
  { slug: "marocas",  nome: "Marocas",            plano: "essencial",nicho: "bar_restaurante", modo: "demo" as Modo, bloqueios: ["canal WhatsApp pendente"] },
  { slug: "garrido",  nome: "Garrido Advocacia",  plano: "pro",      nicho: "juridico",        modo: "demo" as Modo, bloqueios: ["LGPD sob revisão"] },
];

export const CHANNELS_MOCK: Array<{ id: Canal; nome: string; provedor: string; status: "ok"|"aguardando_credencial"|"desabilitado" }> = [
  { id: "whatsapp",     nome: "WhatsApp Business", provedor: "Z-API",           status: "aguardando_credencial" },
  { id: "email",        nome: "E-mail transacional", provedor: "Resend",         status: "ok" },
  { id: "impulsionito", nome: "Impulsionito (in-app)", provedor: "Impulsionando", status: "ok" },
  { id: "internal",     nome: "Notificação interna", provedor: "notify_user",    status: "ok" },
];

export const REGUA_LABEL: Record<Regua, string> = {
  captacao: "Captação",
  conversao: "Conversão",
  relacionamento: "Relacionamento",
  retencao: "Retenção",
  financeiro: "Financeiro",
  suporte: "Suporte",
  vitrine: "Vitrine & Clube",
  nicho: "Nicho",
};

export const CANAL_LABEL: Record<Canal, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  impulsionito: "Impulsionito",
  internal: "Interno",
};

export function planLevel(p: Plano): number {
  return { free: 0, essencial: 1, pro: 2, premium: 3, wl: 4 }[p];
}
