/**
 * Playbook estático por nicho — usado pelo cockpit unificado
 * `/nichos/$slug` para dar identidade e ações contextuais a cada
 * segmento pendente. Nichos já com produto dedicado (imobiliária,
 * cervejaria, etc.) redirecionam para suas próprias rotas.
 */

export interface NichePlaybookLink {
  label: string;
  to: string;
  description?: string;
}

export interface NichePlaybook {
  slug: string;
  headline: string;
  subhead: string;
  accent: "blue" | "amber" | "emerald" | "violet" | "rose" | "cyan";
  /** Rota dedicada existente. Se preenchida, /nichos/$slug redireciona. */
  redirectTo?: string;
  /** Cards de playbook: cada etapa do funil Impulsionando. */
  funnel: {
    captar: string[];
    converter: string[];
    relacionar: string[];
    reter: string[];
    expandir: string[];
  };
  /** Ações rápidas relevantes para o segmento. */
  quickLinks: NichePlaybookLink[];
}

// Cockpits com produto próprio — /nichos/$slug redireciona.
const DEDICATED_ROUTES: Record<string, string> = {
  imobiliaria: "/imobiliaria/imoveis",
  cervejarias: "/cervejaria",
  microcervejarias: "/cervejaria",
  eventos: "/eventos",
  bares: "/restaurante/salao",
  "contabilidade-inteligente": "/contabilidade/cockpit",
  comunidade: "/comunidade",
  "medico-hospitalar": "/riomed/minhas-garantias",
  saude: "/chrismed/admin",
};

const DEFAULT_PLAYBOOK: Omit<NichePlaybook, "slug" | "headline" | "subhead" | "accent"> = {
  funnel: {
    captar: [
      "Landing por nicho + formulário integrado a marketing_leads.",
      "Campanhas UTM segmentadas com anúncios pagos e conteúdo orgânico.",
    ],
    converter: [
      "Pipeline CRM dedicado com estágios do nicho.",
      "Régua de follow-up N8N 24h/72h/7d.",
    ],
    relacionar: [
      "Onboarding personalizado + Impulsionito como concierge.",
      "Base de conhecimento e comunicação omnichannel.",
    ],
    reter: [
      "Score de saúde do cliente + alertas de risco.",
      "Ciclo de sucesso: QBR mensal automatizado.",
    ],
    expandir: [
      "Cross-sell por módulo/plano baseado em uso real.",
      "Programa de indicação + comissionamento.",
    ],
  },
  quickLinks: [
    { label: "CRM — Oportunidades", to: "/crm/opportunities" },
    { label: "Leads de Marketing", to: "/marketing/leads" },
    { label: "Automação — Aprovações", to: "/core/automacao/aprovacoes" },
    { label: "Empresas do Nicho", to: "/core/tenants" },
  ],
};

const OVERRIDES: Record<
  string,
  { headline: string; subhead: string; accent: NichePlaybook["accent"]; funnel?: Partial<NichePlaybook["funnel"]>; quickLinks?: NichePlaybookLink[] }
