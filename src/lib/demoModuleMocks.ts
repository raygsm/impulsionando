import { uid } from "@/lib/demoSandbox";

/**
 * Fallback seguro para criação de mocks por módulo.
 * Se a factory falhar ou retornar vazio, emite warning no console
 * e devolve o fallback informado, evitando que a DEMO quebre silenciosamente.
 */
export function safeMock<T>(factory: () => T, fallback: T, label: string): T {
  try {
    const out = factory();
    if (out == null) {
      console.warn(`[demo:${label}] mock factory retornou vazio — usando fallback.`);
      return fallback;
    }
    return out;
  } catch (e) {
    console.warn(`[demo:${label}] falha ao carregar mock — usando fallback.`, e);
    return fallback;
  }
}

export type AdvogadosProcessoStatus = "ativo" | "arquivado" | "ganho" | "perdido" | "acordo";
export type AdvogadosAudienciaTipo = "conciliacao" | "instrucao" | "julgamento" | "virtual";
export type AdvogadosTarefaPrioridade = "baixa" | "media" | "alta" | "urgente";

export function createAdvogadosMock() {
  const now = new Date();
  const iso = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  const dateOnly = (days: number) => iso(days).slice(0, 10);

  const advogados = [
    { id: uid("ad"), nome: "Dra. Helena Prado", oab: "OAB/SP 123.456", area: "Cível e Empresarial", taxaHora: 480 },
    { id: uid("ad"), nome: "Dr. Renato Vasconcelos", oab: "OAB/SP 234.567", area: "Trabalhista", taxaHora: 420 },
    { id: uid("ad"), nome: "Dra. Beatriz Antunes", oab: "OAB/RJ 345.678", area: "Tributário", taxaHora: 560 },
  ];

  const clientes = [
    { id: uid("cl"), tipo: "PJ" as const, nome: "Construtora Aurora Ltda.", documento: "12.345.678/0001-90", email: "juridico@aurora.demo", telefone: "(11) 90000-1001", segmento: "Construção civil" },
    { id: uid("cl"), tipo: "PF" as const, nome: "Mariana Lopes", documento: "111.222.333-44", email: "mariana@demo.com", telefone: "(11) 90000-1002", segmento: "Trabalhista" },
    { id: uid("cl"), tipo: "PJ" as const, nome: "Sabor & Cia Restaurantes", documento: "98.765.432/0001-10", email: "contato@saborcia.demo", telefone: "(21) 90000-1003", segmento: "Alimentação" },
  ];

  const processos = [
    {
      id: uid("pr"),
      numero: "0001234-56.2024.8.26.0100",
      clienteId: clientes[0].id,
      advogadoId: advogados[0].id,
      area: "Cível",
      vara: "3ª Vara Cível — Foro Central SP",
      objeto: "Ação de cobrança contratual",
      valorCausa: 285000,
      status: "ativo" as AdvogadosProcessoStatus,
      faseAtual: "Instrução probatória",
      proximoPrazo: dateOnly(3),
      sigiloso: false,
      criadoEm: iso(-90),
    },
    {
      id: uid("pr"),
      numero: "0009876-12.2025.5.02.0011",
      clienteId: clientes[1].id,
      advogadoId: advogados[1].id,
      area: "Trabalhista",
      vara: "11ª Vara do Trabalho de São Paulo",
      objeto: "Reclamatória — horas extras e adicional noturno",
      valorCausa: 64500,
      status: "ativo" as AdvogadosProcessoStatus,
      faseAtual: "Audiência una marcada",
      proximoPrazo: dateOnly(7),
      sigiloso: false,
      criadoEm: iso(-45),
    },
    {
      id: uid("pr"),
      numero: "5009999-33.2025.4.03.6100",
      clienteId: clientes[2].id,
      advogadoId: advogados[2].id,
      area: "Tributário",
      vara: "6ª Vara Federal Cível SP",
      objeto: "Mandado de segurança — exclusão ICMS do PIS/COFINS",
      valorCausa: 1240000,
      status: "ativo" as AdvogadosProcessoStatus,
      faseAtual: "Sentença pendente",
      proximoPrazo: dateOnly(14),
      sigiloso: true,
      criadoEm: iso(-180),
    },
  ];

  const audiencias = [
    { id: uid("au"), processoId: processos[1].id, tipo: "instrucao" as AdvogadosAudienciaTipo, data: iso(7).slice(0, 16).replace("T", " "), local: "11ª VT — Sala 4", responsavelId: advogados[1].id, confirmado: true },
    { id: uid("au"), processoId: processos[0].id, tipo: "conciliacao" as AdvogadosAudienciaTipo, data: iso(12).slice(0, 16).replace("T", " "), local: "CEJUSC Central — virtual", responsavelId: advogados[0].id, confirmado: false },
  ];

  const prazos = [
    { id: uid("pz"), processoId: processos[0].id, descricao: "Réplica à contestação", vencimento: dateOnly(3), prioridade: "alta" as AdvogadosTarefaPrioridade, concluido: false, responsavelId: advogados[0].id },
    { id: uid("pz"), processoId: processos[1].id, descricao: "Juntada de rol de testemunhas", vencimento: dateOnly(5), prioridade: "urgente" as AdvogadosTarefaPrioridade, concluido: false, responsavelId: advogados[1].id },
    { id: uid("pz"), processoId: processos[2].id, descricao: "Memorial pós-audiência", vencimento: dateOnly(14), prioridade: "media" as AdvogadosTarefaPrioridade, concluido: false, responsavelId: advogados[2].id },
    { id: uid("pz"), processoId: processos[0].id, descricao: "Protocolo de cálculo de liquidação", vencimento: dateOnly(-2), prioridade: "alta" as AdvogadosTarefaPrioridade, concluido: true, responsavelId: advogados[0].id },
  ];

  const contratos = [
    { id: uid("co"), clienteId: clientes[0].id, tipo: "Honorários êxito + fixo" as const, valorFixo: 8500, percentualExito: 15, status: "Ativo" as const, assinadoEm: iso(-85) },
    { id: uid("co"), clienteId: clientes[1].id, tipo: "Êxito puro" as const, valorFixo: 0, percentualExito: 30, status: "Ativo" as const, assinadoEm: iso(-44) },
    { id: uid("co"), clienteId: clientes[2].id, tipo: "Mensal + êxito" as const, valorFixo: 6500, percentualExito: 10, status: "Ativo" as const, assinadoEm: iso(-170) },
  ];

  const honorarios = [
    { id: uid("hn"), processoId: processos[0].id, descricao: "Honorários contratuais — parcela 03/12", valor: 8500, vencimento: dateOnly(2), status: "pendente" as const },
    { id: uid("hn"), processoId: processos[2].id, descricao: "Honorários êxito — sentença favorável", valor: 124000, vencimento: dateOnly(30), status: "previsto" as const },
    { id: uid("hn"), processoId: processos[1].id, descricao: "Adiantamento — custas e despesas", valor: 1800, vencimento: dateOnly(-10), status: "pago" as const },
  ];

  const documentos = [
    { id: uid("dc"), processoId: processos[0].id, nome: "Contrato social — Construtora Aurora.pdf", tipo: "Contrato", tamanhoKb: 320 },
    { id: uid("dc"), processoId: processos[1].id, nome: "Holerites 2023-2024.zip", tipo: "Prova", tamanhoKb: 1840 },
    { id: uid("dc"), processoId: processos[2].id, nome: "Petição inicial — MS ICMS.docx", tipo: "Petição", tamanhoKb: 96 },
  ];

  const params = {
    lembretePrazo48h: true,
    lembretePrazo24h: true,
    bloqueioPrazoVencido: true,
    sigiloPorPapel: true,
    timesheetObrigatorio: true,
    integraTribunais: true,
    lgpd: true,
    portalCliente: true,
    // Integrações jurídicas externas
    integracoesAtivas: true,
    integracaoJusbrasil: true,
    integracaoPublicacoes: true,
    integracaoTribunais: true,
    importacaoManual: true,
    alertaAdvogado: true,
    avisarClienteAuto: false,
    exigirRevisaoAdvogado: true,
    avisoWhatsapp: true,
    avisoEmail: true,
    resumoIA: true,
    aprovacaoHumanaIA: true,
    logComunicacao: true,
    exibirMovNaAreaCliente: true,
    ocultarMovSensiveis: true,
  };

  const integracoes = [
    {
      id: uid("ig"),
      nome: "Jusbrasil — Acompanhamento",
      tipo: "API" as const,
      status: "aguardando_credenciais" as const,
      escritorioVinculado: "Escritório Principal",
      responsavel: advogados[0].nome,
      ultimaSync: null as string | null,
      proximaSync: null as string | null,
      processosMonitorados: 0,
      errosSync: 0,
      observacao: "Integração preparada — aguardando credenciais externas ou autorização da plataforma jurídica contratada pelo escritório.",
    },
    {
      id: uid("ig"),
      nome: "Publicações Jurídicas — DEMO",
      tipo: "Webhook" as const,
      status: "ativa" as const,
      escritorioVinculado: "Escritório Principal",
      responsavel: advogados[1].nome,
      ultimaSync: iso(-1),
      proximaSync: iso(1),
      processosMonitorados: 3,
      errosSync: 0,
      observacao: "Fonte DEMO — nenhuma consulta real é feita. Apenas para demonstração.",
    },
    {
      id: uid("ig"),
      nome: "Tribunal de Justiça — Consulta processual",
      tipo: "Consulta externa preparada" as const,
      status: "aguardando_autorizacao" as const,
      escritorioVinculado: "Escritório Principal",
      responsavel: advogados[2].nome,
      ultimaSync: null,
      proximaSync: null,
      processosMonitorados: 0,
      errosSync: 0,
      observacao: "Integração preparada — aguardando autorização externa.",
    },
    {
      id: uid("ig"),
      nome: "Importação CSV — Movimentações",
      tipo: "Importação CSV" as const,
      status: "ativa" as const,
      escritorioVinculado: "Escritório Principal",
      responsavel: advogados[0].nome,
      ultimaSync: iso(-3),
      proximaSync: null,
      processosMonitorados: 1,
      errosSync: 0,
      observacao: "Permite carregar movimentações exportadas manualmente.",
    },
  ];

  const movimentacoes = [
    {
      id: uid("mv"),
      processoId: processos[0].id,
      clienteId: processos[0].clienteId,
      advogadoId: processos[0].advogadoId,
      dataMovimentacao: iso(-1),
      dataCaptura: iso(-1),
      fonte: "Publicações Jurídicas — DEMO",
      tipo: "intimacao" as const,
      textoOriginal: "Fica a parte autora intimada para, no prazo de 15 (quinze) dias, manifestar-se sobre a contestação apresentada, sob pena de preclusão.",
      resumoInterno: "Intimação para réplica em 15 dias. Prazo crítico — verificar contestação.",
      resumoCliente: "Recebemos uma intimação no seu processo. Estamos preparando a resposta dentro do prazo.",
      statusRevisao: "aguardando_revisao" as const,
      notificarCliente: true,
      clienteNotificado: false,
      canalNotificacao: null as null | "whatsapp" | "email",
      dataEnvio: null as string | null,
      possivelPrazo: true,
    },
    {
      id: uid("mv"),
      processoId: processos[1].id,
      clienteId: processos[1].clienteId,
      advogadoId: processos[1].advogadoId,
      dataMovimentacao: iso(-2),
      dataCaptura: iso(-2),
      fonte: "Jusbrasil — DEMO",
      tipo: "audiencia_designada" as const,
      textoOriginal: "Designada audiência de instrução para o dia 15/08/2026 às 14h00, sala 4 da 11ª Vara do Trabalho.",
      resumoInterno: "Audiência de instrução em 15/08 — confirmar testemunhas e documentos.",
      resumoCliente: "Sua audiência foi marcada para 15/08/2026. Entraremos em contato para alinhar os detalhes.",
      statusRevisao: "aprovada_envio" as const,
      notificarCliente: true,
      clienteNotificado: true,
      canalNotificacao: "whatsapp" as const,
      dataEnvio: iso(-2),
      possivelPrazo: false,
    },
    {
      id: uid("mv"),
      processoId: processos[2].id,
      clienteId: processos[2].clienteId,
      advogadoId: processos[2].advogadoId,
      dataMovimentacao: iso(-4),
      dataCaptura: iso(-4),
      fonte: "Publicações Jurídicas — DEMO",
      tipo: "sentenca" as const,
      textoOriginal: "Sentença publicada — pedido julgado procedente em parte.",
      resumoInterno: "Sentença favorável parcial. Analisar cabimento de recurso e honorários de êxito.",
      resumoCliente: "Houve uma decisão importante no seu processo. O advogado responsável entrará em contato para explicar os próximos passos.",
      statusRevisao: "revisada" as const,
      notificarCliente: true,
      clienteNotificado: false,
      canalNotificacao: null,
      dataEnvio: null,
      possivelPrazo: true,
    },
    {
      id: uid("mv"),
      processoId: processos[0].id,
      clienteId: processos[0].clienteId,
      advogadoId: processos[0].advogadoId,
      dataMovimentacao: iso(-6),
      dataCaptura: iso(-6),
      fonte: "Publicações Jurídicas — DEMO",
      tipo: "peticao_juntada" as const,
      textoOriginal: "Petição de contestação juntada aos autos.",
      resumoInterno: "Contestação juntada. Analisar e preparar réplica.",
      resumoCliente: "",
      statusRevisao: "ocultada_cliente" as const,
      notificarCliente: false,
      clienteNotificado: false,
      canalNotificacao: null,
      dataEnvio: null,
      possivelPrazo: false,
    },
  ];

  const alertas = [
    { id: uid("al"), advogadoId: advogados[0].id, tipo: "nova_movimentacao" as const, mensagem: "Nova intimação no processo " + processos[0].numero, criadoEm: iso(-1), lido: false },
    { id: uid("al"), advogadoId: advogados[2].id, tipo: "sentenca" as const, mensagem: "Sentença publicada no processo " + processos[2].numero, criadoEm: iso(-4), lido: false },
    { id: uid("al"), advogadoId: advogados[1].id, tipo: "audiencia" as const, mensagem: "Audiência designada — confirmar agenda", criadoEm: iso(-2), lido: true },
  ];

  return { advogados, clientes, processos, audiencias, prazos, contratos, honorarios, documentos, params, integracoes, movimentacoes, alertas };
}


