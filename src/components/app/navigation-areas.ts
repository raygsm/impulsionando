/**
 * Camada puramente visual/apresentacional que reorganiza a navegação do
 * Core Impulsionando em 11 áreas empresariais. NENHUMA rota física é
 * alterada por este arquivo — todos os `to` apontam para rotas já
 * existentes em `src/routes/_authenticated/`.
 *
 * Esta é a fonte de verdade do painel "Todas as Áreas" (/inicio) e do
 * hub administrativo unificado. O menu lateral legado continua ativo em
 * paralelo até a migração total.
 */
import type { LucideIcon } from "lucide-react";
import {
  Home, Users, TrendingUp, Wallet, Headphones, Megaphone,
  Package, BarChart3, Settings, ShieldCheck, HelpCircle,
} from "lucide-react";

export interface AreaLink {
  label: string;
  to: string;
}

export interface Area {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Cor semântica (token). Ex.: 'primary', 'accent'. */
  accent: "primary" | "accent" | "secondary";
  links: AreaLink[];
}

export const NAVIGATION_AREAS: Area[] = [
  {
    key: "inicio",
    label: "Início",
    description: "Sua visão geral, indicadores e alertas do dia.",
    icon: Home,
    accent: "primary",
    links: [
      { label: "Visão Geral", to: "/dashboard" },
      { label: "Buscar", to: "/buscar" },
      { label: "Painel Executivo", to: "/dashboards/core" },
      { label: "Indicadores", to: "/dashboards/operacao" },
      { label: "Atividades Recentes", to: "/notifications" },
      { label: "Alertas", to: "/admin/action-center" },
    ],
  },
  {
    key: "clientes",
    label: "Clientes",
    description: "Empresas, parceiros white label, consumidores e novos cadastros.",
    icon: Users,
    accent: "primary",
    links: [
      { label: "Empresas", to: "/core/tenants" },
      { label: "White Label", to: "/admin/branding" },
      { label: "Consumidores (Clube)", to: "/admin/clube" },
      { label: "Demonstrações", to: "/core/testes" },
      { label: "Novos Cadastros", to: "/core/importar-clientes" },
      { label: "Onboarding", to: "/onboarding" },
    ],
  },
  {
    key: "vendas",
    label: "Vendas",
    description: "Todo o funil comercial: leads, oportunidades, contratos e assinaturas.",
    icon: TrendingUp,
    accent: "accent",
    links: [
      { label: "Leads", to: "/core/marketing-leads" },
      { label: "Oportunidades", to: "/crm/board" },
      { label: "CRM", to: "/crm/board" },
      { label: "Funil", to: "/admin/conversion-funnel" },
      { label: "Propostas", to: "/core/finalizacao-comercial" },
      { label: "Contratos", to: "/admin/billing-contracts" },
      { label: "Assinaturas", to: "/admin/billing" },
      { label: "Checkout", to: "/checkout" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    description: "Recebimentos, pagamentos, notas fiscais e conciliação.",
    icon: Wallet,
    accent: "primary",
    links: [
      { label: "Recebimentos", to: "/finance" },
      { label: "Pagamentos", to: "/admin/cobrancas" },
      { label: "Assinaturas", to: "/admin/billing" },
      { label: "Mercado Pago", to: "/core/integracoes/diagnostico" },
      { label: "Repasses", to: "/core/financeiro-consolidado" },
      { label: "Notas Fiscais", to: "/finance" },
      { label: "Conciliação", to: "/finance" },
      { label: "Relatórios Financeiros", to: "/core/financeiro-master" },
    ],
  },
  {
    key: "atendimento",
    label: "Atendimento",
    description: "Agenda, chamados, suporte e canais de comunicação.",
    icon: Headphones,
    accent: "accent",
    links: [
      { label: "Agenda", to: "/agenda" },
      { label: "Chamados", to: "/abrir-ticket" },
      { label: "Suporte", to: "/central-de-ajuda" },
      { label: "WhatsApp", to: "/admin/comunicacao" },
      { label: "Impulsionito", to: "/admin/comunicacao" },
      { label: "Central de Comunicação", to: "/admin/comunicacao" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Vitrine, campanhas, redes sociais e automações.",
    icon: Megaphone,
    accent: "accent",
    links: [
      { label: "Vitrine", to: "/vitrine" },
      { label: "Campanhas", to: "/marketing" },
      { label: "Redes Sociais", to: "/marketing" },
      { label: "Quiz", to: "/marketing" },
      { label: "Sorteios", to: "/marketing" },
      { label: "Vaquinhas", to: "/marketing" },
      { label: "Automações", to: "/core/automacao/fluxos" },
      { label: "N8N", to: "/core/automacao/fluxos" },
    ],
  },
  {
    key: "operacao",
    label: "Operação",
    description: "Pedidos, produtos, estoque e parcerias.",
    icon: Package,
    accent: "secondary",
    links: [
      { label: "Pedidos", to: "/dashboards/operacao" },
      { label: "Delivery", to: "/dashboards/operacao" },
      { label: "Produtos", to: "/catalogo" },
      { label: "Serviços", to: "/catalogo" },
      { label: "Estoque", to: "/dashboards/operacao" },
      { label: "Fornecedores", to: "/core/tenants" },
      { label: "Parcerias", to: "/admin/branding" },
    ],
  },
  {
    key: "relatorios",
    label: "Relatórios",
    description: "Toda a inteligência do negócio em um só lugar.",
    icon: BarChart3,
    accent: "primary",
    links: [
      { label: "Financeiros", to: "/core/financeiro-master" },
      { label: "Comerciais", to: "/admin/conversion-funnel" },
      { label: "Marketing", to: "/admin/attribution" },
      { label: "Operacionais", to: "/dashboards/operacao" },
      { label: "Clientes", to: "/admin/customer-success" },
      { label: "Conversões", to: "/admin/conversion-funnel" },
      { label: "Performance", to: "/admin/cohort-retention" },
    ],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    description: "Empresa, usuários, permissões, integrações e planos.",
    icon: Settings,
    accent: "secondary",
    links: [
      { label: "Empresa", to: "/settings" },
      { label: "Usuários", to: "/users" },
      { label: "Permissões", to: "/permissions" },
      { label: "Integrações", to: "/modules" },
      { label: "Planos", to: "/core/planos" },
      { label: "Módulos", to: "/core/modulos" },
      { label: "Personalização", to: "/core/estudio-visual" },
      { label: "Domínios", to: "/core/dominios" },
      { label: "Segurança", to: "/admin/audit-trail" },
    ],
  },
  {
    key: "administracao",
    label: "Administração",
    description: "Central master: publicações, homologação, auditoria e monitoramento.",
    icon: ShieldCheck,
    accent: "primary",
    links: [
      { label: "Empresas (Tenants)", to: "/core/tenants" },
      { label: "Publicações", to: "/core/releases" },
      { label: "Homologação", to: "/core/testes" },
      { label: "Logs", to: "/audit" },
      { label: "Auditoria", to: "/admin/audit-trail" },
      { label: "Centro de Inteligência", to: "/admin/command-center" },
      { label: "Monitoramento", to: "/admin/action-center" },
      { label: "Central Master", to: "/admin/master-hub" },
    ],
  },
  {
    key: "ajuda",
    label: "Central de Ajuda",
    description: "Documentação, tutoriais e contato.",
    icon: HelpCircle,
    accent: "secondary",
    links: [
      { label: "Documentação", to: "/saiba-mais" },
      { label: "Tutoriais", to: "/central-de-ajuda" },
      { label: "Contato", to: "/abrir-ticket" },
    ],
  },
];
