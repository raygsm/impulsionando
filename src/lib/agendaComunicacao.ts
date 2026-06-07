// BLOCO 4/5 — Lembretes, modelos de mensagem, comunicação WhatsApp/e-mail,
// gatilhos, automações, usuários e permissões da Agenda Online (DEMO).
// Tudo aqui é simulado e persistido em localStorage do navegador.

export type Canal = "whatsapp" | "email" | "sms";

export type Lembrete = {
  id: string;
  nome: string;
  antecedencia: string; // ex: "24h", "1h", "30m"
  canal: Canal;
  template: string; // referência ao id do modelo
  ativo: boolean;
};

export type ModeloMensagem = {
  id: string;
  nome: string;
  canal: Canal;
  assunto?: string;
  corpo: string; // suporta variáveis {{cliente}} {{servico}} {{data}} {{hora}} {{profissional}}
  marcaTeste: boolean; // sempre adiciona "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE"
};

export type GatilhoEvento =
  | "agendamento_criado"
  | "agendamento_confirmado"
  | "agendamento_cancelado"
  | "no_show"
  | "reagendamento"
  | "pagamento_recebido"
  | "pos_atendimento"
  | "retorno_programado"
  | "fila_avancou";

export type Gatilho = {
  id: string;
  evento: GatilhoEvento;
  modeloId: string;
  canal: Canal;
  ativo: boolean;
  delay?: string; // ex: "imediato", "+1h", "+24h"
};

export type Automacao = {
  id: string;
  nome: string;
  descricao: string;
  passos: string[]; // descrição simulada
  ativo: boolean;
};

export type PerfilUsuario = "gestor" | "recepcao" | "profissional" | "financeiro" | "marketing";

export type UsuarioDemo = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
};

export type Permissao = {
  perfil: PerfilUsuario;
  area: string;
  acoes: { ver: boolean; criar: boolean; editar: boolean; excluir: boolean };
};

export type ComunicacaoState = {
  lembretes: Lembrete[];
  modelos: ModeloMensagem[];
  gatilhos: Gatilho[];
  automacoes: Automacao[];
  usuarios: UsuarioDemo[];
  permissoes: Permissao[];
  envios: EnvioLog[];
};

export type EnvioLog = {
  id: string;
  data: string; // ISO
  canal: Canal;
  para: string;
  modelo: string;
  evento: string;
  status: "enviado" | "lido" | "respondido" | "falhou";
};

const KEY = "agenda.demo.comunicacao.v1";

export const EVENTOS_LABEL: Record<GatilhoEvento, string> = {
  agendamento_criado: "Agendamento criado",
  agendamento_confirmado: "Agendamento confirmado",
  agendamento_cancelado: "Agendamento cancelado",
  no_show: "No-show registrado",
  reagendamento: "Reagendamento realizado",
  pagamento_recebido: "Pagamento recebido",
  pos_atendimento: "Pós-atendimento (pesquisa)",
  retorno_programado: "Retorno programado",
  fila_avancou: "Cliente avançou na fila",
};

export const PERFIS_LABEL: Record<PerfilUsuario, string> = {
  gestor: "Gestor",
  recepcao: "Recepção",
  profissional: "Profissional",
  financeiro: "Financeiro",
  marketing: "Marketing",
};

const AREAS_PERMISSAO = [
  "Agenda — visualizar",
  "Agenda — criar/editar",
  "Clientes",
  "Profissionais",
  "Serviços",
  "Financeiro",
  "Comunicação",
  "Relatórios",
];

function uid(p: string) {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}

const TESTE_TAG = "\n\n— TESTE — DEMONSTRAÇÃO — VERSÃO TESTE";

