// Conteúdo comercial WMP — front-end only.
// Utilizado por home, /wmp/pacotes, /wmp/cases, /wmp/sobre e /wmp/faq.

export type WmpPacote = {
  slug: "essencial" | "premium" | "show";
  nome: string;
  publico: string;
  preco_a_partir: string;
  destaque?: boolean;
  bullets: string[];
  cta: string;
};

export const WMP_PACOTES: WmpPacote[] = [
  {
    slug: "essencial",
    nome: "Essencial",
    publico: "Até 200 pessoas",
    preco_a_partir: "R$ 2.900",
    bullets: [
      "PA 2.000 W + 2 microfones sem fio",
      "Kit iluminação cênica básico (8 PAR LED)",
      "Mesa digital + técnico FOH dedicado",
      "Montagem, operação e desmontagem",
      "Laudo de dB sob demanda",
    ],
    cta: "Cotar Essencial",
  },
  {
    slug: "premium",
    nome: "Premium",
    publico: "200 a 1.500 pessoas",
    preco_a_partir: "R$ 7.400",
    destaque: true,
    bullets: [
      "Line array 8.000 W + subwoofers dedicados",
      "Iluminação cênica com moving heads + fumaça",
      "Palco Q30 coberto + telão LED P4 (6m²)",
      "2 técnicos FOH + operador de luz DMX",
      "ART emitida + laudo de dB municipal",
      "Plano B documentado (chuva, elétrica, atraso)",
    ],
    cta: "Cotar Premium",
  },
  {
    slug: "show",
    nome: "Show / Festival",
    publico: "Acima de 1.500 pessoas",
    preco_a_partir: "sob consulta",
    bullets: [
      "Line array L-Acoustics / d&b (até 30k W)",
      "Palco Q50 profissional + gerador silencioso",
      "Iluminação broadcast + telão LED P3 (>20m²)",
      "Equipe completa (FOH, monitor, luz, backline)",
      "Coordenação de produção minuto a minuto",
      "ART, laudos e alvarás acompanhados por engenharia",
    ],
    cta: "Falar com produção",
  },
];

export type WmpCase = {
  titulo: string;
  categoria: "Corporativo" | "Casamento" | "Festival" | "Show" | "Formatura";
  publico: string;
  local: string;
  ano: number;
  destaque: string;
};

export const WMP_CASES: WmpCase[] = [
  {
    titulo: "Festival Sertanejo de Verão",
    categoria: "Festival",
    publico: "8.000 pessoas",
    local: "Barra da Tijuca, RJ",
    ano: 2025,
    destaque: "Line array L-Acoustics em 4 dias consecutivos, laudo de dB dentro dos limites municipais.",
  },
  {
    titulo: "Convenção Nacional Tech Corp",
    categoria: "Corporativo",
    publico: "1.200 executivos",
    local: "Windsor Barra, RJ",
    ano: 2025,
    destaque: "3 palcos simultâneos, tradução simultânea, telão LED 12m e cronograma minuto a minuto.",
  },
  {
    titulo: "Casamento Praia Grumari",
    categoria: "Casamento",
    publico: "350 convidados",
    local: "Grumari, RJ",
    ano: 2024,
    destaque: "Estrutura coberta, DJ + banda com troca em 8 minutos, gerador silencioso na areia.",
  },
  {
    titulo: "Formatura Medicina UFRJ",
    categoria: "Formatura",
    publico: "2.400 pessoas",
    local: "Vivo Rio, RJ",
    ano: 2024,
    destaque: "Cerimônia + baile no mesmo espaço, transição de estrutura em 45 minutos.",
  },
  {
    titulo: "Show Nacional Turnê 2025",
    categoria: "Show",
    publico: "5.500 pessoas",
    local: "Jeunesse Arena, RJ",
    ano: 2025,
    destaque: "Backline completo, monitor in-ear para 7 músicos, alinhamento de sistema Smaart.",
  },
  {
    titulo: "Corporativo Fim de Ano Petro",
    categoria: "Corporativo",
    publico: "800 colaboradores",
    local: "Copacabana Palace, RJ",
    ano: 2024,
    destaque: "Palco em U, DJ residente, mesa 32 canais e captação de vídeo para pós-evento.",
  },
];

