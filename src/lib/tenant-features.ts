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
  return [];
}

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
