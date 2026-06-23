// Manifest de funcionalidades por tenant. Cada item aponta para uma rota REAL
// já existente no admin do cliente, garantindo que "100% dos recursos do plano
// estão funcionais para gestão".
import {
  Users, MessageCircle, Calendar, Wallet, Package, Megaphone, Workflow,
  ShoppingCart, FileText, Settings, ShieldCheck, Globe, BarChart3, Truck,
  Boxes, ListChecks, Briefcase, Search, Headphones, Bot, ScrollText,
  HandCoins, Layers, Layout, GitBranch, BookOpen, ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface FeatureItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Slug do módulo (em company_modules) que destrava este recurso. */
  module?: string;
  description?: string;
}

export interface FeatureGroup {
  category: string;
  items: FeatureItem[];
}

/**
 * Mapa de recursos por tenant. Default: nenhum (cliente sem rotas dedicadas
 * ainda usará apenas o ModulesGrid genérico do painel).
 */
export function getTenantFeatures(slug: string): FeatureGroup[] {
  if (slug === "riomed") return RIOMED_FEATURES;
  if (slug === "chrismed") return CHRISMED_FEATURES;
  if (slug === "marocas") return MAROCAS_FEATURES;
  if (slug === "garrido") return IMOBILIARIA_FEATURES;
  if (slug.startsWith("demo-imobiliar")) return IMOBILIARIA_FEATURES;
  if (slug.startsWith("demo-microcervejarias")) return CERVEJARIA_FEATURES;
  if (slug.startsWith("demo-bares")) return BARES_FEATURES;
  return [];
}

const IMOBILIARIA_FEATURES: FeatureGroup[] = [
  {
    category: "Captação & Catálogo",
    items: [
      { label: "Imóveis", to: "/imobiliaria/imoveis", icon: Package },
      { label: "Vitrine pública", to: "/imobiliaria/vitrine", icon: Globe },
      { label: "Proprietários", to: "/imobiliaria/proprietarios", icon: Users },
      { label: "Documentos", to: "/imobiliaria/documentos", icon: FileText },
    ],
  },
  {
    category: "Funil & Atendimento",
    items: [
      { label: "Interessados", to: "/imobiliaria/interessados", icon: Users, module: "crm" },
      { label: "Intenções", to: "/imobiliaria/intencoes", icon: Search, module: "crm" },
      { label: "Matches", to: "/imobiliaria/matches", icon: GitBranch },
      { label: "Visitas", to: "/imobiliaria/visitas", icon: Calendar },
      { label: "Mensagens", to: "/imobiliaria/mensagens", icon: MessageCircle },
      { label: "Distribuição de leads", to: "/imobiliaria/distribuicao", icon: GitBranch, module: "crm" },
    ],
  },
  {
    category: "Contratos & Aprovações",
    items: [
      { label: "Aprovações", to: "/imobiliaria/aprovacoes", icon: ShieldCheck },
      { label: "Contratos", to: "/imobiliaria/contratos", icon: FileText },
      { label: "Financiamento", to: "/imobiliaria/financiamento", icon: Wallet, module: "finance" },
    ],
  },
  {
    category: "Marketing & Parcerias",
    items: [
      { label: "Campanhas", to: "/imobiliaria/campanhas", icon: Megaphone, module: "marketing" },
      { label: "Parceiros", to: "/imobiliaria/parceiros", icon: Users },
      { label: "Equipes", to: "/imobiliaria/equipes", icon: Briefcase },
      { label: "Módulos", to: "/imobiliaria/modulos", icon: Layers },
    ],
  },
];

const CERVEJARIA_FEATURES: FeatureGroup[] = [
  {
    category: "Operação Cervejaria",
    items: [
      { label: "Catálogo", to: "/cervejaria/catalogo", icon: Package, module: "inventory" },
      { label: "Marketplace B2B", to: "/cervejaria/marketplace", icon: ShoppingCart, module: "marketplace" },
      { label: "PDVs parceiros", to: "/cervejaria/pdvs", icon: Briefcase },
      { label: "Relacionamento", to: "/cervejaria/relacionamento", icon: MessageCircle, module: "crm" },
      { label: "Logística reversa", to: "/cervejaria/retorno", icon: Truck },
    ],
  },
];

const BARES_FEATURES: FeatureGroup[] = [
  {
    category: "Salão & Cardápio",
    items: [
      { label: "Cardápio", to: "/restaurante/cardapio", icon: BookOpen },
      { label: "Mesas", to: "/restaurante/mesas", icon: Layout },
      { label: "Salão", to: "/restaurante/salao", icon: ListChecks },
      { label: "Notificações", to: "/restaurante/salao/notificacoes", icon: MessageCircle },
    ],
  },
  {
    category: "Compras & Marketplace",
    items: [
      { label: "Marketplace B2B", to: "/bar/marketplace", icon: ShoppingCart, module: "marketplace" },
      { label: "Novo pedido", to: "/bar/marketplace/novo-pedido", icon: HandCoins, module: "marketplace" },
    ],
  },
];

const MAROCAS_FEATURES: FeatureGroup[] = [
  {
    category: "Cockpit Marocas",
    items: [
      { label: "Cockpit", to: "/marocas/cockpit", icon: Layout, description: "Visão consolidada de apartamentos e proprietários" },
      { label: "Relatórios", to: "/marocas/cockpit/relatorio", icon: ClipboardList, description: "Relatórios mensais por proprietário" },
      { label: "Relatórios enviados", to: "/marocas/cockpit/relatorios-enviados", icon: ScrollText, description: "Histórico de envios" },
      { label: "Notificações", to: "/marocas/cockpit/notificacoes", icon: MessageCircle, description: "Notificações de manutenção e finanças" },
    ],
  },
];


