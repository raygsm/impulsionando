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
export type ChrismedSlot = {
  id: string;
  time: string;
  state: ChrismedSlotState;
  occurrence: number;
  startsAtMinutes: number;
  endsAtMinutes: number;
  endTime: string;
  blockedBy?: { modality: ChrismedModality; time: string; state: Extract<ChrismedSlotState, 'unavailable' | 'held'> };
};
export type ChrismedDay = {
  iso: string; // YYYY-MM-DD
  state: 'available' | 'unavailable' | 'empty';
  slots: ChrismedSlot[];
};

/**
 * CHRISMED opera hoje exclusivamente com a Dra. Christiane Alencar.
 * Especialidades e médicos parceiros (Cardiologia, Pediatria, Saúde Mental,
 * Dermatologia, Ginecologia, Ortopedia) NÃO devem aparecer na jornada —
 * quando/se forem contratados, cada um passa a ter perfil próprio.
 */
export const CHRISMED_SPECIALTIES: ChrismedSpecialty[] = [
  { slug: 'gastroenterologia', name: 'Gastroenterologia', short: 'Sistema digestivo, refluxo, endoscopia', icon: 'stethoscope' },
  { slug: 'hepatologia', name: 'Hepatologia', short: 'Fígado, vias biliares e hepatites', icon: 'stethoscope' },
  { slug: 'clinica-medica', name: 'Clínica Médica', short: 'Diagnóstico geral e acompanhamento', icon: 'stethoscope' },
  { slug: 'medicina-do-trabalho', name: 'Medicina Ocupacional', short: 'ASO presencial e atendimento pericial (laudos)', icon: 'briefcase' },
  { slug: 'medicina-internacional', name: 'International Medical Care · GMS', short: 'Atendimento em PT · EN · ES para viajantes e consulados', icon: 'plane' },
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
    title: 'Gastroenterologia · Hepatologia · Clínica Médica · Medicina Ocupacional · GMS',
    crm: 'CRM/RJ 52.58575-0',
    bio: 'Médica formada pela UFRJ, +30 anos de experiência e +80.000 atendimentos. Direção técnica da CHRISMED, atendimento pericial (laudos para Justiça e Previdência) e emissão de ASO presencial.',
    specialtySlugs: ['gastroenterologia', 'hepatologia', 'clinica-medica', 'medicina-do-trabalho', 'medicina-internacional'],
    modalities: ['presencial', 'telemedicina', 'domiciliar', 'retorno'],
    unitSlugs: ['copacabana', 'telemedicina', 'domiciliar'],
  },
];

/**
 * Gera 42 dias a partir de hoje, com padrão determinístico para o mock:
 * - domingo: sem agenda ("empty")
 * - sábado: metade dos horários
 * - dias úteis: agenda cheia com alguns horários indisponíveis
 */
/**
 * Grades oficiais por dia da semana × modalidade (fonte: direção clínica CHRISMED).
 *
 * dow: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
 *
 * Teleconsulta:
 *   Seg  → 18:45, 19:15, 19:45, 20:15
 *   Ter  → 14:50, 15:20, 15:50, 15:50, 16:20, 16:50, 17:20, 17:50, 18:20
 *   Qua  → 18:45, 10:15, 19:45, 20:15
 *   Qui  → 18:45, 19:15, 19:45, 20:15
 *   Sex  → 08:30, 09:00, 09:30, 10:00, 10:30
 *   Sáb  → 08:00, 08:30, 09:00, 09:30, 10:00, 10:30
 *
 * Presencial (Consultório): só Ter e Sex, nos mesmos horários da tele.
 * Domiciliar: Ter a Sáb, nos mesmos horários da tele/presencial.
 * Retorno: espelha os horários da teleconsulta.
 *
 * Bloqueio cruzado: se um horário é reservado numa modalidade, ele deve
 * aparecer indisponível nas demais. Aqui o mock aplica um seed determinístico
 * comum (dow+time), garantindo que o mesmo horário fica ocupado em todas as
 * modalidades — reproduzindo a regra "uma agenda física por médico".
 */
