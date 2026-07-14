import type { FictionalBrand } from "./types";

export const institutoVitalis: FictionalBrand = {
  slug: "instituto-vitalis",
  companyName: "Instituto Vitalis",
  tagline: "Medicina integrada, cuidado sem pressa.",
  domainFake: "institutovitalis.com.br",
  sector: "saude",
  sectorLabel: "Saúde · Multiespecialidade",
  palette: {
    primary: "#0F5C4B",
    primaryFg: "#F4FBF8",
    accent: "#D4A24C",
    surface: "#F7F5EF",
    ink: "#0B221D",
    muted: "#5B6C67",
    heroGradient: "linear-gradient(135deg,#0F5C4B 0%,#1B7F68 55%,#D4A24C 100%)",
  },
  typography: {
    heading: '"Fraunces", "Playfair Display", ui-serif, Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  logo: {
    mark: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3c4.2 3.6 7 7.5 7 12.3 0 5-3.4 9.3-7 13.7-3.6-4.4-7-8.7-7-13.7C9 10.5 11.8 6.6 16 3z" fill="currentColor"/><circle cx="16" cy="15" r="3" fill="#fff"/></svg>`,
    wordmark: "Vitalis",
  },
  hero: {
    eyebrow: "Centro clínico integrado",
    title: "Sua saúde tratada com tempo, ciência e humanidade.",
    subtitle:
      "Consultas sem correria, exames no mesmo endereço e prontuário digital acessível a qualquer hora. Uma equipe multidisciplinar para cuidar da sua família.",
    primaryCta: { label: "Agendar consulta", to: "contato" },
    secondaryCta: { label: "Ver especialidades", to: "catalogo" },
    stats: [
      { label: "Pacientes ativos", value: "12,4 mil" },
      { label: "Especialidades", value: "24" },
      { label: "NPS", value: "92" },
      { label: "Anos de atuação", value: "17" },
    ],
    imageGradient: "linear-gradient(160deg,#0F5C4B 0%,#1B7F68 45%,#D4A24C 100%)",
    imageEmoji: "🩺",
  },
  highlights: [
    { icon: "heart", title: "Consultas de 40 minutos", text: "Tempo real para escutar você, sem cronômetro." },
    { icon: "shield", title: "Prontuário criptografado", text: "Acesso seguro pelo app, você é dono dos seus dados." },
    { icon: "clock", title: "Exames no mesmo dia", text: "Laboratório e imagem integrados ao consultório." },
    { icon: "sparkle", title: "Equipe multidisciplinar", text: "Médicos, nutrição, psicologia e fisioterapia juntos." },
  ],
  catalog: {
    label: "Especialidades",
    categories: [
      { id: "todos", label: "Todas" },
      { id: "clinica", label: "Clínica" },
      { id: "diagnostico", label: "Diagnóstico" },
      { id: "bem-estar", label: "Bem-estar" },
    ],
    items: [
      { id: "v1", name: "Cardiologia preventiva", category: "clinica", priceLabel: "R$ 320", description: "Avaliação de risco cardiovascular com ecocardiograma incluso.", highlight: "Mais agendado", imageGradient: "linear-gradient(135deg,#0F5C4B,#4CA98F)", emoji: "❤️" },
      { id: "v2", name: "Check-up executivo", category: "diagnostico", priceLabel: "R$ 1.290", description: "Bateria completa em 4 horas: exames, imagem e devolutiva médica.", imageGradient: "linear-gradient(135deg,#123f36,#D4A24C)", emoji: "🧪" },
      { id: "v3", name: "Pediatria integrada", category: "clinica", priceLabel: "R$ 280", description: "Consulta com pediatra + orientação nutricional infantil.", imageGradient: "linear-gradient(135deg,#1B7F68,#F1D89B)", emoji: "🧸" },
      { id: "v4", name: "Psicoterapia semanal", category: "bem-estar", priceLabel: "R$ 210/sessão", description: "Atendimento com psicólogos clínicos, online ou presencial.", imageGradient: "linear-gradient(135deg,#0F5C4B,#8ABBA9)", emoji: "🧠" },
      { id: "v5", name: "Ressonância aberta", category: "diagnostico", priceLabel: "R$ 890", description: "Equipamento de última geração, laudo em 24 horas.", imageGradient: "linear-gradient(135deg,#2b6a5c,#e8c987)", emoji: "🧲" },
      { id: "v6", name: "Nutrição funcional", category: "bem-estar", priceLabel: "R$ 240", description: "Plano alimentar personalizado com acompanhamento mensal.", imageGradient: "linear-gradient(135deg,#3d8f79,#FBEBBF)", emoji: "🥗" },
      { id: "v7", name: "Ginecologia", category: "clinica", priceLabel: "R$ 300", description: "Consulta com exames preventivos e planejamento reprodutivo.", imageGradient: "linear-gradient(135deg,#0F5C4B,#F5D68A)", emoji: "🌸" },
      { id: "v8", name: "Fisioterapia esportiva", category: "bem-estar", priceLabel: "R$ 180/sessão", description: "Reabilitação e prevenção com fisioterapeutas especializados.", imageGradient: "linear-gradient(135deg,#1B7F68,#D4A24C)", emoji: "🏃" },
    ],
  },
  about: {
    story:
      "Fundado em 2008 por um grupo de médicos que acreditava numa medicina mais próxima, o Vitalis nasceu com a proposta de unir tempo, tecnologia e afeto. Hoje somos referência regional em atendimento integrado, com corpo clínico de 60 profissionais e mais de 12 mil pacientes acompanhados anualmente.",
    mission:
      "Oferecer cuidado clínico de alta qualidade sem transformar o paciente em número — respeitando escuta, evidência científica e continuidade de tratamento.",
    values: [
      { title: "Escuta ativa", text: "Cada consulta começa entendendo o que trouxe você até aqui." },
      { title: "Evidência", text: "Protocolos baseados nas melhores diretrizes internacionais." },
      { title: "Continuidade", text: "Um médico de referência que conhece sua história." },
    ],
    team: [
      { name: "Dra. Helena Serrano", role: "Diretora clínica · Cardiologista", bio: "20 anos de experiência em prevenção cardiovascular. Mestre pela USP.", initials: "HS", accent: "#0F5C4B" },
      { name: "Dr. Rafael Andrade", role: "Coordenador de diagnóstico", bio: "Radiologista com especialização em ressonância aberta pediátrica.", initials: "RA", accent: "#D4A24C" },
      { name: "Dra. Camila Lyra", role: "Pediatria integrada", bio: "Atende famílias há 12 anos com foco em desenvolvimento infantil.", initials: "CL", accent: "#1B7F68" },
      { name: "Beatriz Toledo", role: "Nutrição funcional", bio: "Constrói planos alimentares reais, sem restrições impossíveis.", initials: "BT", accent: "#8ABBA9" },
    ],
  },
  testimonials: [
    { author: "Marcos R.", role: "Paciente há 4 anos", quote: "Sinto que sou lembrado. A Dra. Helena sabe minha história sem precisar reler tudo.", rating: 5 },
    { author: "Família Souza", role: "Pediatria", quote: "A consulta de 40 minutos muda tudo. Nunca saímos com dúvidas.", rating: 5 },
    { author: "Ana P.", role: "Check-up executivo", quote: "Fiz o check-up completo em uma manhã. No dia seguinte já tinha devolutiva.", rating: 5 },
  ],
  faq: [
    { question: "Vocês atendem convênios?", answer: "Trabalhamos com particulares e os principais planos regionais. Consulte a lista atualizada na recepção." },
    { question: "Como funciona o prontuário digital?", answer: "Após a primeira consulta você recebe acesso ao app com histórico, exames, receitas e canal direto com sua equipe." },
    { question: "Posso remarcar sem custo?", answer: "Sim, até 12 horas antes da consulta pelo app ou WhatsApp." },
  ],
  contact: {
    whatsapp: "(11) 4002-8922",
    email: "contato@institutovitalis.com.br",
    phone: "+55 11 4002-8922",
    address: "Rua das Acácias, 480 · Jardim Europa · São Paulo/SP",
    hours: "Seg a Sex, 7h às 21h · Sáb, 8h às 14h",
  },
  admin: {
    kpis: [
      { label: "Consultas hoje", value: "84", hint: "+12% vs média" },
      { label: "Ocupação da agenda", value: "91%" },
      { label: "Ticket médio", value: "R$ 412" },
      { label: "NPS 30d", value: "92" },
    ],
    appointments: [
      { id: "a1", patient: "Marcos Rodrigues", service: "Cardiologia preventiva", when: "Hoje · 09:20", professional: "Dra. Helena" },
      { id: "a2", patient: "Ana Paula Serra", service: "Check-up executivo", when: "Hoje · 10:00", professional: "Dr. Rafael" },
      { id: "a3", patient: "Família Souza (Enzo)", service: "Pediatria integrada", when: "Hoje · 11:15", professional: "Dra. Camila" },
      { id: "a4", patient: "Renata Vieira", service: "Nutrição funcional", when: "Hoje · 14:30", professional: "Beatriz Toledo" },
      { id: "a5", patient: "Carlos Henrique", service: "Fisioterapia esportiva", when: "Hoje · 16:00", professional: "Equipe Fisio" },
    ],
    funnel: [
      { stage: "Contatos", value: 340 },
      { stage: "Qualificados", value: 210 },
      { stage: "Agendados", value: 168 },
      { stage: "Compareceram", value: 152 },
    ],
    revenue: [
      { month: "Mar", value: 182000 },
      { month: "Abr", value: 194500 },
      { month: "Mai", value: 210300 },
      { month: "Jun", value: 226800 },
    ],
  },
};