export type WmpDepoimento = {
  nome: string;
  cargo: string;
  texto: string;
  evento: string;
};

export const WMP_DEPOIMENTOS: WmpDepoimento[] = [
  {
    nome: "Fernanda Ribeiro",
    cargo: "Diretora de Eventos, Tech Corp",
    texto: "Contratamos a WMP para nossa convenção nacional. Do briefing à desmontagem, tudo cronometrado. O pré-diagnóstico acústico foi o diferencial: sabíamos exatamente o que esperar.",
    evento: "Convenção Nacional 2025",
  },
  {
    nome: "Rafael e Camila Torres",
    cargo: "Noivos",
    texto: "Casamento em Grumari — vento forte, areia, gerador. A WMP planejou tudo, com plano B por escrito. Nenhum imprevisto atrapalhou. Som impecável e luz emocionante.",
    evento: "Casamento Praia Grumari",
  },
  {
    nome: "Marcelo Andrade",
    cargo: "Produtor musical",
    texto: "Já trabalhei com dezenas de produtoras. A WMP é a única que entrega laudo de dB, ART e cronograma escrito antes do evento. Isso muda o jogo para quem opera profissionalmente.",
    evento: "Show Turnê 2025",
  },
];

export type WmpFaq = { pergunta: string; resposta: string };

export const WMP_FAQ: WmpFaq[] = [
  {
    pergunta: "Em quanto tempo recebo o orçamento?",
    resposta: "Enviamos proposta detalhada em até 24 horas úteis após o briefing. Para eventos com data em menos de 15 dias, respondemos em até 6 horas.",
  },
  {
    pergunta: "O que é o pré-diagnóstico acústico?",
    resposta: "Antes mesmo da visita técnica, calculamos potência de PA, subwoofer, microfones, monitores, iluminação e reverberação estimada a partir do seu briefing (público, ambiente, material, altura, estilo). Você já entra na conversa com a estrutura ideal proposta.",
  },
  {
    pergunta: "A WMP emite ART e laudo de decibéis?",
    resposta: "Sim. Emitimos Anotação de Responsabilidade Técnica (ART) via engenheiro parceiro e fazemos medição de pressão sonora (dB) durante o evento, respeitando os limites municipais do local.",
  },
  {
    pergunta: "Vocês atendem fora do Rio de Janeiro?",
    resposta: "Sim. Operamos em toda a Região Sudeste e viajamos para eventos de médio e grande porte em qualquer estado. Logística e diárias entram destacadas no orçamento.",
  },
  {
    pergunta: "Existe plano B para chuva ou queda de energia?",
    resposta: "Todo evento contratado recebe um plano de contingência por escrito: gerador de backup, cobertura alternativa, cronograma de recuo e responsáveis por decisão em campo.",
  },
  {
    pergunta: "Como funciona a rede de parceiros WMP?",
    resposta: "DJs, músicos, técnicos e fornecedores cadastrados são acionados em eventos compatíveis com perfil, cidade e disponibilidade. Contrato claro, cachê combinado antes e pagamento em até 7 dias após o evento.",
  },
  {
    pergunta: "Precisa pagar sinal para reservar a data?",
    resposta: "Sim. A reserva de data é confirmada com 30% de sinal + contrato assinado. O saldo é dividido em duas parcelas: 40% até 15 dias antes do evento e 30% na entrega.",
  },
  {
    pergunta: "Vocês trabalham com bandas e artistas convidados pelo cliente?",
    resposta: "Sim. Fornecemos backline completo (bateria, amplificadores, monitores in-ear) e nosso técnico FOH faz passagem de som com a banda contratada pelo cliente.",
  },
];

export const WMP_CERTIFICACOES = [
  { titulo: "ART CREA", desc: "Anotação de Responsabilidade Técnica emitida para todos os eventos de médio/grande porte." },
  { titulo: "Laudo de dB", desc: "Medição de pressão sonora conforme legislação municipal (Lei do Silêncio)." },
  { titulo: "Seguro operacional", desc: "Equipamentos e equipe cobertos por apólice específica de eventos." },
  { titulo: "Contrato claro", desc: "Escopo, prazos, forma de pagamento e plano B documentados antes da execução." },
];