> = {
  "marketing-tecnologia": {
    headline: "Marketing & Tecnologia",
    subhead: "Agências, SaaS e integradores usam o core Impulsionando como plataforma multi-cliente.",
    accent: "violet",
    funnel: {
      captar: [
        "Landing white-label + integração de captura via API pública.",
        "Programa de parceiros com atribuição UTM automática.",
      ],
      expandir: [
        "Revenue share por cliente onboarded e módulo ativo.",
        "Marketplace de templates entre agências parceiras.",
      ],
    },
    quickLinks: [
      { label: "White Label", to: "/dashboards/white-label" },
      { label: "Afiliados & Parceiros", to: "/afiliados" },
      { label: "API & Integrações", to: "/admin/integrations" },
      { label: "Automação — Modelos", to: "/core/automacao/modelos-nicho" },
    ],
  },
  servicos: {
    headline: "Empresas de Serviços",
    subhead: "Prestadores B2B e B2C — do agendamento à cobrança recorrente com fluxo unificado.",
    accent: "emerald",
    funnel: {
      converter: [
        "Agenda inteligente com regras por profissional/sala.",
        "Contratos digitais + assinatura eletrônica.",
      ],
      reter: [
        "NPS pós-serviço automatizado.",
        "Renovação recorrente de contratos com alerta 30/15/7 dias.",
      ],
    },
    quickLinks: [
      { label: "Agenda", to: "/agenda" },
      { label: "Contratos", to: "/contratos" },
      { label: "Financeiro", to: "/financeiro" },
      { label: "CRM — Leads", to: "/crm/leads" },
    ],
  },
  comercio: {
    headline: "Comércio e Varejo Físico",
    subhead: "PDV, estoque e clube de fidelidade unificados sob o core Impulsionando.",
    accent: "amber",
    funnel: {
      captar: [
        "QR code na loja → captura de lead + oferta imediata.",
        "Clube de fidelidade Impulsionando com pontos por visita.",
      ],
      reter: [
        "Campanhas de reengajamento por RFM (Recência-Frequência-Valor).",
        "Alertas de estoque parado e ruptura em tempo real.",
      ],
    },
    quickLinks: [
      { label: "PDV & Caixa", to: "/pdv" },
      { label: "Estoque", to: "/estoque" },
      { label: "Clube de Fidelidade", to: "/clube" },
      { label: "Consumidores", to: "/consumidores" },
    ],
  },
  ecommerce: {
    headline: "E-commerce e Varejo Digital",
    subhead: "Loja online, marketplace B2B e logística — Taxa de Intermediação Digital 0,50% padrão.",
    accent: "cyan",
    funnel: {
      captar: [
        "SEO + conteúdo por categoria com dados semrush integrados.",
        "Recuperação de carrinho abandonado em 15min/24h/72h.",
      ],
      converter: [
        "Checkout otimizado com múltiplos meios de pagamento.",
        "Frete calculado em tempo real por CEP.",
      ],
      expandir: [
        "Marketplace B2B — GMV como KPI principal.",
        "Cross-sell no pós-compra e upsell no checkout.",
      ],
    },
    quickLinks: [
      { label: "Marketplace B2B", to: "/marketplace" },
      { label: "Pedidos", to: "/pedidos" },
      { label: "Logística", to: "/logistica" },
      { label: "Carrinhos Abandonados", to: "/commerce/abandoned-carts" },
    ],
  },
};

export function getNichePlaybook(slug: string, name: string): NichePlaybook {
  const redirect = DEDICATED_ROUTES[slug];
  if (redirect) {
    return {
      slug,
      headline: name,
      subhead: "Este nicho já possui produto dedicado.",
      accent: "blue",
      redirectTo: redirect,
      ...DEFAULT_PLAYBOOK,
    };
  }
  const over = OVERRIDES[slug];
  if (over) {
    return {
      slug,
      headline: over.headline,
      subhead: over.subhead,
      accent: over.accent,
      funnel: {
        captar: over.funnel?.captar ?? DEFAULT_PLAYBOOK.funnel.captar,
        converter: over.funnel?.converter ?? DEFAULT_PLAYBOOK.funnel.converter,
        relacionar: over.funnel?.relacionar ?? DEFAULT_PLAYBOOK.funnel.relacionar,
        reter: over.funnel?.reter ?? DEFAULT_PLAYBOOK.funnel.reter,
        expandir: over.funnel?.expandir ?? DEFAULT_PLAYBOOK.funnel.expandir,
      },
      quickLinks: over.quickLinks ?? DEFAULT_PLAYBOOK.quickLinks,
    };
  }
  // Nicho ainda não catalogado: cockpit genérico, funciona sempre.
  return {
    slug,
    headline: name,
    subhead: "Cockpit genérico do core Impulsionando. Personalize o playbook em /admin/nichos.",
    accent: "blue",
    ...DEFAULT_PLAYBOOK,
  };
}

export const ACCENT_CLASSES: Record<NichePlaybook["accent"], { bar: string; badge: string; text: string }> = {
  blue: { bar: "border-l-blue-500", badge: "bg-blue-500/10 text-blue-600", text: "text-blue-600 dark:text-blue-400" },
  amber: { bar: "border-l-amber-500", badge: "bg-amber-500/10 text-amber-600", text: "text-amber-600 dark:text-amber-400" },
  emerald: { bar: "border-l-emerald-500", badge: "bg-emerald-500/10 text-emerald-600", text: "text-emerald-600 dark:text-emerald-400" },
  violet: { bar: "border-l-violet-500", badge: "bg-violet-500/10 text-violet-600", text: "text-violet-600 dark:text-violet-400" },
  rose: { bar: "border-l-rose-500", badge: "bg-rose-500/10 text-rose-600", text: "text-rose-600 dark:text-rose-400" },
  cyan: { bar: "border-l-cyan-500", badge: "bg-cyan-500/10 text-cyan-600", text: "text-cyan-600 dark:text-cyan-400" },
};
