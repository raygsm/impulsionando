export const NICHOS = ["eventos", "fitness", "saude", "estetica", "generico"] as const;
export type Nicho = (typeof NICHOS)[number];

function isNicho(v: string | null | undefined): v is Nicho {
  return !!v && (NICHOS as readonly string[]).includes(v);
}

/** Lê ?nicho=... da URL sem exigir validateSearch nas rotas existentes. */
export function useNichoParam(): Nicho {
  if (typeof window === "undefined") return "generico";
  const raw = new URLSearchParams(window.location.search).get("nicho");
  return isNicho(raw) ? raw : "generico";
}

/** Rótulos por nicho — para trocar termos genéricos em UI compartilhada. */
export const NICHO_LABELS: Record<Nicho, {
  nome: string;
  cliente: string;
  servico: string;
  venda: string;
  agenda: string;
  pipelineLabel: string;
}> = {
  eventos: {
    nome: "Eventos / WMP",
    cliente: "Contratante",
    servico: "Cachê",
    venda: "Contrato",
    agenda: "Agenda de eventos",
    pipelineLabel: "Briefing → Proposta → Contrato → Sinal → Evento → Pós",
  },
  fitness: {
    nome: "Fitness / Academias",
    cliente: "Aluno",
    servico: "Plano",
    venda: "Matrícula",
    agenda: "Agenda de treinos",
    pipelineLabel: "Lead → Aula experimental → Matrícula",
  },
  saude: {
    nome: "Saúde / Clínicas",
    cliente: "Paciente",
    servico: "Procedimento",
    venda: "Atendimento",
    agenda: "Agenda médica",
    pipelineLabel: "Triagem → Consulta → Retorno",
  },
  estetica: {
    nome: "Estética / Beleza",
    cliente: "Cliente",
    servico: "Procedimento",
    venda: "Agendamento",
    agenda: "Agenda de atendimentos",
    pipelineLabel: "Lead → Avaliação → Procedimento",
  },
  generico: {
    nome: "Genérico",
    cliente: "Cliente",
    servico: "Serviço",
    venda: "Venda",
    agenda: "Agenda",
    pipelineLabel: "Lead → Proposta → Venda",
  },
};

// ============= Datasets ============= //

export interface ContratanteWMP {
  id: string;
  nome: string;
  tipo: "Casa noturna" | "Prefeitura" | "Formatura" | "Casamento" | "Festival" | "Corporativo";
  cidade: string;
  cacheMedio: number;
  status: "Briefing" | "Proposta" | "Contrato" | "Sinal pago" | "Evento confirmado" | "Pós-evento";
  proximoEvento?: string;
}

export interface ArtistaWMP {
  id: string;
  nome: string;
  estilo: string;
  nivel: "Iniciante" | "Intermediário" | "Avançado" | "Premium";
  cache: number;
  cidade: string;
  bonus: number;
  reputacao: number;
  eventosSemMulta: number;
}

export interface EventoWMP {
  id: string;
  contratante: string;
  artista: string;
  data: string;
  cidade: string;
  cache: number;
  taxaWMP: number;
  repasse: number;
  sinal: number;
  saldo: number;
  status: "Aguardando sinal" | "Confirmado" | "Realizado" | "Cancelado < 72h" | "Cancelado > 72h";
}

export interface TemplateMsgWMP {
  id: string;
  titulo: string;
  canal: "WhatsApp" | "E-mail" | "Ambos";
  quando: string;
  corpo: string;
}

