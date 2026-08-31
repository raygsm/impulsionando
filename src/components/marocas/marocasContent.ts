// Fonte única de conteúdo público da Marocas.
// Regra: nenhum contato, endereço, métrica, data histórica ou prova social é publicado
// sem validação explícita do cliente. O domínio atual é gestão de locação por temporada.

export const MAROCAS_BRAND = {
  nome: "Marocas",
  vertical: "Gestão de locação por temporada",
  cidade: "Rio de Janeiro",
  bairroBase: "",
  fundacao: null as number | null,
  slogan: "Você não precisa ir ao imóvel. A Marocas cuida de tudo.",
  descricaoCurta:
    "Limpeza, reposições, vistorias e manutenções coordenadas de ponta a ponta, com acompanhamento e evidências para você ter tranquilidade mesmo à distância.",
  promessa:
    "Cuidar de cada detalhe do imóvel com presença operacional, registros, acompanhamento e histórico — para que o proprietário não precise se deslocar nem coordenar prestadores.",
};

export const MAROCAS_CONTATO = {
  validated: false,
  enderecoLinha1: "",
  enderecoLinha2: "",
  cep: "",
  whatsapp: "",
  whatsappHumanizado: "",
  telefone: "",
  emailAnfitrioes: "",
  emailHospedes: "",
  emailPrestadores: "",
  emailSuporte: "",
  instagram: "",
  instagramUrl: "",
  mapaUrl: "",
};

// Horários somente devem ser preenchidos após validação do cliente.
export const MAROCAS_HORARIOS_SUPORTE: Array<{ dia: string; horario: string }> = [];

export const MAROCAS_SERVICOS = [
  { id: "limpeza", emoji: "🧼", titulo: "Limpeza operacional", resumo: "Checklist, evidências e histórico por imóvel quando o serviço estiver contratado e configurado." },
  { id: "reposicao", emoji: "🧺", titulo: "Reposição de enxoval e itens", resumo: "Controle de necessidades, solicitações e reposições vinculadas a cada unidade." },
  { id: "manutencao", emoji: "🛠️", titulo: "Manutenção", resumo: "Solicitações, orçamentos, execução e histórico de manutenção por imóvel." },
  { id: "comunicacao", emoji: "💬", titulo: "Comunicação", resumo: "Jornadas e mensagens podem ser configuradas por evento e canal após a ativação das integrações." },
  { id: "checkin", emoji: "🔑", titulo: "Rotina de check-in e check-out", resumo: "Organização das instruções e tarefas operacionais conforme a configuração de cada imóvel." },
  { id: "vistoria", emoji: "📋", titulo: "Vistoria e evidências", resumo: "Registro de checklist, observações e imagens autorizadas para acompanhamento operacional." },
  { id: "agenda", emoji: "📅", titulo: "Agenda operacional", resumo: "Serviços, manutenções e atividades podem ser organizados por unidade e data." },
  { id: "financeiro", emoji: "💳", titulo: "Demonstrativos operacionais", resumo: "Registros de custos, serviços e repasses disponíveis quando alimentados pela operação." },
];

export const MAROCAS_JORNADA_ANFITRIAO = [
  { passo: "01", titulo: "Cadastre seu imóvel", texto: "Informe os dados necessários para estruturar a operação da unidade." },
  { passo: "02", titulo: "Defina a operação", texto: "Selecione serviços, regras, responsáveis e necessidades específicas do imóvel." },
  { passo: "03", titulo: "Configure equipe e rotinas", texto: "Associe prestadores, checklists, suprimentos, agenda e comunicações aplicáveis." },
  { passo: "04", titulo: "Acompanhe pelo painel", texto: "Consulte serviços, manutenções, evidências e demonstrativos registrados na plataforma." },
];

export const MAROCAS_JORNADA_HOSPEDE = [
  { passo: "01", titulo: "Orientações da estadia", texto: "Receba as informações que o anfitrião disponibilizar para a sua reserva." },
  { passo: "02", titulo: "Acesso às instruções", texto: "Consulte orientações de entrada, uso do imóvel e regras quando cadastradas." },
  { passo: "03", titulo: "Solicite suporte", texto: "Registre uma necessidade para que a operação responsável possa acompanhar." },
  { passo: "04", titulo: "Encerramento da estadia", texto: "Consulte as orientações de saída e os próximos passos configurados para o imóvel." },
];