type AgendaStatus = "confirmado" | "pendente" | "cancelado" | "concluido";
type CrmActivityType = "ligacao" | "email" | "whatsapp" | "tarefa";
type CrmTemplateChannel = "email" | "whatsapp";
type WhatsMessageAuthor = "cliente" | "atendente" | "bot";
type SaleSource = "checkout" | "recuperacao" | "recompra";
type SaleStatus = "aprovado" | "recusado" | "pendente" | "estornado";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function getAgendaMockConfig(nicho = "servicos") {
  const presets: Record<string, { title: string; description: string; professionals: string[]; services: [string, number, number][]; clients: string[] }> = {
    servicos: {
      title: "Agenda de Serviços",
      description: "Atendimentos, ordens de serviço, profissionais externos e confirmação por horário.",
      professionals: ["Técnico Gabriel", "Consultora Renata"],
      services: [["Visita técnica", 60, 180], ["Diagnóstico presencial", 90, 260], ["Instalação assistida", 120, 420]],
      clients: ["Wagner Miller", "Condomínio Vila Verde", "Mariana Lopes"],
    },
    saude: {
      title: "Agenda Médica",
      description: "Consultas, retornos, profissionais de saúde e lembretes com dados clínicos fictícios.",
      professionals: ["Dra. Helena Costa", "Dr. Bruno Mattos"],
      services: [["Consulta inicial", 50, 320], ["Retorno", 30, 180], ["Avaliação preventiva", 60, 390]],
      clients: ["Paciente Camila Nunes", "Paciente Roberto Lima", "Paciente Ana Prado"],
    },
    eventos: {
      title: "Agenda de Eventos",
      description: "Reservas por artista, montagem, passagem de som e agenda operacional do evento.",
      professionals: ["DJ Lumen", "Equipe Técnica WMP"],
      services: [["Passagem de som", 60, 0], ["Reserva de artista", 240, 1800], ["Montagem técnica", 120, 650]],
      clients: ["Wagner Miller Produções", "Bar Mar Azul", "Família Souza"],
    },
    fitness: {
      title: "Agenda Fitness",
      description: "Aulas, avaliações, turmas, profissionais e controle de vagas por horário.",
      professionals: ["Prof. Lucas", "Personal Bianca"],
      services: [["Avaliação física", 45, 120], ["Treino personalizado", 60, 180], ["Aula coletiva", 50, 60]],
      clients: ["Aluno Rafael", "Aluna Priscila", "Aluno Diego"],
    },
  };

  return presets[nicho] ?? presets.servicos;
}

