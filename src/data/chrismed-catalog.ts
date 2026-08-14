/**
 * Catalogo institucional CHRISMED usado pela experiencia publica.
 *
 * IMPORTANTE:
 * - este arquivo NAO representa disponibilidade de agenda;
 * - horarios, bloqueios e reservas sao sempre lidos do backend/Supabase;
 * - precos e duracoes sao lidos de chrismed_service_offerings;
 * - a agenda publica usa list_chrismed_available_slots.
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
    short: 'Figado, vias biliares e hepatites',
    icon: 'stethoscope',
  },
  {
    slug: 'clinica-medica',
    name: 'Clinica Medica',
    short: 'Diagnostico geral e acompanhamento',
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
    name: 'Consultorio Copacabana',
    address: 'Endereco enviado apos confirmacao',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
  },
  {
    slug: 'telemedicina',
    name: 'Teleconsulta (video)',
    address: 'Link seguro enviado apos confirmacao',
    neighborhood: '—',
    city: '—',
  },
  {
    slug: 'domiciliar',
    name: 'Domiciliar (a definir)',
    address: 'Endereco informado pelo paciente',
    neighborhood: '—',
    city: '—',
  },
];

/**
 * Catalogo editorial da profissional atualmente destacada no site.
 * Elegibilidade e disponibilidade publica continuam validadas pelo backend.
 */
export const CHRISMED_DOCTORS: ChrismedDoctor[] = [
  {
    slug: 'dra-christiane-alencar',
    name: 'Dra. Christiane Alencar',
    title: 'Gastroenterologia · Hepatologia · Clinica Medica · Medicina Ocupacional · GMS',
    crm: 'CRM/RJ 52.58575-0',
    bio: 'Medica formada pela UFRJ, +30 anos de experiencia e +80.000 atendimentos. Direcao tecnica da CHRISMED, atendimento pericial (laudos para Justica e Previdencia) e emissao de ASO presencial.',
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
