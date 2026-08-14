/**
 * Catálogo institucional CHRISMED usado pela experiência pública.
 *
 * IMPORTANTE:
 * - este arquivo NÃO representa disponibilidade de agenda;
 * - horários, bloqueios e reservas são sempre lidos do backend/Supabase;
 * - preços e durações são lidos de chrismed_service_offerings;
 * - a agenda pública usa list_chrismed_available_slots.
 */

export type ChrismedModality =
  | 'presencial'
  | 'telemedicina'
  | 'domiciliar'
  | 'retorno'
  | 'ocupacional'
  | 'pericia';

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
  blockedBy?: {
    modality: ChrismedModality;
    time: string;
    state: Extract<ChrismedSlotState, 'unavailable' | 'held'>;
  };
};

export type ChrismedDay = {
  iso: string;
  state: 'available' | 'unavailable' | 'empty';
  slots: ChrismedSlot[];
};

export const CHRISMED_SPECIALTIES: ChrismedSpecialty[] = [
  {
    slug: 'gastroenterologia',
    name: 'Gastroenterologia',
    short: 'Sistema digestivo, refluxo, endoscopia',
    icon: 'stethoscope',
  },
  {
    slug: 'hepatologia',
    name: 'Hepatologia',
    short: 'Fígado, vias biliares e hepatites',
    icon: 'stethoscope',
  },
  {
    slug: 'clinica-medica',
    name: 'Clínica Médica',
    short: 'Diagnóstico geral e acompanhamento',
    icon: 'stethoscope',
  },
  {
    slug: 'medicina-do-trabalho',
    name: 'Medicina Ocupacional',
    short: 'ASO presencial e atendimento pericial (laudos)',
    icon: 'briefcase',
  },
  {
    slug: 'medicina-internacional',
    name: 'International Medical Care · GMS',
    short: 'Atendimento em PT · EN · ES para viajantes e consulados',
    icon: 'plane',
  },
];

export const CHRISMED_UNITS: ChrismedUnit[] = [
  {
    slug: 'copacabana',
    name: 'Consultório Copacabana',
    address: 'Endereço enviado após confirmação',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
  },
  {
    slug: 'telemedicina',
    name: 'Teleconsulta (vídeo)',
    address: 'Link seguro enviado após confirmação',
    neighborhood: '—',
    city: '—',
  },
  {
    slug: 'domiciliar',
    name: 'Domiciliar (a definir)',
    address: 'Endereço informado pelo paciente',
    neighborhood: '—',
    city: '—',
  },
];

/**
 * Catálogo editorial da profissional atualmente destacada no site.
 * Elegibilidade e disponibilidade pública continuam validadas pelo backend.
 */
export const CHRISMED_DOCTORS: ChrismedDoctor[] = [
  {
    slug: 'dra-christiane-alencar',
    name: 'Dra. Christiane Alencar',
    title: 'Gastroenterologia · Hepatologia · Clínica Médica · Medicina Ocupacional · GMS',
    crm: 'CRM/RJ 52.58575-0',
    bio: 'Médica formada pela UFRJ, +30 anos de experiência e +80.000 atendimentos. Direção técnica da CHRISMED, atendimento pericial (laudos para Justiça e Previdência) e emissão de ASO presencial.',
    specialtySlugs: [
      'gastroenterologia',
      'hepatologia',
      'clinica-medica',
      'medicina-do-trabalho',
      'medicina-internacional',
    ],
    modalities: ['presencial', 'telemedicina', 'domiciliar', 'retorno', 'ocupacional', 'pericia'],
    unitSlugs: ['copacabana', 'telemedicina', 'domiciliar'],
  },
];