export function createAgendaMock(nicho = "servicos") {
  const config = getAgendaMockConfig(nicho);
  const profs = config.professionals.map((nome, index) => ({
    id: uid("pr"),
    nome,
    especialidade: index === 0 ? "Atendimento principal" : "Suporte e cobertura",
    cor: index === 0 ? "#22c55e" : "#3b82f6",
  }));
  const servs = config.services.map(([nome, duracao, preco]) => ({ id: uid("sv"), nome, duracao, preco }));
  const data = today();
  const agds = [
    { id: uid("ag"), profId: profs[0].id, servicoId: servs[0].id, cliente: config.clients[0], telefone: "(11) 90000-0001", data, hora: "09:00", status: "confirmado" as AgendaStatus },
    { id: uid("ag"), profId: profs[1].id, servicoId: servs[1].id, cliente: config.clients[1], telefone: "(11) 90000-0002", data, hora: "18:30", status: "pendente" as AgendaStatus },
    { id: uid("ag"), profId: profs[0].id, servicoId: servs[2].id, cliente: config.clients[2], telefone: "(11) 90000-0003", data, hora: "15:00", status: "concluido" as AgendaStatus },
  ];
  const espera = [{ id: uid("es"), cliente: "Cliente em espera", telefone: "(11) 90000-0004", servicoId: servs[1].id, preferencia: "Primeiro horário disponível" }];
  const params = { lembrete24h: true, lembrete1h: true, confirmaWhats: true, bloqueioFeriado: false, reagendamentoAuto: true };
  return { config, profs, servs, agds, espera, params };
}

