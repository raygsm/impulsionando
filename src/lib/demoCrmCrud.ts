/**
 * Fase A — Bloco 2/4 do CRM DEMO
 *
 * Tipos canônicos, enumerados, validadores e log padrão para as áreas
 * Clientes, Leads, Empresas, Produtos, Planos e Serviços.
 *
 * Este módulo NÃO toca em rotas, autenticação, banco real ou checkout.
 * Tudo aqui é puro/reusável e fica isolado do mock atual em
 * `src/lib/demoModuleMocks.ts` (que continua sendo a fonte de seeds).
 */

import { uid } from "@/lib/demoSandbox";

// ────────────────────────────────────────────────────────────────────────────
// Enumerados
// ────────────────────────────────────────────────────────────────────────────

export const CLIENTE_STATUS = [
  "Ativo",
  "Novo",
  "Em atendimento",
  "Aguardando retorno",
  "Proposta enviada",
  "Contratado",
  "Inativo",
  "Reativação",
  "Perdido",
] as const;
export type ClienteStatus = (typeof CLIENTE_STATUS)[number];

export const LEAD_STATUS = [
  "Novo",
  "Em atendimento",
  "Qualificado",
  "Proposta enviada",
  "Aguardando retorno",
  "Aguardando pagamento",
  "Convertido",
  "Perdido",
  "Reativação",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_INTERESSE_NIVEL = ["Baixo", "Médio", "Alto", "Urgente"] as const;
export type LeadInteresseNivel = (typeof LEAD_INTERESSE_NIVEL)[number];

export const ORIGENS = [
  "Google Ads",
  "Instagram",
  "WhatsApp",
  "Site",
  "Indicação",
  "Tráfego orgânico",
  "Afiliado",
  "Evento",
  "Outro",
] as const;
export type Origem = (typeof ORIGENS)[number];

export const EMPRESA_SEGMENTOS = [
  "Clínica",
  "Restaurante",
  "Bar",
  "Academia",
  "Escritório jurídico",
  "Estética",
  "Eventos",
  "Delivery",
  "E-commerce",
  "Serviços",
  "White Label",
  "Outro",
] as const;
export type EmpresaSegmento = (typeof EMPRESA_SEGMENTOS)[number];

export const EMPRESA_PORTES = [
  "MEI",
  "Pequena empresa",
  "Média empresa",
  "Grande empresa",
  "Grupo empresarial",
] as const;
export type EmpresaPorte = (typeof EMPRESA_PORTES)[number];

export const EMPRESA_STATUS = [
  "Prospect",
  "Em negociação",
  "Cliente ativo",
  "Cliente inativo",
  "Reativação",
  "Perdido",
] as const;
export type EmpresaStatus = (typeof EMPRESA_STATUS)[number];

export const PRODUTO_STATUS = ["Ativo", "Inativo", "Em teste", "Arquivado"] as const;
export type ProdutoStatus = (typeof PRODUTO_STATUS)[number];

export const PRODUTO_CATEGORIAS = [
  "Sistema",
  "Módulo",
  "Serviço",
  "Produto físico",
  "Produto digital",
  "Assinatura",
  "Consultoria",
  "Outro",
] as const;
export type ProdutoCategoria = (typeof PRODUTO_CATEGORIAS)[number];

export const PLANO_RECORRENCIA = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;
export type PlanoRecorrencia = (typeof PLANO_RECORRENCIA)[number];

export const PLANO_STATUS = ["Ativo", "Inativo", "Arquivado"] as const;
export type PlanoStatus = (typeof PLANO_STATUS)[number];

export const SERVICO_STATUS = ["Ativo", "Inativo"] as const;
export type ServicoStatus = (typeof SERVICO_STATUS)[number];

export type TipoCliente = "PF" | "PJ";

// ────────────────────────────────────────────────────────────────────────────
// Tipos canônicos
// ────────────────────────────────────────────────────────────────────────────

export interface ClienteFull {
  id: string;
  nome: string;
  tipo: TipoCliente;
  documento?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  origem?: Origem | string;
  campanha?: string;
  interesse?: string;
  produtoInteresse?: string;
  planoInteresse?: string;
  servicoInteresse?: string;
  responsavel: string;
  status: ClienteStatus;
  tags: string[];
  observacoes?: string;
  emailTeste?: string;
  whatsappTeste?: string;
  criadoEm: string;
}

export interface LeadFull {
  id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
  origem: Origem | string;
  campanha?: string;
  canal?: string;
  interesse?: string;
  nivelInteresse: LeadInteresseNivel;
  produtoInteresse?: string;
  proximaAcao?: string;
  responsavel: string;
  status: LeadStatus;
  proximoContato?: string;
  observacoes?: string;
  tags: string[];
  motivoPerda?: string;
  criadoEm: string;
}

export interface EmpresaFull {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  segmento: EmpresaSegmento | string;
  porte: EmpresaPorte;
  responsavel: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  modulosInteresse: string[];
  status: EmpresaStatus;
  observacoes?: string;
  criadoEm: string;
}

export interface ProdutoFull {
  id: string;
  nome: string;
  categoria: ProdutoCategoria;
  descricao?: string;
  valor: number;
  status: ProdutoStatus;
  prazoConsumoDias?: number;
  recompraAuto: boolean;
  diasAviso1?: number;
  diasAviso2?: number;
  mensagemRecompra?: string;
  tags: string[];
  campanhas: string[];
  criadoEm: string;
}

export interface PlanoFull {
  id: string;
  nome: string;
  descricao?: string;
  valorMensal: number;
  valorSetup: number;
  recorrencia: PlanoRecorrencia;
  contratoMinDias: number;
  mensalidadesMinimas: number;
  modulosIncluidos: string[];
  permiteAdicionais: boolean;
  valorPorAdicional?: number;
  status: PlanoStatus;
  observacoes?: string;
  criadoEm: string;
}

export interface ServicoFull {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  prazoEntregaDias: number;
  duracao?: string;
  produtoRelacionado?: string;
  planoRelacionado?: string;
  responsavel: string;
  ativo: boolean;
  observacoes?: string;
  criadoEm: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Validações
// ────────────────────────────────────────────────────────────────────────────

export const MSG_OBRIGATORIO =
  "Preencha os campos obrigatórios para continuar.";
export const MSG_SUCESSO =
  "Registro salvo com sucesso na demonstração.";
export const MSG_DEMO_TAG =
  "Este registro foi criado apenas na versão demonstrativa.";
export const COMUNICACAO_PREFIXO =
  "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE";

export type ValidationResult = { ok: boolean; errors: Record<string, string> };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WHATS_RX = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

function ok(errors: Record<string, string>): ValidationResult {
  return { ok: Object.keys(errors).length === 0, errors };
}

function requireNome(value: string | undefined, errors: Record<string, string>) {
  if (!value || !value.trim()) errors.nome = "Nome obrigatório";
}
function checkEmail(value: string | undefined, errors: Record<string, string>, key = "email") {
  if (value && value.trim() && !EMAIL_RX.test(value.trim())) {
    errors[key] = "E-mail inválido";
  }
}
function checkWhats(value: string | undefined, errors: Record<string, string>, key = "whatsapp") {
  if (value && value.trim() && !WHATS_RX.test(value.replace(/\s+/g, ""))) {
    errors[key] = "WhatsApp inválido (incluir DDD)";
  }
}
function checkPositive(value: number | undefined, errors: Record<string, string>, key: string) {
  if (value !== undefined && (Number.isNaN(value) || value < 0)) {
    errors[key] = "Valor deve ser positivo";
  }
}
function checkInt(value: number | undefined, errors: Record<string, string>, key: string) {
  if (value !== undefined && !Number.isInteger(value)) {
    errors[key] = "Deve ser número inteiro";
  }
}

export function validateCliente(
  c: Partial<ClienteFull>,
  opts: { exigirResponsavel?: boolean } = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  requireNome(c.nome, errors);
  checkEmail(c.email, errors);
  checkEmail(c.emailTeste, errors, "emailTeste");
  checkWhats(c.whatsapp, errors);
  checkWhats(c.whatsappTeste, errors, "whatsappTeste");
  if (!c.status) errors.status = "Status obrigatório";
  if (opts.exigirResponsavel && !c.responsavel?.trim()) {
    errors.responsavel = "Responsável obrigatório";
  }
  return ok(errors);
}

export function validateLead(
  l: Partial<LeadFull>,
  opts: { exigirResponsavel?: boolean; exigirOrigem?: boolean } = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  requireNome(l.nome, errors);
  checkEmail(l.email, errors);
  checkWhats(l.whatsapp, errors);
  if (!l.status) errors.status = "Status obrigatório";
  if (!l.nivelInteresse) errors.nivelInteresse = "Nível de interesse obrigatório";
  if (opts.exigirOrigem && !l.origem) errors.origem = "Origem obrigatória";
  if (opts.exigirResponsavel && !l.responsavel?.trim()) {
    errors.responsavel = "Responsável obrigatório";
  }
  return ok(errors);
}

export function validateEmpresa(
  e: Partial<EmpresaFull>,
  opts: { exigirResponsavel?: boolean } = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!e.razaoSocial?.trim()) errors.razaoSocial = "Razão social obrigatória";
  checkEmail(e.email, errors);
  checkWhats(e.whatsapp, errors);
  if (!e.status) errors.status = "Status obrigatório";
  if (!e.porte) errors.porte = "Porte obrigatório";
  if (opts.exigirResponsavel && !e.responsavel?.trim()) {
    errors.responsavel = "Responsável obrigatório";
  }
  return ok(errors);
}

export function validateProduto(p: Partial<ProdutoFull>): ValidationResult {
  const errors: Record<string, string> = {};
  requireNome(p.nome, errors);
  if (!p.categoria) errors.categoria = "Categoria obrigatória";
  if (!p.status) errors.status = "Status obrigatório";
  checkPositive(p.valor, errors, "valor");
  checkInt(p.prazoConsumoDias, errors, "prazoConsumoDias");
  checkPositive(p.prazoConsumoDias, errors, "prazoConsumoDias");
  if (p.recompraAuto) {
    checkInt(p.diasAviso1, errors, "diasAviso1");
    checkInt(p.diasAviso2, errors, "diasAviso2");
  }
  return ok(errors);
}

export function validatePlano(p: Partial<PlanoFull>): ValidationResult {
  const errors: Record<string, string> = {};
  requireNome(p.nome, errors);
  if (!p.recorrencia) errors.recorrencia = "Recorrência obrigatória";
  if (!p.status) errors.status = "Status obrigatório";
  checkPositive(p.valorMensal, errors, "valorMensal");
  checkPositive(p.valorSetup, errors, "valorSetup");
  checkInt(p.contratoMinDias, errors, "contratoMinDias");
  checkPositive(p.contratoMinDias, errors, "contratoMinDias");
  checkInt(p.mensalidadesMinimas, errors, "mensalidadesMinimas");
  checkPositive(p.mensalidadesMinimas, errors, "mensalidadesMinimas");
  if (p.permiteAdicionais) checkPositive(p.valorPorAdicional, errors, "valorPorAdicional");
  return ok(errors);
}

export function validateServico(
  s: Partial<ServicoFull>,
  opts: { exigirResponsavel?: boolean } = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  requireNome(s.nome, errors);
  checkPositive(s.valor, errors, "valor");
  checkInt(s.prazoEntregaDias, errors, "prazoEntregaDias");
  checkPositive(s.prazoEntregaDias, errors, "prazoEntregaDias");
  if (opts.exigirResponsavel && !s.responsavel?.trim()) {
    errors.responsavel = "Responsável obrigatório";
  }
  return ok(errors);
}

// ────────────────────────────────────────────────────────────────────────────
// Log padrão DEMO
// ────────────────────────────────────────────────────────────────────────────

export type DemoLogStatus = "ok" | "erro" | "simulado";
export type DemoLogCanal = "email" | "whatsapp" | "sms" | "interno";

export interface DemoLogEntry {
  id: string;
  modulo: "CRM";
  area: string;
  acao: string;
  registro?: string;
  status: DemoLogStatus;
  quando: string;
  ambiente: "DEMO";
  usuario: string;
  canal?: DemoLogCanal;
  destinatario?: string;
}

export interface DemoLogInput {
  area: string;
  acao: string;
  registro?: string;
  status?: DemoLogStatus;
  usuario?: string;
  canal?: DemoLogCanal;
  destinatario?: string;
}

export function makeDemoLog(input: DemoLogInput): DemoLogEntry {
  return {
    id: uid("lg"),
    modulo: "CRM",
    area: input.area,
    acao: input.acao,
    registro: input.registro,
    status: input.status ?? "ok",
    quando: new Date().toISOString(),
    ambiente: "DEMO",
    usuario: input.usuario ?? "sessao-demo",
    canal: input.canal,
    destinatario: input.destinatario,
  };
}

/**
 * Pequeno helper que injeta um log no array existente de logs do CRM
 * mantendo limite razoável de itens para a DEMO (mantém últimos N).
 */
export function appendDemoLog<T extends DemoLogEntry>(
  list: T[] | undefined,
  entry: T,
  max = 200,
): T[] {
  const next = [entry, ...(list ?? [])];
  return next.slice(0, max);
}

/**
 * Garante que toda comunicação simulada tenha o prefixo de teste.
 */
export function prefixarComunicacaoDemo(corpo: string): string {
  const trimmed = corpo?.trim() ?? "";
  if (trimmed.startsWith(COMUNICACAO_PREFIXO)) return corpo;
  return `${COMUNICACAO_PREFIXO}\n\n${corpo ?? ""}`.trim();
}
