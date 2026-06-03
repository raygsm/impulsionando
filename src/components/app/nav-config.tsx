import {
  LayoutDashboard, Building2, Tags, MapPin, Layers, Users, KeyRound,
  SlidersHorizontal, FileSearch, Boxes, KanbanSquare, UserPlus, GitBranch, CalendarClock,
  Calendar, Users2, Wrench, Clock, UsersRound,
  Wallet, ArrowLeftRight, FolderTree, CreditCard, Percent,
  Package, Truck, ArrowDownUp,
  ShoppingCart, Receipt, Plus, Wallet as WalletIcon,
  Contact, BarChart3,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

/** Itens que ficam fora de qualquer grupo (sempre visíveis no topo). */
export const TOP_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Organização",
    defaultOpen: true,
    items: [
      { to: "/companies", label: "Empresas", icon: Building2, superOnly: true },
      { to: "/niches", label: "Nichos", icon: Tags, superOnly: true },
      { to: "/units", label: "Unidades", icon: MapPin },
      { to: "/sectors", label: "Setores", icon: Layers },
      { to: "/users", label: "Usuários", icon: Users },
      { to: "/access-profiles", label: "Perfis", icon: KeyRound },
      { to: "/permissions", label: "Permissões", icon: KeyRound, superOnly: true },
      { to: "/modules", label: "Módulos", icon: Boxes },
      { to: "/settings", label: "Configurações", icon: SlidersHorizontal },
      { to: "/audit", label: "Auditoria", icon: FileSearch },
    ],
  },
  {
    label: "CRM",
    items: [
      { to: "/crm/board", label: "Kanban", icon: KanbanSquare },
      { to: "/crm/leads", label: "Leads", icon: UserPlus },
      { to: "/crm/pipelines", label: "Funis", icon: GitBranch },
      { to: "/crm/activities", label: "Atividades", icon: CalendarClock },
      { to: "/customers", label: "Clientes", icon: Contact },
    ],
  },
  {
    label: "Agenda",
    items: [
      { to: "/agenda", label: "Hoje", icon: Calendar },
      { to: "/agenda/appointments", label: "Agendamentos", icon: CalendarClock },
      { to: "/agenda/professionals", label: "Profissionais", icon: Users2 },
      { to: "/agenda/services", label: "Serviços", icon: Wrench },
      { to: "/agenda/schedules", label: "Horários", icon: Clock },
      { to: "/agenda/waitlist", label: "Fila", icon: UsersRound },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/finance", label: "Visão geral", icon: Wallet },
      { to: "/finance/transactions", label: "Lançamentos", icon: ArrowLeftRight },
      { to: "/finance/accounts", label: "Contas", icon: Wallet },
      { to: "/finance/categories", label: "Categorias", icon: FolderTree },
      { to: "/finance/methods", label: "Métodos", icon: CreditCard },
      { to: "/finance/commissions", label: "Comissões", icon: Percent },
    ],
  },
  {
    label: "Estoque",
    items: [
      { to: "/inventory", label: "Visão geral", icon: Package },
      { to: "/inventory/products", label: "Produtos", icon: Boxes },
      { to: "/inventory/movements", label: "Movimentações", icon: ArrowDownUp },
      { to: "/inventory/categories", label: "Categorias", icon: FolderTree },
      { to: "/inventory/suppliers", label: "Fornecedores", icon: Truck },
    ],
  },
  {
    label: "Vendas",
    items: [
      { to: "/sales", label: "Visão geral", icon: ShoppingCart },
      { to: "/sales/new", label: "Nova venda (PDV)", icon: Plus },
      { to: "/sales/orders", label: "Pedidos", icon: Receipt },
      { to: "/sales/cash", label: "Fechamento de caixa", icon: WalletIcon },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { to: "/reports", label: "Visão geral", icon: BarChart3 },
      { to: "/reports/sales", label: "Vendas", icon: ShoppingCart },
      { to: "/reports/finance", label: "Financeiro", icon: Wallet },
      { to: "/reports/inventory", label: "Estoque", icon: Package },
      { to: "/reports/agenda", label: "Agenda", icon: Calendar },
      { to: "/reports/crm", label: "CRM", icon: UserPlus },
    ],
  },
  {
    label: "BI",
    items: [
      { to: "/bi", label: "Visão geral", icon: BarChart3 },
      { to: "/bi/company", label: "Cliente", icon: Building2 },
      { to: "/bi/master", label: "Master", icon: Building2, superOnly: true },
      { to: "/bi/niches", label: "Por nicho", icon: Tags, superOnly: true },
    ],
  },
];