function defaultState(): ComunicacaoState {
  const m1 = uid("md");
  const m2 = uid("md");
  const m3 = uid("md");
  const m4 = uid("md");
  const m5 = uid("md");
  const m6 = uid("md");
  return {
    modelos: [
      { id: m1, nome: "Confirmação WhatsApp", canal: "whatsapp", corpo: "Olá {{cliente}}, confirmamos seu horário de {{servico}} com {{profissional}} em {{data}} às {{hora}}.", marcaTeste: true },
      { id: m2, nome: "Lembrete 24h WhatsApp", canal: "whatsapp", corpo: "Oi {{cliente}}! Lembrando seu atendimento amanhã ({{data}}) às {{hora}} com {{profissional}}.", marcaTeste: true },
      { id: m3, nome: "Lembrete 1h WhatsApp", canal: "whatsapp", corpo: "{{cliente}}, seu atendimento começa em 1h ({{hora}}). Te aguardamos!", marcaTeste: true },
      { id: m4, nome: "Confirmação E-mail", canal: "email", assunto: "Agendamento confirmado", corpo: "Olá {{cliente}}, seu agendamento de {{servico}} foi confirmado para {{data}} às {{hora}}.", marcaTeste: true },
      { id: m5, nome: "Cancelamento E-mail", canal: "email", assunto: "Seu agendamento foi cancelado", corpo: "{{cliente}}, seu atendimento de {{data}} {{hora}} foi cancelado. Se preferir, reagende pelo nosso link.", marcaTeste: true },
      { id: m6, nome: "Pós-atendimento NPS", canal: "whatsapp", corpo: "{{cliente}}, como foi seu atendimento com {{profissional}}? Avalie de 0 a 10.", marcaTeste: true },
    ],
    lembretes: [
      { id: uid("lb"), nome: "Lembrete 24h antes", antecedencia: "24h", canal: "whatsapp", template: m2, ativo: true },
      { id: uid("lb"), nome: "Lembrete 1h antes", antecedencia: "1h", canal: "whatsapp", template: m3, ativo: true },
      { id: uid("lb"), nome: "Confirmação por e-mail", antecedencia: "imediato", canal: "email", template: m4, ativo: false },
    ],
    gatilhos: [
      { id: uid("gt"), evento: "agendamento_criado", modeloId: m1, canal: "whatsapp", ativo: true, delay: "imediato" },
      { id: uid("gt"), evento: "agendamento_cancelado", modeloId: m5, canal: "email", ativo: true, delay: "imediato" },
      { id: uid("gt"), evento: "pos_atendimento", modeloId: m6, canal: "whatsapp", ativo: true, delay: "+1h" },
    ],
    automacoes: [
      {
        id: uid("au"),
        nome: "Recuperação de no-show",
        descricao: "Se cliente faltou, envia oferta de reagendamento em 2h e abre tarefa para recepção.",
        passos: [
          "Detecta status no_show",
          "Envia WhatsApp com link de reagendamento",
          "Cria tarefa interna para recepção",
          "Registra log na ficha do cliente",
        ],
        ativo: true,
      },
      {
        id: uid("au"),
        nome: "Confirmação inteligente",
        descricao: "Envia confirmação 24h antes e, se não responder em 4h, envia segundo lembrete.",
        passos: [
          "T-24h: envia WhatsApp de confirmação",
          "T-20h: se sem resposta, segundo lembrete",
          "T-2h: notifica recepção se ainda sem resposta",
        ],
        ativo: true,
      },
      {
        id: uid("au"),
        nome: "Pós-atendimento NPS",
        descricao: "Pesquisa de satisfação 1h após status concluído + segmentação no CRM.",
        passos: [
          "Status muda para concluido",
          "Aguarda 1h",
          "Envia pesquisa NPS por WhatsApp",
          "Notas ≤ 6 abrem ticket de recuperação",
        ],
        ativo: false,
      },
    ],
    usuarios: [
      { id: uid("us"), nome: "Maria Gestora", email: "maria@demo.test", perfil: "gestor", ativo: true },
      { id: uid("us"), nome: "Carlos Recepção", email: "carlos@demo.test", perfil: "recepcao", ativo: true },
      { id: uid("us"), nome: "Dra. Ana Silva", email: "ana@demo.test", perfil: "profissional", ativo: true },
      { id: uid("us"), nome: "Paulo Financeiro", email: "paulo@demo.test", perfil: "financeiro", ativo: false },
    ],
    permissoes: AREAS_PERMISSAO.flatMap((area) =>
      (Object.keys(PERFIS_LABEL) as PerfilUsuario[]).map<Permissao>((perfil) => ({
        perfil,
        area,
        acoes: defaultAcoes(perfil, area),
      })),
    ),
    envios: [],
  };
}

function defaultAcoes(perfil: PerfilUsuario, area: string) {
  const full = { ver: true, criar: true, editar: true, excluir: true };
  const readOnly = { ver: true, criar: false, editar: false, excluir: false };
  const none = { ver: false, criar: false, editar: false, excluir: false };
  if (perfil === "gestor") return full;
  if (perfil === "recepcao") {
    if (area === "Financeiro") return readOnly;
    if (area === "Relatórios") return readOnly;
    return { ver: true, criar: true, editar: true, excluir: false };
  }
  if (perfil === "profissional") {
    if (area.startsWith("Agenda")) return { ver: true, criar: true, editar: true, excluir: false };
    if (area === "Clientes") return readOnly;
    if (area === "Comunicação") return readOnly;
    return none;
  }
  if (perfil === "financeiro") {
    if (area === "Financeiro" || area === "Relatórios") return full;
    if (area === "Agenda — visualizar") return readOnly;
    return none;
  }
  if (perfil === "marketing") {
    if (area === "Comunicação") return full;
    if (area === "Relatórios") return readOnly;
    return none;
  }
  return none;
}

export function loadComunicacao(): ComunicacaoState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const init = defaultState();
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as ComunicacaoState;
  } catch {
    return defaultState();
  }
}

export function saveComunicacao(s: ComunicacaoState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetComunicacao(): ComunicacaoState {
  const init = defaultState();
  saveComunicacao(init);
  return init;
}

export function renderTemplate(modelo: ModeloMensagem, vars: Record<string, string>) {
  let out = modelo.corpo;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, v);
  if (modelo.marcaTeste) out += TESTE_TAG;
  return out;
}

export { AREAS_PERMISSAO, uid as _uid };
