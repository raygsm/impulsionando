/**
 * Mocks visuais CrisMed — Wave 1 (frontend-only).
 *
 * ATENÇÃO: dados aqui são apresentados APENAS para viabilizar a UX
 * do fluxo público de agendamento (especialidade → médico → modalidade →
 * unidade → calendário → horário). Nenhum destes dados representa agenda
 * real, disponibilidade real ou reserva real. Todos os itens carregam
 * `isMock: true` e a UI mostra selo "Pendente Codex" onde aplicável.
 *
 * Codex substitui por dados reais quando os endpoints V4
 * (offerings, professionals, availability, hold) estiverem prontos.
 */

export const CHRISMED_MOCK_NOTICE =
  'Dados de demonstração — agenda, médicos e horários definitivos serão fornecidos pelo backend (Codex).';

export type ChrismedModality = 'presencial' | 'telemedicina' | 'domiciliar' | 'retorno';

export type ChrismedSpecialty = {
  slug: string;
  name: string;
  short: string;
  icon: 'stethoscope' | 'heart' | 'briefcase' | 'baby' | 'brain' | 'plane';
};

export type ChrismedDoctor = {
  slug: string;
  name: string;
  title: string;
  crm: string;
  bio: string;
  specialtySlugs: string[];
  modalities: ChrismedModality[];
  unitSlugs: string[];
};

export type ChrismedUnit = {
  slug: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
};

export type ChrismedSlotState = 'available' | 'unavailable' | 'held' | 'past';
export type ChrismedSlot = { time: string; state: ChrismedSlotState };
export type ChrismedDay = {
  iso: string; // YYYY-MM-DD
  state: 'available' | 'unavailable' | 'empty';
  slots: ChrismedSlot[];
};

export const CHRISMED_SPECIALTIES: ChrismedSpecialty[] = [
  { slug: 'gastroenterologia', name: 'Gastroenterologia', short: 'Sistema digestivo, refluxo, endoscopia', icon: 'stethoscope' },
  { slug: 'hepatologia', name: 'Hepatologia', short: 'Fígado, vias biliares e hepatites', icon: 'stethoscope' },
  { slug: 'clinica-medica', name: 'Clínica Médica', short: 'Diagnóstico geral e acompanhamento', icon: 'stethoscope' },
  { slug: 'medicina-do-trabalho', name: 'Medicina do Trabalho', short: 'ASO e atendimento pericial', icon: 'briefcase' },
  { slug: 'cardiologia', name: 'Cardiologia', short: 'Saúde do coração e pressão arterial', icon: 'heart' },
  { slug: 'pediatria', name: 'Pediatria', short: 'Consulta e acompanhamento infantil', icon: 'baby' },
  { slug: 'saude-mental', name: 'Saúde Mental', short: 'Acolhimento e encaminhamento clínico', icon: 'brain' },
  { slug: 'medicina-internacional', name: 'Medicina Internacional', short: 'Atendimento em PT/EN/ES para viajantes', icon: 'plane' },
];

export const CHRISMED_UNITS: ChrismedUnit[] = [
  { slug: 'copacabana', name: 'Consultório Copacabana', address: 'Endereço enviado após confirmação', neighborhood: 'Copacabana', city: 'Rio de Janeiro' },
  { slug: 'telemedicina', name: 'Teleconsulta (vídeo)', address: 'Link seguro enviado após confirmação', neighborhood: '—', city: '—' },
  { slug: 'domiciliar', name: 'Domiciliar (a definir)', address: 'Endereço informado pelo paciente', neighborhood: '—', city: '—' },
];

export const CHRISMED_DOCTORS: ChrismedDoctor[] = [
  {
    slug: 'dra-cristiane-alencar',
    name: 'Dra. Christiane Alencar',
    title: 'Gastroenterologia · Hepatologia · Clínica Médica · Medicina Ocupacional',
    crm: 'CRM/RJ · UFRJ',
    bio: 'Médica formada pela UFRJ, +30 anos de experiência e +80.000 atendimentos. Atendimento pericial (laudos para Justiça e Previdência) e emissão de ASO na modalidade ocupacional.',
    specialtySlugs: ['gastroenterologia', 'hepatologia', 'clinica-medica', 'medicina-do-trabalho'],
    modalities: ['presencial', 'telemedicina', 'domiciliar', 'retorno'],
    unitSlugs: ['copacabana', 'telemedicina', 'domiciliar'],
  },
  {
    slug: 'equipe-cardio',
    name: 'Cardiologia parceira',
    title: 'Cardiologia · rede de confiança CrisMed',
    crm: 'Pendente Codex',
    bio: 'Time cardiológico parceiro para exames, avaliação de risco e acompanhamento contínuo.',
    specialtySlugs: ['cardiologia'],
    modalities: ['presencial', 'telemedicina'],
    unitSlugs: ['copacabana', 'telemedicina'],
  },
  {
    slug: 'pediatria-parceira',
    name: 'Pediatria parceira',
    title: 'Pediatria · rede de confiança CrisMed',
    crm: 'Pendente Codex',
    bio: 'Encaminhamento pediátrico dentro da rede curada pela Dra. Cristiane Alencar.',
    specialtySlugs: ['pediatria'],
    modalities: ['presencial', 'telemedicina'],
    unitSlugs: ['copacabana', 'telemedicina'],
  },
];

/**
 * Gera 42 dias a partir de hoje, com padrão determinístico para o mock:
 * - domingo: sem agenda ("empty")
 * - sábado: metade dos horários
 * - dias úteis: agenda cheia com alguns horários indisponíveis
 */
export function buildChrismedMockCalendar(startDate: Date = new Date()): ChrismedDay[] {
  const days: ChrismedDay[] = [];
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);

  const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  for (let i = 0; i < 42; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);

    if (dow === 0) {
      days.push({ iso, state: 'empty', slots: [] });
      continue;
    }

    const slots: ChrismedSlot[] = times.map((t, idx) => {
      // padrão determinístico para variar disponibilidade
      const seed = (i * 7 + idx) % 5;
      if (dow === 6 && idx > 3) return { time: t, state: 'unavailable' };
      if (seed === 0) return { time: t, state: 'unavailable' };
      if (seed === 1 && idx === 2) return { time: t, state: 'held' };
      return { time: t, state: 'available' };
    });

    const hasAvailable = slots.some((s) => s.state === 'available');
    days.push({ iso, state: hasAvailable ? 'available' : 'unavailable', slots });
  }

  return days;
}