export const CRM_DEFAULT_PARAMS = {
  lgpd: true,
  followupAuto: true,
  leadScoring: true,
  roundRobin: false,
  ativarFunis: true,
  ativarTags: true,
  exigirOrigem: true,
  ativarReativacao: true,
  boasVindasLead: true,
  boasVindasCliente: true,
  pesquisaPosConversao: false,
  tarefaAutoNovoLead: true,
  distribuirAuto: false,
  exigirResponsavel: true,
  permitirSemWhats: false,
  permitirSemEmail: true,
  registrarLogsComunicacao: true,
  registrarHistoricoCliente: true,
};
export type CrmParams = typeof CRM_DEFAULT_PARAMS;

export function createCrmMock() {
  const now = new Date().toISOString();
  const leads = [
    { id: uid("ld"), nome: "Ana Souza", email: "ana@demo.com", telefone: "(11) 90000-0001", origem: "Google Ads", estagio: "Novo lead", valor: 4900, score: 72, tags: ["crm"], criadoEm: now },
    { id: uid("ld"), nome: "Marcelo Lima", email: "marcelo@demo.com", telefone: "(11) 90000-0002", origem: "Instagram", estagio: "Qualificação", valor: 8200, score: 84, tags: ["whatsapp", "crm"], criadoEm: now },
    { id: uid("ld"), nome: "Patrícia Gomes", email: "patricia@demo.com", telefone: "(21) 99000-0003", origem: "Indicação", estagio: "Proposta enviada", valor: 12400, score: 91, tags: ["plano-completo"], criadoEm: now },
    { id: uid("ld"), nome: "Clínica Vitalis", email: "contato@vitalis.demo", telefone: "(11) 90000-0101", origem: "Google Ads", estagio: "Primeiro contato", valor: 6800, score: 78, tags: ["saúde"], criadoEm: now },
    { id: uid("ld"), nome: "Bar Mar Azul", email: "bar@demo.com", telefone: "(21) 99000-0404", origem: "Site", estagio: "Contratado", valor: 8200, score: 96, tags: ["eventos"], criadoEm: now },
  ];
  const atvs = [
    { id: uid("at"), leadId: leads[1].id, tipo: "whatsapp" as CrmActivityType, titulo: "TESTE — DEMONSTRAÇÃO — Enviar proposta CRM + WhatsApp", data: now, concluida: false },
    { id: uid("at"), leadId: leads[2].id, tipo: "tarefa" as CrmActivityType, titulo: "Validar regras de funil e responsável", data: now, concluida: true },
  ];
  const tpls = [
    { id: uid("tp"), nome: "Boas-vindas — novo lead", canal: "email" as CrmTemplateChannel, corpo: "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE\n\nOlá {nome}, recebemos seu interesse. Em breve um consultor entra em contato." },
    { id: uid("tp"), nome: "Follow-up proposta", canal: "whatsapp" as CrmTemplateChannel, corpo: "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE\n\nOi {nome}! Posso esclarecer dúvidas sobre a proposta enviada?" },
    { id: uid("tp"), nome: "Reativação", canal: "whatsapp" as CrmTemplateChannel, corpo: "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE\n\n{nome}, faz um tempo que não conversamos. Posso te mostrar novidades?" },
  ];
  const autos = [
    { id: uid("au"), nome: "Lead quente → WhatsApp consultivo", gatilho: "score_maior_80", acao: "abrir_conversa:consultor", ativa: true },
    { id: uid("au"), nome: "Proposta sem resposta 48h → lembrete", gatilho: "proposta_48h", acao: "enviar_template:Follow-up proposta", ativa: true },
    { id: uid("au"), nome: "Novo lead → boas-vindas", gatilho: "lead_criado", acao: "enviar_template:Boas-vindas — novo lead", ativa: true },
  ];

  const clientes = [
    { id: uid("cl"), nome: "Clínica Saúde Mais", documento: "12.345.678/0001-90", email: "contato@saudemais.demo", telefone: "(11) 3000-1000", produto: "CRM Profissional", plano: "Plano Profissional", status: "Ativo" as const },
    { id: uid("cl"), nome: "Restaurante Villa Rio", documento: "23.456.789/0001-01", email: "comercial@villario.demo", telefone: "(21) 3000-2000", produto: "WhatsApp Inteligente", plano: "Plano Inicial", status: "Ativo" as const },
    { id: uid("cl"), nome: "Andrade & Costa Advocacia", documento: "34.567.890/0001-12", email: "juridico@andradecosta.demo", telefone: "(11) 3000-3000", produto: "Plano Completo", plano: "Plano Completo", status: "Ativo" as const },
  ];
  const empresas = clientes.map((c) => ({ id: uid("emp"), razaoSocial: c.nome, cnpj: c.documento, segmento: c.nome.includes("Clínica") ? "Saúde" : c.nome.includes("Restaurante") ? "Alimentação" : "Jurídico" }));
  const produtos = [
    { id: uid("pr"), nome: "CRM Profissional", preco: 247, descricao: "Leads, funis, automações e dashboards." },
    { id: uid("pr"), nome: "WhatsApp Inteligente", preco: 197, descricao: "Inbox, templates e fluxos automatizados." },
    { id: uid("pr"), nome: "Agenda Online", preco: 147, descricao: "Reservas, profissionais e lembretes." },
  ];
  const planos = [
    { id: uid("pl"), nome: "Plano Inicial", preco: 197, ciclo: "mensal", itens: ["CRM básico", "1 usuário"] },
    { id: uid("pl"), nome: "Plano Profissional", preco: 397, ciclo: "mensal", itens: ["CRM completo", "3 usuários", "Automações"] },
    { id: uid("pl"), nome: "Plano Completo", preco: 697, ciclo: "mensal", itens: ["Todos os módulos", "Usuários ilimitados"] },
  ];
  const servicos = [
    { id: uid("sv"), nome: "Onboarding assistido", preco: 480, duracao: "5 dias" },
    { id: uid("sv"), nome: "Consultoria comercial", preco: 980, duracao: "10 dias" },
    { id: uid("sv"), nome: "Treinamento da equipe", preco: 580, duracao: "3 dias" },
  ];
  const prazosDias = [
    { id: uid("pz"), nome: "Retorno ao novo lead", dias: 3 },
    { id: uid("pz"), nome: "Validade de proposta", dias: 5 },
    { id: uid("pz"), nome: "Reativação de cliente inativo", dias: 30 },
    { id: uid("pz"), nome: "Janela de recompra", dias: 90 },
    { id: uid("pz"), nome: "Cobrança em atraso", dias: 7 },
  ];
  const funis = [{ id: uid("fn"), nome: "Funil Comercial Padrão", ativo: true }];
  const etapas = ["Novo lead", "Primeiro contato", "Qualificação", "Proposta enviada", "Aguardando pagamento", "Contratado", "Onboarding", "Reativação"].map((nome, i) => ({ id: uid("et"), funilId: funis[0].id, nome, ordem: i + 1 }));
  const regras = [
    { id: uid("rg"), nome: "Sem resposta 3 dias → Reativação", quando: "lead sem interação por 3 dias", entao: "mover para etapa Reativação", ativa: true },
    { id: uid("rg"), nome: "Proposta enviada → tarefa de follow-up", quando: "etapa = Proposta enviada", entao: "criar tarefa de follow-up em 2 dias", ativa: true },
    { id: uid("rg"), nome: "Score > 80 → distribuir vendedor sênior", quando: "score do lead > 80", entao: "atribuir ao vendedor sênior", ativa: false },
  ];
  const tags = ["quente", "frio", "vip", "indicação", "saúde", "eventos", "jurídico", "alimentação"].map((t) => ({ id: uid("tg"), nome: t }));
  const origens = ["Google Ads", "Instagram", "WhatsApp", "Site", "Indicação", "Tráfego orgânico"].map((o) => ({ id: uid("og"), nome: o }));
  const campanhas = [
    { id: uid("cp"), nome: "Campanha Google CRM", canal: "Google Ads", status: "Ativo" as const, leads: 24 },
    { id: uid("cp"), nome: "Campanha WhatsApp Inteligente", canal: "WhatsApp", status: "Ativo" as const, leads: 18 },
    { id: uid("cp"), nome: "Campanha Plano Teste", canal: "Site", status: "Configurado" as const, leads: 9 },
    { id: uid("cp"), nome: "Campanha Reativação", canal: "E-mail", status: "Pendente" as const, leads: 6 },
  ];
  const followups = [
    { id: uid("fu"), leadId: leads[2].id, descricao: "Confirmar envio do contrato", quando: now, status: "Pendente" as const },
    { id: uid("fu"), leadId: leads[1].id, descricao: "Enviar vídeo demonstrativo", quando: now, status: "Concluído" as const },
  ];
  const usuarios = [
    { id: uid("us"), nome: "Administrador Demo", email: "admin@demo.com", papel: "Administrador", status: "Ativo" as const },
    { id: uid("us"), nome: "Vendedor Demo", email: "vendas@demo.com", papel: "Vendedor", status: "Ativo" as const },
    { id: uid("us"), nome: "Atendimento Demo", email: "atendimento@demo.com", papel: "Atendimento", status: "Ativo" as const },
    { id: uid("us"), nome: "Financeiro Demo", email: "financeiro@demo.com", papel: "Financeiro", status: "Ativo" as const },
  ];
  type PermAcao = "ver" | "criar" | "editar" | "excluir";
  const permissoes: { papel: string; acao: PermAcao; permitido: boolean }[] = [];
  for (const u of ["Administrador", "Vendedor", "Atendimento", "Financeiro"]) {
    for (const a of ["ver", "criar", "editar", "excluir"] as PermAcao[]) {
      permissoes.push({ papel: u, acao: a, permitido: u === "Administrador" || (u === "Vendedor" && a !== "excluir") || (u === "Atendimento" && (a === "ver" || a === "criar")) || (u === "Financeiro" && a === "ver") });
    }
  }
  const logs = [
    { id: uid("lg"), quando: now, usuario: "Administrador Demo", acao: "Seed inicial dos dados do CRM (DEMO)" },
    { id: uid("lg"), quando: now, usuario: "Vendedor Demo", acao: "Criou lead Marcelo Lima" },
    { id: uid("lg"), quando: now, usuario: "Atendimento Demo", acao: "Enviou template Boas-vindas (Simulado — DEMO)" },
  ];

  return {
    leads, atvs, tpls, autos, params: CRM_DEFAULT_PARAMS,
    clientes, empresas, produtos, planos, servicos, prazosDias,
    funis, etapas, regras, tags, origens, campanhas, followups,
    usuarios, permissoes, logs,
  };
}

