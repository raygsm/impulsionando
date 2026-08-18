/**
 * Oliver — contextos padrão por rota CHRISMED (V3.F).
 *
 * Cada página pode sobrescrever via evento `chrismed:oliver:context`.
 * Se nada for emitido, o painel usa o contexto padrão desta tabela.
 *
 * Nenhuma resposta é gerada aqui. O painel apenas mostra saudação +
 * sugestões que executam ações reais (navegar / abrir informação /
 * fechar). Nada de conversa simulada.
 */
export type OliverQuickReply =
  | { label: string; kind: 'navigate'; to: string; search?: Record<string, unknown> }
  | { label: string; kind: 'info'; message: string }
  | { label: string; kind: 'close' };

export type OliverContext = {
  key: string;
  eyebrow: string;
  greeting: string;
  quickReplies: OliverQuickReply[];
};

export type OliverContextEventDetail = Partial<Omit<OliverContext, 'quickReplies'>> & {
  context?: string;
  quickReplies?: OliverQuickReply[] | string[];
};

export const OLIVER_CONTEXTS: Record<string, OliverContext> = {
  home: {
    key: 'home',
    eyebrow: 'CHRISMED',
    greeting:
      'Sou Oliver, concierge da CHRISMED. Posso orientar pacientes, profissionais da saúde, empresas e equipes de RH ou SST para o caminho correto.',
    quickReplies: [
      { label: 'Quero agendar', kind: 'navigate', to: '/chrismed/agendar' },
      { label: 'Conhecer a Dra. Christiane', kind: 'navigate', to: '/chrismed/dra-cristiane' },
      { label: 'Medicina Ambulatorial', kind: 'navigate', to: '/chrismed/clinica' },
      { label: 'Empresas · Saúde Corporativa', kind: 'navigate', to: '/chrismed/medicina-ocupacional' },
    ],
  },
  dra: {
    key: 'dra',
    eyebrow: 'Dra. Christiane Alencar',
    greeting:
      'Posso ajudar a agendar uma consulta com a Dra. Christiane, escolher a modalidade adequada ou responder a dúvidas administrativas.',
    quickReplies: [
      { label: 'Agendar consulta', kind: 'navigate', to: '/chrismed/agendar' },
      { label: 'Ver modalidades', kind: 'navigate', to: '/chrismed/clinica' },
      { label: 'Falar com a equipe', kind: 'info', message: 'Deixe seu nome e melhor horário. A equipe CHRISMED responde no próximo horário administrativo.' },
    ],
  },
  ambulatorial: {
    key: 'ambulatorial',
    eyebrow: 'Medicina Ambulatorial',
    greeting:
      'Posso ajudar você a escolher entre teleconsulta, atendimento presencial em Copacabana ou consulta domiciliar.',
    quickReplies: [
      { label: 'Quero agendar', kind: 'navigate', to: '/chrismed/agendar' },
      { label: 'Teleconsulta', kind: 'navigate', to: '/chrismed/agendar', search: { modality: 'telemedicina' } },
      { label: 'Presencial em Copacabana', kind: 'navigate', to: '/chrismed/agendar', search: { modality: 'presencial' } },
      { label: 'Consulta domiciliar', kind: 'navigate', to: '/chrismed/agendar', search: { modality: 'domiciliar' } },
      { label: 'Tenho uma dúvida', kind: 'info', message: 'Descreva a dúvida em uma frase. A equipe CHRISMED retorna no próximo horário administrativo.' },
      { label: 'Falar com a equipe', kind: 'info', message: 'A equipe CHRISMED responde no próximo horário administrativo. Deixe nome e contato preferencial.' },
    ],
  },
  ocupacional: {
    key: 'ocupacional',
    eyebrow: 'CHRISMED Saúde Corporativa',
    greeting:
      'Posso orientar sua empresa sobre medicina ocupacional, ASO, PCMSO, gestão de colaboradores, programas de saúde, indicadores e jornadas corporativas. Primeiro, identifique seu papel para eu direcionar corretamente.',
    quickReplies: [
      {
        label: 'Sou RH ou Gestão de Pessoas',
        kind: 'info',
        message:
          'Para RH, a CHRISMED organiza agenda, ASOs, convocações, pendências, comunicação, campanhas e indicadores. Informe empresa, CNPJ, número aproximado de colaboradores, quantidade de unidades/cidades e principal necessidade para dimensionarmos a operação.',
      },
      {
        label: 'Sou de SST',
        kind: 'info',
        message:
          'Para SST, o foco é PCMSO, ASO, riscos, periodicidades, exames complementares, documentos, vencimentos e rastreabilidade. Informe empresa, CNPJ, número de colaboradores, unidades, principais riscos e como a operação é feita hoje.',
      },
      {
        label: 'Sou da Diretoria',
        kind: 'info',
        message:
          'Para diretoria, a CHRISMED estrutura governança, previsibilidade, indicadores, utilização, pendências, custo e expansão dos programas de saúde. Informe empresa, porte aproximado, unidades e o resultado que deseja melhorar.',
      },
      {
        label: 'Sou de Compras ou Financeiro',
        kind: 'info',
        message:
          'Podemos estruturar escopo, SLA, volume, custo por colaborador ou atendimento, centros de custo e modelo contratual. Informe empresa, CNPJ, quantidade aproximada de vidas, cidades e serviços que precisam ser cotados.',
      },
      {
        label: 'Sou colaborador',
        kind: 'info',
        message:
          'Se sua empresa já é atendida pela CHRISMED, use as instruções recebidas do RH ou informe o nome da empresa e o tipo de atendimento necessário. Dados clínicos individuais permanecem protegidos e não são compartilhados com áreas administrativas da empresa fora das hipóteses permitidas.',
      },
      { label: 'Agendar ASO', kind: 'navigate', to: '/chrismed/agendar', search: { service: 'aso' } },
      {
        label: 'Quero uma apresentação corporativa',
        kind: 'info',
        message:
          'Para preparar uma apresentação adequada, informe: nome, empresa, cargo/setor, CNPJ, número aproximado de colaboradores, cidades/unidades, principal necessidade, prazo, telefone, e-mail e melhor horário de contato.',
      },
    ],
  },
  gms: {
    key: 'gms',
    eyebrow: 'Global Medical Support',
    greeting:
      'Posso orientar assistência médica internacional no Rio de Janeiro em português, inglês ou espanhol. Não substituo o serviço público de emergência local.',
    quickReplies: [
      {
        label: 'Isto pode ser uma emergência',
        kind: 'info',
        message:
          'Se houver risco imediato à vida, dificuldade intensa para respirar, perda de consciência ou outra situação grave, procure o serviço de emergência local imediatamente. A CHRISMED não substitui esse serviço.',
      },
      {
        label: 'Preciso de consulta médica',
        kind: 'info',
        message:
          'Descreva a necessidade em uma frase (idioma, localização, tipo de suporte). A equipe CHRISMED responde no próximo horário administrativo e coordena os próximos passos.',
      },
      {
        label: 'Estou em um hospital',
        kind: 'info',
        message:
          'Informe o nome do hospital, cidade e situação em uma frase. A equipe CHRISMED avalia se a coordenação é possível e retorna com orientação.',
      },
      {
        label: 'Preciso de transferência médica',
        kind: 'info',
        message:
          'Transferências médicas exigem avaliação individualizada e aceitação da unidade receptora. Deixe cidade atual, cidade destino e responsável pelo contato.',
      },
      { label: 'Continue in English', kind: 'info', message: 'Please switch the site language to English (top of the page) and reopen this panel. The greeting and options will be presented in English.' },
      { label: 'Continuar en español', kind: 'info', message: 'Cambie el idioma del sitio a español (arriba de la página) y vuelva a abrir este panel. El saludo y las opciones aparecerán en español.' },
      {
        label: 'Falar com a equipe',
        kind: 'info',
        message:
          'A equipe internacional responde em PT · EN · ES no próximo horário administrativo. Deixe idioma preferencial e fuso horário.',
      },
    ],
  },
  agendar: {
    key: 'agendar',
    eyebrow: 'Agendamento',
    greeting:
      'Estou ao lado para ajudar durante o agendamento. Posso explicar modalidades, preparo ou formas de pagamento.',
    quickReplies: [
      { label: 'Diferença entre modalidades', kind: 'navigate', to: '/chrismed/clinica' },
      { label: 'Tenho uma dúvida', kind: 'info', message: 'Descreva a dúvida em uma frase. A equipe CHRISMED responde no próximo horário administrativo.' },
    ],
  },
  medicos: {
    key: 'medicos',
    eyebrow: 'Área dos Profissionais da Saúde',
    greeting:
      'Esta é a área dos profissionais da saúde. Posso encaminhar solicitações administrativas para a equipe CHRISMED.',
    quickReplies: [
      { label: 'Falar com a equipe', kind: 'info', message: 'Deixe nome, CRM e assunto. A equipe CHRISMED retorna no próximo horário administrativo.' },
    ],
  },
};

