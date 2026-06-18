/**
 * Niche-aware plans: same Essencial/Ideal/Full structure, but the modules
 * change per macro nicho. Core Base is shared across every niche.
 */

export const CORE_BASE = [
  'Área do Cliente',
  'Portal do Cliente',
  'Usuários Ilimitados',
  'Perfis e Permissões',
  'CRM',
  'Financeiro Básico',
  'WhatsApp',
  'E-mail',
  'Dashboard',
  'Relatórios Básicos',
  'LGPD',
  'API e Webhooks',
] as const;

export type PlanTier = 'essencial' | 'ideal' | 'full';

export interface NichePlanSpec {
  /** Modules the client picks 1 of, in Essencial. */
  essencialChoose1: string[];
  /** Modules available in Ideal (pick up to 3). */
  idealChoose3: string[];
  /** Headline for the Full plan ("Todos os módulos de ..."). */
  fullLabel: string;
}

/**
 * Keys must match `core_macro_nichos.slug`.
 * Subnichos that don't fit the macro default can override via subnichoOverrides.
 */
export const PLANS_BY_MACRO: Record<string, NichePlanSpec> = {
  saude: {
    essencialChoose1: ['Agenda', 'Prontuário Eletrônico', 'Teleconsulta', 'CRM Saúde'],
    idealChoose3: [
      'Agenda', 'Prontuário', 'Teleconsulta', 'CRM', 'Prescrição', 'Exames', 'Faturamento',
    ],
    fullLabel: 'Todos os módulos da Saúde',
  },
  imobiliario: {
    essencialChoose1: ['CRM Imobiliário', 'Vitrine Imobiliária', 'Captação', 'Locação'],
    idealChoose3: ['CRM', 'Vitrine', 'Locação', 'Visitas', 'Funis', 'Propostas'],
    fullLabel: 'Todos os módulos imobiliários',
  },
  alimentacao: {
    essencialChoose1: ['PDV', 'Cardápio Digital', 'Reservas', 'Delivery'],
    idealChoose3: ['PDV', 'Delivery', 'Eventos', 'Clube', 'Fidelidade', 'Reservas', 'QR Code'],
    fullLabel: 'Todos os módulos de Alimentação e Bebidas',
  },
  fornecedores: {
    essencialChoose1: ['Catálogo Digital', 'Pedidos B2B', 'CRM Comercial', 'Estoque'],
    idealChoose3: ['Catálogo', 'Pedidos B2B', 'Estoque', 'Produção', 'CRM Comercial', 'Faturamento'],
    fullLabel: 'Todos os módulos de Fornecedores',
  },
  servicos: {
    essencialChoose1: ['Agenda', 'CRM', 'Contratos', 'Propostas'],
    idealChoose3: ['Agenda', 'CRM', 'Contratos', 'Propostas', 'Projetos', 'Time Tracking', 'Faturamento'],
    fullLabel: 'Todos os módulos de Serviços',
  },
  educacao: {
    essencialChoose1: ['Matrículas', 'Sala Virtual', 'CRM Acadêmico', 'Financeiro Educacional'],
    idealChoose3: ['Matrículas', 'Sala Virtual', 'Notas', 'Frequência', 'CRM', 'Polos', 'Certificados'],
    fullLabel: 'Todos os módulos de Educação',
  },
  eventos: {
    essencialChoose1: ['Ingressos', 'Check-in', 'CRM de Eventos', 'Vitrine de Eventos'],
    idealChoose3: ['Ingressos', 'Check-in', 'Patrocinadores', 'Programação', 'Credenciamento', 'Streaming'],
    fullLabel: 'Todos os módulos de Eventos',
  },
};

export const PLAN_TIERS: { tier: PlanTier; name: string; price: string; tagline: string }[] = [
  {
    tier: 'essencial',
    name: 'Essencial',
    price: '0,5 Salário Mínimo',
    tagline: 'Para começar a operar com o essencial do seu nicho.',
  },
  {
    tier: 'ideal',
    name: 'Ideal',
    price: '1 Salário Mínimo',
    tagline: 'O equilíbrio recomendado para a maioria das operações.',
  },
  {
    tier: 'full',
    name: 'Full',
    price: '2 Salários Mínimos',
    tagline: 'Todos os módulos do nicho, sem limites.',
  },
];