export function createWhatsAppMock() {
  const now = new Date().toISOString();
  const contatos = [
    { id: uid("ct"), nome: "Wagner Miller", telefone: "(21) 99000-0202", tags: ["parceiros", "proposta"], optIn: true },
    { id: uid("ct"), nome: "Camila Nunes", telefone: "(11) 90000-0505", tags: ["agenda"], optIn: true },
    { id: uid("ct"), nome: "Bar Mar Azul", telefone: "(21) 99000-0404", tags: ["eventos"], optIn: true },
  ];
  const conversas = [
    { id: uid("cv"), contatoId: contatos[0].id, status: "aberto" as const, mensagens: [
      { de: "cliente" as WhatsMessageAuthor, texto: "Quero ver a agenda de parceiros funcionando.", quando: now },
      { de: "bot" as WhatsMessageAuthor, texto: "Perfeito. Vou abrir a demo WMP com contratos, agenda e repasses.", quando: now },
    ] },
  ];
  const tpls = [
    { id: uid("tp"), nome: "Confirmação de agenda", corpo: "Olá {nome}, seu horário foi reservado para {data} às {hora}.", aprovado: true },
    { id: uid("tp"), nome: "Link de contratação", corpo: "{nome}, segue o link seguro para contratar o módulo escolhido: {link}.", aprovado: true },
  ];
  const camps = [{ id: uid("cp"), nome: "Reativação de leads por módulo", templateId: tpls[1].id, enviadas: 180, entregues: 171, lidas: 132, respondidas: 31 }];
  const fluxos = [
    { id: uid("fl"), nome: "Triagem por módulo", passos: ["Identificar gargalo", "Sugerir módulo", "Abrir demo específica", "Enviar CTA de contratação"], ativo: true },
  ];
  const params = { respostaAuto: true, horarioComercial: false, protocoloLGPD: true, multiAtendente: true };
  return { contatos, conversas, tpls, camps, fluxos, params };
}