const CHRISMED_FEATURES: FeatureGroup[] = [
  {
    category: "Operação CHRISMED",
    items: [
      { label: "Admin CHRISMED", to: "/chrismed/admin", icon: Settings, description: "Cockpit operacional do tenant" },
      { label: "Alertas clínicos", to: "/chrismed/alertas", icon: MessageCircle, description: "Alertas de SLA e plantão" },
      { label: "Setup & Onboarding", to: "/chrismed/setup", icon: BookOpen, description: "Configuração inicial guiada" },
    ],
  },
];


const RIOMED_FEATURES: FeatureGroup[] = [
  {
    category: "Visão & BI",
    items: [
      { label: "Master Dashboard", to: "/admin/clientes/riomed/master-dashboard", icon: BarChart3, description: "KPIs executivos consolidados" },
      { label: "Dashboards operacionais", to: "/admin/clientes/riomed/dashboards", icon: Layout, description: "Por persona e área" },
      { label: "Relatórios", to: "/admin/clientes/riomed/relatorios", icon: ClipboardList, description: "Exportações e snapshots" },
      { label: "Operações", to: "/admin/clientes/riomed/operacoes", icon: ListChecks, description: "Cockpit operacional" },
    ],
  },
  {
    category: "Comercial & CRM",
    items: [
      { label: "CRM", to: "/admin/clientes/riomed/crm", icon: Users, module: "crm" },
      { label: "Pedidos", to: "/admin/clientes/riomed/pedidos", icon: ShoppingCart, module: "commerce" },
      { label: "Carrinhos abandonados", to: "/admin/clientes/riomed/carrinhos", icon: ShoppingCart, module: "commerce" },
      { label: "Cotações & Propostas", to: "/admin/clientes/riomed/marketplace", icon: HandCoins, module: "marketplace" },
      { label: "Roteirização de leads", to: "/admin/clientes/riomed/routing", icon: GitBranch, module: "crm" },
      { label: "Vendedores", to: "/admin/clientes/riomed/vendedores", icon: Briefcase },
      { label: "Comissões", to: "/admin/clientes/riomed/comissoes", icon: HandCoins },
      { label: "Parceiros", to: "/admin/clientes/riomed/parceiros", icon: Users },
    ],
  },
  {
    category: "Catálogo & Estoque",
    items: [
      { label: "Produtos", to: "/admin/clientes/riomed/produtos", icon: Package, module: "inventory" },
      { label: "Listas de preço", to: "/admin/clientes/riomed/precos-listas", icon: FileText },
      { label: "Estoque & Almoxarifados", to: "/admin/clientes/riomed/estoque-almoxarifados", icon: Boxes, module: "inventory" },
      { label: "Importações", to: "/admin/clientes/riomed/importacoes", icon: Layers },
      { label: "Locação de equipamentos", to: "/admin/clientes/riomed/locacao", icon: Truck },
    ],
  },
  {
    category: "Operação & Pós-venda",
    items: [
      { label: "PDV / POS", to: "/admin/clientes/riomed/pos", icon: ShoppingCart, module: "pos" },
      { label: "Relatório POS", to: "/admin/clientes/riomed/pos-relatorio", icon: ScrollText, module: "pos" },
      { label: "Assistência técnica", to: "/admin/clientes/riomed/assistencia", icon: Headphones },
      { label: "Portal do cliente", to: "/admin/clientes/riomed/portal", icon: Globe },
    ],
  },
  {
    category: "Financeiro & Fiscal",
    items: [
      { label: "Financeiro", to: "/admin/clientes/riomed/financeiro", icon: Wallet, module: "finance" },
      { label: "Fiscal", to: "/admin/clientes/riomed/fiscal", icon: FileText, module: "fiscal" },
    ],
  },
  {
    category: "Marketing & Funil",
    items: [
      { label: "Marketing", to: "/admin/clientes/riomed/marketing", icon: Megaphone, module: "marketing" },
      { label: "Jornadas", to: "/admin/clientes/riomed/jornadas", icon: GitBranch, module: "marketing" },
    ],
  },
  {
    category: "IA & Automação",
    items: [
      { label: "Agentes IA", to: "/admin/clientes/riomed/agentes", icon: Bot, module: "ai" },
      { label: "Assistente IA", to: "/admin/clientes/riomed/assistente", icon: MessageCircle, module: "ai" },
      { label: "Busca IA", to: "/admin/clientes/riomed/busca-ia", icon: Search, module: "ai" },
      { label: "Automação", to: "/admin/clientes/riomed/automacao", icon: Workflow, module: "automation" },
      { label: "N8N", to: "/admin/clientes/riomed/n8n", icon: Workflow, module: "n8n" },
    ],
  },
  {
    category: "Governança & Configuração",
    items: [
      { label: "Implantação", to: "/admin/clientes/riomed/implantacao", icon: BookOpen },
      { label: "Governança", to: "/admin/clientes/riomed/governanca", icon: ShieldCheck },
      { label: "Permissões", to: "/admin/clientes/riomed/permissoes", icon: ShieldCheck },
      { label: "Configurações de campos", to: "/admin/clientes/riomed/configuracoes-campos", icon: Settings },
      { label: "Domínio & Deploy", to: "/admin/clientes/riomed/dominio", icon: Globe },
    ],
  },
];