export const MAROCAS_PRESTADORES_CATEGORIAS = [
  { id: "limpeza", emoji: "🧽", titulo: "Limpeza" },
  { id: "lavanderia", emoji: "🧺", titulo: "Lavanderia" },
  { id: "eletrica", emoji: "⚡", titulo: "Elétrica" },
  { id: "hidraulica", emoji: "🚿", titulo: "Hidráulica" },
  { id: "ar", emoji: "❄️", titulo: "Ar-condicionado" },
  { id: "gesso", emoji: "🏗️", titulo: "Gesso" },
  { id: "pintura", emoji: "🎨", titulo: "Pintura" },
  { id: "marcenaria", emoji: "🪚", titulo: "Marcenaria" },
  { id: "vistoria", emoji: "📷", titulo: "Vistoria" },
  { id: "reposicao", emoji: "🛒", titulo: "Reposição" },
];

export const MAROCAS_PERFIS_HOSPEDE = [
  "Família", "Casal", "Trabalho remoto", "Lazer", "Viagem a trabalho",
  "Roteiros gastronômicos", "Passeios ao ar livre", "Experiência premium",
];

// Catálogo conceitual. Um fluxo só pode ser exibido como ativo quando estiver registrado
// e homologado no Core/n8n para o tenant Marocas.
export const MAROCAS_FLUXOS_N8N = [
  { evento: "reserva_confirmada", canal: "Configurável", descricao: "Boas-vindas e dados autorizados do imóvel" },
  { evento: "pre_checkin", canal: "Configurável", descricao: "Orientações prévias de entrada" },
  { evento: "checkin_dia", canal: "Configurável", descricao: "Orientações do dia de entrada" },
  { evento: "durante_estadia", canal: "Configurável", descricao: "Acompanhamento da estadia" },
  { evento: "pre_checkout", canal: "Configurável", descricao: "Orientações de saída" },
  { evento: "pos_estadia", canal: "Configurável", descricao: "Pesquisa e relacionamento pós-estadia" },
  { evento: "limpeza_agendada", canal: "Interno", descricao: "Acionamento operacional de limpeza" },
  { evento: "manutencao_solicitada", canal: "Interno", descricao: "Abertura e acompanhamento de manutenção" },
  { evento: "prestador_cancelou", canal: "Interno", descricao: "Reorganização de responsável" },
  { evento: "servico_concluido", canal: "Interno", descricao: "Conclusão e registro do serviço" },
];

// Nenhuma métrica pública é publicada até existir fonte operacional validada.
export const MAROCAS_PROVA_SOCIAL: Array<{ valor: string; label: string }> = [];

// Banco de imagens editorial de demonstração, não fotografia oficial do cliente.
export const MAROCAS_IMAGENS = {
  heroApto: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&auto=format&fit=crop&q=85",
  heroCopacabana: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&auto=format&fit=crop&q=85",
  sala: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop&q=85",
  quarto: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&auto=format&fit=crop&q=85",
  cozinhaApto: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&auto=format&fit=crop&q=85",
  varanda: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop&q=85",
  limpeza: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&auto=format&fit=crop&q=85",
  chave: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&auto=format&fit=crop&q=85",
  hospede: "https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1200&auto=format&fit=crop&q=85",
  prestador: "https://images.unsplash.com/photo-1581091012184-7d5f0f6f0f14?w=1200&auto=format&fit=crop&q=85",
  operacao: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=85",
  bairro: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1600&auto=format&fit=crop&q=85",
};

export function marocasWhatsAppUrl(msg?: string) {
  if (!MAROCAS_CONTATO.validated || !MAROCAS_CONTATO.whatsapp) return "/marocas/contato";
  const base = `https://wa.me/${MAROCAS_CONTATO.whatsapp}`;
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}