import type { LucideIcon } from "lucide-react";
import { Gauge, MessageSquare, Boxes, TrendingUp, Settings } from "lucide-react";

export interface AreaLink {
  label: string;
  to: string;
}

export interface Area {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: "primary" | "accent" | "secondary";
  links: AreaLink[];
}

/**
 * Navegação empresarial canônica da Impulsionando.
 *
 * Regra definitiva: cliente/empresa/white label enxerga somente cinco hubs.
 * As rotas especializadas continuam existindo e podem ser encontradas pelos
 * hubs, busca global e permissões, mas não poluem mais a navegação principal.
 */
export const NAVIGATION_AREAS: Area[] = [
  {
    key: "gestao",
    label: "Gestão",
    description: "Operação diária, agenda, financeiro, equipe, suporte e indicadores.",
    icon: Gauge,
    accent: "primary",
    links: [
      { label: "Visão Geral", to: "/dashboard" },
      { label: "Agenda", to: "/agenda" },
      { label: "Financeiro", to: "/finance" },
      { label: "Relatórios", to: "/reports" },
      { label: "Equipe e Usuários", to: "/users" },
      { label: "Suporte", to: "/abrir-ticket" },
    ],
  },
  {
    key: "comunicacao",
    label: "Comunicação",
    description: "Atendimento, WhatsApp, e-mail, notificações, jornadas e automações.",
    icon: MessageSquare,
    accent: "accent",
    links: [
      { label: "Central de Comunicação", to: "/admin/comunicacao" },
      { label: "E-mail em Massa", to: "/admin/comunicacoes/email-massa" },
      { label: "Notificações", to: "/notifications" },
      { label: "Jornadas e Automações", to: "/core/automacao/fluxos" },
      { label: "Atendimento e Tickets", to: "/abrir-ticket" },
    ],
  },
  {
    key: "erp",
    label: "ERP",
    description: "Produtos, serviços, vendas, estoque, pedidos e financeiro operacional.",
    icon: Boxes,
    accent: "secondary",
    links: [
      { label: "Catálogo", to: "/catalogo" },
      { label: "Vendas", to: "/sales" },
      { label: "Estoque", to: "/inventory" },
      { label: "Operação", to: "/dashboards/operacao" },
      { label: "Financeiro", to: "/finance" },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    description: "CRM, marketing, conversão, relacionamento, vitrine e crescimento.",
    icon: TrendingUp,
    accent: "accent",
    links: [
      { label: "CRM", to: "/crm/board" },
      { label: "Leads", to: "/crm/leads" },
      { label: "Marketing", to: "/marketing" },
      { label: "Vitrine", to: "/vitrine" },
      { label: "Relatórios", to: "/reports" },
    ],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    description: "Empresa, usuários, permissões, módulos, integrações, plano e privacidade.",
    icon: Settings,
    accent: "secondary",
    links: [
      { label: "Empresa", to: "/settings" },
      { label: "Usuários", to: "/users" },
      { label: "Permissões", to: "/permissions" },
      { label: "Módulos e Integrações", to: "/modules" },
      { label: "Plano e Cobrança", to: "/minha-assinatura" },
      { label: "Privacidade", to: "/privacy" },
    ],
  },
];