/**
 * Resolve o contexto padrão a partir do pathname atual.
 */
export function resolveOliverContext(pathname: string): OliverContext {
  if (pathname === '/chrismed' || pathname === '/chrismed/') return OLIVER_CONTEXTS.home;
  if (pathname.startsWith('/chrismed/dra-cristiane')) return OLIVER_CONTEXTS.dra;
  if (pathname.startsWith('/chrismed/clinica')) return OLIVER_CONTEXTS.ambulatorial;
  if (pathname.startsWith('/chrismed/ocupacional') || pathname.startsWith('/chrismed/medicina-ocupacional') || pathname.startsWith('/chrismed/empresa')) return OLIVER_CONTEXTS.ocupacional;
  if (pathname.startsWith('/chrismed/internacional')) return OLIVER_CONTEXTS.gms;
  if (pathname.startsWith('/chrismed/agendar')) return OLIVER_CONTEXTS.agendar;
  if (pathname.startsWith('/chrismed/medicos')) return OLIVER_CONTEXTS.medicos;
  return OLIVER_CONTEXTS.home;
}

function isOliverQuickReply(value: unknown): value is OliverQuickReply {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'label' in value &&
      'kind' in value &&
      typeof (value as { label?: unknown }).label === 'string',
  );
}

function resolveQuickReplies(
  quickReplies: OliverContextEventDetail['quickReplies'],
  base: OliverContext,
): OliverQuickReply[] {
  if (!quickReplies) return base.quickReplies;
  if (quickReplies.every(isOliverQuickReply)) return quickReplies;

  const labels = quickReplies.filter((item): item is string => typeof item === 'string');
  if (labels.length === 0) return base.quickReplies;

  return labels.map((label) => {
    const existing = base.quickReplies.find((reply) => reply.label === label);
    if (existing) return existing;
    return {
      label,
      kind: 'info' as const,
      message: 'A equipe CHRISMED pode orientar esse ponto no próximo horário administrativo.',
    };
  });
}

export function resolveOliverContextOverride(
  pathname: string,
  override: OliverContextEventDetail | null,
): OliverContext {
  const routeDefault = resolveOliverContext(pathname);
  if (!override) return routeDefault;

  const overrideKey = override.key ?? override.context;
  const base = overrideKey && OLIVER_CONTEXTS[overrideKey] ? OLIVER_CONTEXTS[overrideKey] : routeDefault;

  return {
    key: override.key ?? override.context ?? base.key,
    eyebrow: override.eyebrow ?? base.eyebrow,
    greeting: override.greeting ?? base.greeting,
    quickReplies: resolveQuickReplies(override.quickReplies, base),
  };
}
