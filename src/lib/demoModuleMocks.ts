import { uid } from "@/lib/demoSandbox";

type AgendaStatus = "confirmado" | "pendente" | "cancelado" | "concluido";
type CrmActivityType = "ligacao" | "email" | "whatsapp" | "tarefa";
type CrmTemplateChannel = "email" | "whatsapp";
type WhatsMessageAuthor = "cliente" | "atendente" | "bot";
type TicketStatus = "pago" | "pendente" | "cortesia" | "transferido" | "cancelado";
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

export function createCrmMock() {
  const now = new Date().toISOString();
  const leads = [
    { id: uid("ld"), nome: "Clínica Vitalis", email: "contato@vitalis.demo", telefone: "(11) 90000-0101", origem: "Google Ads", estagio: "Novo", valor: 6800, score: 78, tags: ["saúde"], criadoEm: now },
    { id: uid("ld"), nome: "Wagner Miller Produções", email: "wmp@demo.com", telefone: "(21) 99000-0202", origem: "Indicação", estagio: "Qualificado", valor: 12400, score: 92, tags: ["eventos", "quente"], criadoEm: now },
    { id: uid("ld"), nome: "Studio Beleza Pura", email: "studio@demo.com", telefone: "(11) 90000-0303", origem: "Instagram", estagio: "Proposta", valor: 3900, score: 70, tags: ["agenda"], criadoEm: now },
    { id: uid("ld"), nome: "Bar Mar Azul", email: "bar@demo.com", telefone: "(21) 99000-0404", origem: "Site", estagio: "Ganho", valor: 8200, score: 96, tags: ["pdv", "eventos"], criadoEm: now },
  ];
  const atvs = [
    { id: uid("at"), leadId: leads[1].id, tipo: "whatsapp" as CrmActivityType, titulo: "Enviar proposta WMP com módulos Agenda + Parceiros", data: now, concluida: false },
    { id: uid("at"), leadId: leads[2].id, tipo: "tarefa" as CrmActivityType, titulo: "Validar regras de agenda e no-show", data: now, concluida: true },
  ];
  const tpls = [
    { id: uid("tp"), nome: "Proposta modular", canal: "email" as CrmTemplateChannel, corpo: "Olá {nome}, segue proposta com módulos específicos para sua operação." },
    { id: uid("tp"), nome: "Follow-up orçamento", canal: "whatsapp" as CrmTemplateChannel, corpo: "Oi {nome}! Posso te mostrar a demo do módulo que resolve seu gargalo?" },
  ];
  const autos = [
    { id: uid("au"), nome: "Lead quente → WhatsApp consultivo", gatilho: "score_maior_80", acao: "abrir_conversa:consultor", ativa: true },
    { id: uid("au"), nome: "Proposta sem resposta → lembrete", gatilho: "proposta_48h", acao: "enviar_template:Follow-up", ativa: true },
  ];
  const params = { lgpd: true, followupAuto: true, leadScoring: true, roundRobin: true };
  return { leads, atvs, tpls, autos, params };
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
  const multas = [];
  const avisos = [{ id: uid("av"), canal: "WhatsApp" as const, para: parceiros[0].whatsapp, assunto: "TESTE — Agenda confirmada", corpo: "Agenda bloqueada para Casamento Marina & Caio.", quando: now.toISOString() }];
  const logs = [{ id: uid("lg"), quando: now.toISOString(), usuario: "Gestão WMP", regra: "Seed DEMO", de: "vazio", para: "dados WMP separados" }];
  return { parceiros, eventos, contratos, multas, avisos, logs };
}