export function createEventosMock() {
  const lotes = [
    { id: uid("lt"), nome: "Lote antecipado", preco: 97, quantidade: 80 },
    { id: uid("lt"), nome: "Pista", preco: 147, quantidade: 160 },
    { id: uid("lt"), nome: "VIP backstage", preco: 297, quantidade: 30 },
  ];
  return {
    evento: { id: uid("evt"), nome: "Noite WMP Experience", data: addDays(14), local: "Casa de Eventos Mar Azul (demo)", lotes },
    params: { qrUnico: true, bloquearReutilizacao: true, permitirTransferencia: true, enviarNps: true, listaEspera: true },
  };
}

export function createAfiliadosMock() {
  const produtos = [
    { id: uid("prd"), nome: "Mentoria Agenda Cheia", preco: 997, recorrencia: "unico" as const },
    { id: uid("prd"), nome: "Assinatura Comunidade Pro", preco: 197, recorrencia: "mensal" as const },
  ];
  const ofertas = [
    { id: uid("of"), produtoId: produtos[0].id, nome: "Lançamento parceiros", comissaoPct: 40, bumpPct: 20 },
    { id: uid("of"), produtoId: produtos[1].id, nome: "Plano recorrente", comissaoPct: 30, bumpPct: 10 },
  ];
  const afiliados = [
    { id: uid("af"), nome: "Carla Reis", email: "carla@demo.com" },
    { id: uid("af"), nome: "João Lima", email: "joao@demo.com" },
  ];
  const cupons = [{ id: uid("cp"), code: "CARLA10", descontoPct: 10, afiliadoId: afiliados[0].id }];
  const vendas = [
    { id: uid("vd"), data: new Date().toISOString(), produtoId: produtos[0].id, ofertaId: ofertas[0].id, afiliadoId: afiliados[0].id, cupomId: cupons[0].id, bruto: 997, bump: false, status: "aprovado" as SaleStatus, fonte: "checkout" as SaleSource },
    { id: uid("vd"), data: new Date().toISOString(), produtoId: produtos[1].id, ofertaId: ofertas[1].id, afiliadoId: afiliados[1].id, bruto: 256.1, bump: true, status: "aprovado" as SaleStatus, fonte: "recompra" as SaleSource },
  ];
  const params = { splitAutomatico: true, comissaoRecorrencia: true, recuperacaoCarrinho: true, recompraAutomatica: true, rankingPublico: true };
  return { produtos, ofertas, afiliados, cupons, vendas, params };
}