const datasetEventos = {
  contratantes: [
    { id: "c1", nome: "Casa Lumière", tipo: "Casa noturna", cidade: "São Paulo/SP", cacheMedio: 8500, status: "Contrato", proximoEvento: "21/06/2026" },
    { id: "c2", nome: "Prefeitura de Águas Claras", tipo: "Prefeitura", cidade: "Águas Claras/GO", cacheMedio: 25000, status: "Proposta" },
    { id: "c3", nome: "Formatura Direito UFMG", tipo: "Formatura", cidade: "Belo Horizonte/MG", cacheMedio: 14000, status: "Sinal pago", proximoEvento: "12/07/2026" },
    { id: "c4", nome: "Hotel Fasano — Casamento Aline & Pedro", tipo: "Casamento", cidade: "Rio de Janeiro/RJ", cacheMedio: 18500, status: "Evento confirmado", proximoEvento: "28/06/2026" },
    { id: "c5", nome: "Festival Som da Serra", tipo: "Festival", cidade: "Campos do Jordão/SP", cacheMedio: 42000, status: "Briefing" },
    { id: "c6", nome: "Convenção Stellantis", tipo: "Corporativo", cidade: "Betim/MG", cacheMedio: 32000, status: "Pós-evento" },
  ] as ContratanteWMP[],
  artistas: [
    { id: "a1", nome: "DJ Marcos Vinicius", estilo: "House / Open Format", nivel: "Premium", cache: 7500, cidade: "São Paulo/SP", bonus: 10, reputacao: 4.9, eventosSemMulta: 24 },
    { id: "a2", nome: "Banda Luma & Trio", estilo: "MPB / Pop", nivel: "Avançado", cache: 12000, cidade: "Rio de Janeiro/RJ", bonus: 5, reputacao: 4.7, eventosSemMulta: 11 },
    { id: "a3", nome: "DJ Helena Krause", estilo: "Techno / Progressive", nivel: "Intermediário", cache: 4200, cidade: "Belo Horizonte/MG", bonus: 0, reputacao: 4.5, eventosSemMulta: 4 },
    { id: "a4", nome: "Bruno Sax", estilo: "Sax + DJ", nivel: "Avançado", cache: 6800, cidade: "Curitiba/PR", bonus: 5, reputacao: 4.8, eventosSemMulta: 18 },
    { id: "a5", nome: "DJ Lia Nascimento", estilo: "Funk / Pop", nivel: "Iniciante", cache: 2200, cidade: "Salvador/BA", bonus: 0, reputacao: 4.2, eventosSemMulta: 2 },
  ] as ArtistaWMP[],
  eventos: [
    { id: "e1", contratante: "Casa Lumière", artista: "DJ Marcos Vinicius", data: "21/06/2026 — 23h", cidade: "São Paulo/SP", cache: 8500, taxaWMP: 1700, repasse: 6800, sinal: 4250, saldo: 4250, status: "Confirmado" },
    { id: "e2", contratante: "Formatura UFMG", artista: "Banda Luma & Trio", data: "12/07/2026 — 22h", cidade: "BH/MG", cache: 14000, taxaWMP: 2800, repasse: 11200, sinal: 7000, saldo: 7000, status: "Aguardando sinal" },
    { id: "e3", contratante: "Hotel Fasano", artista: "Bruno Sax", data: "28/06/2026 — 19h", cidade: "RJ/RJ", cache: 6800, taxaWMP: 1360, repasse: 5440, sinal: 3400, saldo: 3400, status: "Confirmado" },
    { id: "e4", contratante: "Festival Som da Serra", artista: "DJ Helena Krause", data: "02/08/2026 — 21h", cidade: "Campos do Jordão/SP", cache: 4200, taxaWMP: 840, repasse: 3360, sinal: 2100, saldo: 2100, status: "Aguardando sinal" },
    { id: "e5", contratante: "Casamento Aline & Pedro", artista: "DJ Lia Nascimento", data: "10/05/2026 — 22h", cidade: "Salvador/BA", cache: 2200, taxaWMP: 440, repasse: 1760, sinal: 1100, saldo: 1100, status: "Cancelado < 72h" },
    { id: "e6", contratante: "Convenção Stellantis", artista: "DJ Marcos Vinicius", data: "15/05/2026", cidade: "Betim/MG", cache: 9000, taxaWMP: 1800, repasse: 7200, sinal: 4500, saldo: 4500, status: "Realizado" },
  ] as EventoWMP[],
  templates: [
    { id: "t1", titulo: "Confirmação de contratação", canal: "Ambos", quando: "Imediatamente após sinal pago", corpo: "Olá {{contratante}}! Seu evento com {{artista}} em {{data}} está confirmado. Sinal de R$ {{sinal}} recebido. Saldo R$ {{saldo}} vence em até 72h antes do evento." },
    { id: "t2", titulo: "Lembrete 72h antes do evento", canal: "Ambos", quando: "72h antes da data do evento", corpo: "Faltam 72h para o evento {{contratante}} × {{artista}}. Saldo pendente: R$ {{saldo}}. Cancelamentos a partir deste momento incidem multa de 10%." },
    { id: "t3", titulo: "Cancelamento < 72h (multa)", canal: "Ambos", quando: "Quando contratante cancela em < 72h", corpo: "O cancelamento do evento {{id}} ocorreu dentro da janela de 72h. Multa de 10% (R$ {{multa}}) será aplicada e deduzida do próximo repasse ou cobrada em até 30 dias." },
    { id: "t4", titulo: "Aviso de oportunidade ao parceiro", canal: "WhatsApp", quando: "Novo evento publicado compatível com o artista", corpo: "Olá {{artista}}! Nova oportunidade: {{contratante}} em {{cidade}}, {{data}}. Cachê de R$ {{cache}}. Aceite na sua área do parceiro em até 24h." },
    { id: "t5", titulo: "Liberação de repasse", canal: "E-mail", quando: "48h após realização do evento", corpo: "Olá {{artista}}, o evento {{contratante}} foi marcado como realizado. Repasse de R$ {{repasse}} liberado para saque em sua conta WMP." },
  ] as TemplateMsgWMP[],
  pipeline: [
    { etapa: "Briefing", contagem: 7, valor: 142000 },
    { etapa: "Proposta enviada", contagem: 5, valor: 218000 },
    { etapa: "Contrato assinado", contagem: 4, valor: 96500 },
    { etapa: "Sinal pago", contagem: 3, valor: 84000 },
    { etapa: "Evento confirmado", contagem: 6, valor: 187200 },
    { etapa: "Pós-evento", contagem: 11, valor: 312800 },
  ],
  regras: {
    horasSemMulta: 72,
    percentualMulta: 10,
    percentualSinal: 50,
    taxaWMP: 20,
    bonusPorMarco: [
      { marco: "10 eventos sem multa", bonusPercent: 5 },
      { marco: "25 eventos sem multa", bonusPercent: 10 },
      { marco: "Nível Premium (50+ sem multa)", bonusPercent: 15 },
    ],
  },
  kpis: {
    receitaMes: 184500,
    taxaWMPmes: 36900,
    eventosConfirmados: 14,
    eventosRealizados: 22,
    taxaCancelamento72h: 3.2,
    artistasAtivos: 38,
  },
};

export type DemoEventosDataset = typeof datasetEventos;

export function getDemoEventos(): DemoEventosDataset {
  return datasetEventos;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