export const CHRISMED_DEFAULT_DURATION_MINUTES: Record<ChrismedModality, number> = {
  presencial: 30,
  telemedicina: 30,
  domiciliar: 60,
  retorno: 30,
};

export const CHRISMED_OFFICIAL_TELE_GRID: Record<number, string[]> = {
  0: [],
  1: ['18:45', '19:15', '19:45', '20:15'],
  2: ['14:50', '15:20', '15:50', '15:50', '16:20', '16:50', '17:20', '17:50', '18:20'],
  3: ['18:45', '10:15', '19:45', '20:15'],
  4: ['18:45', '19:15', '19:45', '20:15'],
  5: ['08:30', '09:00', '09:30', '10:00', '10:30'],
  6: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'],
};

export function getChrismedOfficialTimes(modality: ChrismedModality | null, dow: number): string[] {
  const base = CHRISMED_OFFICIAL_TELE_GRID[dow] ?? [];
  if (!modality || modality === 'telemedicina' || modality === 'retorno') return base;
  if (modality === 'presencial') return dow === 2 || dow === 5 ? base : [];
  if (modality === 'domiciliar') return dow >= 2 && dow <= 6 ? base : [];
  return base;
}

function parseTimeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function formatMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeTimes(times: string[]): Array<{ id: string; time: string; occurrence: number; startsAtMinutes: number }> {
  const occurrences = new Map<string, number>();
  return times.map((time, index) => {
    const occurrence = (occurrences.get(time) ?? 0) + 1;
    occurrences.set(time, occurrence);
    return {
      id: `${time}#${occurrence}@${index}`,
      time,
      occurrence,
      startsAtMinutes: parseTimeToMinutes(time),
    };
  });
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildChrismedMockCalendar(
  options: {
    startDate?: Date;
    modality?: ChrismedModality | null;
    specialtySlug?: string | null;
    durationMinutesByModality?: Partial<Record<ChrismedModality, number>>;
  } = {},
): ChrismedDay[] {
  const { startDate = new Date(), modality = null, durationMinutesByModality = {} } = options;
  const durationByModality = { ...CHRISMED_DEFAULT_DURATION_MINUTES, ...durationMinutesByModality };
  const days: ChrismedDay[] = [];
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    const normalizedTimes = normalizeTimes(getChrismedOfficialTimes(modality, dow));

    if (normalizedTimes.length === 0 || !modality) {
      days.push({ iso, state: 'empty', slots: [] });
      continue;
    }

    const occupiedIntervals = (['presencial', 'telemedicina', 'domiciliar', 'retorno'] as ChrismedModality[])
      .flatMap((sourceModality) => normalizeTimes(getChrismedOfficialTimes(sourceModality, dow)).map((slot) => {
        const seededState = hashCode(`${iso}|${slot.time}`) % 7;
        if (seededState !== 0 && seededState !== 1) return null;
        const start = slot.startsAtMinutes;
        return {
          modality: sourceModality,
          time: slot.time,
          start,
          end: start + durationByModality[sourceModality],
          state: seededState === 0 ? 'unavailable' as const : 'held' as const,
        };
      }))
      .filter((interval): interval is NonNullable<typeof interval> => Boolean(interval));

    const slots: ChrismedSlot[] = normalizedTimes.map((slot) => {
      const start = slot.startsAtMinutes;
      const end = start + durationByModality[modality];
      const blockingInterval = occupiedIntervals.find((interval) => overlaps(start, end, interval.start, interval.end));
      const state: ChrismedSlotState = blockingInterval
        ? (blockingInterval.start === start && blockingInterval.state === 'held' ? 'held' : 'unavailable')
        : 'available';
      return {
        id: `${iso}|${modality}|${slot.id}`,
        time: slot.time,
        state,
        occurrence: slot.occurrence,
        startsAtMinutes: start,
        endsAtMinutes: end,
        endTime: formatMinutes(end),
        blockedBy: blockingInterval
          ? { modality: blockingInterval.modality, time: blockingInterval.time, state: blockingInterval.state }
          : undefined,
      };
    });

    const hasAvailable = slots.some((s) => s.state === 'available');
    days.push({ iso, state: hasAvailable ? 'available' : 'unavailable', slots });
  }

  return days;
}