export function createParceirosMock() {
  const now = new Date();
  const iso = (days: number, hour = "20:00") => `${addDays(days)}T${hour}:00.000Z`;
  const parceiros = [
    { id: uid("pa"), nomeArtistico: "DJ Lumen", nomeCompleto: "Lucas Mendes", cpf: "111.222.333-44", mei: true, emiteNF: true, whatsapp: "(21) 99000-0001", email: "lumen@demo.com", estado: "RJ", cidade: "Rio de Janeiro", bairro: "Barra da Tijuca", raioKm: 40, aceitaDeslocamento: true, aceitaViagem: true, cacheMinimo: 1500, estilos: ["House", "Open Format"], equipamentos: ["CDJs", "Mixer", "Notebook backup"], status: "Aprovado" as const, nivel: "Preferencial" as const, pontosPos: 6, pontosNeg: 0, eventosRealizados: 6, eventosSemCancelamento: 6, saldoNegativo: 0 },
    { id: uid("pa"), nomeArtistico: "DJ Rita Bass", nomeCompleto: "Rita Bastos", cpf: "222.333.444-55", mei: false, emiteNF: false, whatsapp: "(21) 99000-0002", email: "rita@demo.com", estado: "RJ", cidade: "Niterói", bairro: "Icaraí", raioKm: 25, aceitaDeslocamento: true, aceitaViagem: false, cacheMinimo: 1200, estilos: ["Eletrônica", "Pop"], equipamentos: ["CDJs", "Mixer"], status: "Aguardando aprovação" as const, nivel: "Iniciante" as const, pontosPos: 0, pontosNeg: 0, eventosRealizados: 0, eventosSemCancelamento: 0, saldoNegativo: 0 },
    { id: uid("pa"), nomeArtistico: "DJ Sertão", nomeCompleto: "Bruno Carvalho", cpf: "333.444.555-66", mei: true, emiteNF: true, whatsapp: "(21) 99000-0003", email: "sertao@demo.com", estado: "RJ", cidade: "Rio de Janeiro", bairro: "Copacabana", raioKm: 30, aceitaDeslocamento: true, aceitaViagem: true, cacheMinimo: 1800, estilos: ["Sertanejo", "Open Format"], equipamentos: ["CDJs", "Mixer", "PA pequeno"], status: "Aprovado" as const, nivel: "Aprovado" as const, pontosPos: 3, pontosNeg: 1, eventosRealizados: 4, eventosSemCancelamento: 3, saldoNegativo: 0 },
  ];
  const eventos = [
    { id: uid("ev"), nome: "Casamento Marina & Caio", cliente: "Família Souza", tipo: "pontual" as const, data: iso(10, "20:00"), horaChegada: "18:00", horaInicio: "20:00", horaFim: "02:00", cidade: "Rio de Janeiro", bairro: "Barra da Tijuca", publico: 180, estilo: "Open Format", equipamentos: ["CDJs", "Mixer"], valorTotal: 6000, percentualWMP: 30, parceiroId: parceiros[0].id, status: "Aceito" as const, contratoAceito: true },
    { id: uid("ev"), nome: "Residência Bar Mar Azul", cliente: "Bar Mar Azul", tipo: "recorrente" as const, data: iso(5, "21:00"), horaChegada: "20:00", horaInicio: "21:00", horaFim: "01:00", cidade: "Rio de Janeiro", bairro: "Botafogo", publico: 120, estilo: "House", equipamentos: ["CDJs", "Mixer"], valorTotal: 3800, percentualWMP: 25, status: "Aberto" as const, contratoAceito: false },
  ];
  const contratos = [{ id: uid("co"), eventoId: eventos[0].id, parceiroId: parceiros[0].id, tipo: "Evento pontual" as const, status: "Aceito" as const, geradoEm: now.toISOString(), aceiteEm: now.toISOString() }];
  const multas: never[] = [];
  const avisos = [{ id: uid("av"), canal: "WhatsApp" as const, para: parceiros[0].whatsapp, assunto: "TESTE — Agenda confirmada", corpo: "Agenda bloqueada para Casamento Marina & Caio.", quando: now.toISOString() }];
  const logs = [{ id: uid("lg"), quando: now.toISOString(), usuario: "Gestão WMP", regra: "Seed DEMO", de: "vazio", para: "dados WMP separados" }];
  return { parceiros, eventos, contratos, multas, avisos, logs };
}
