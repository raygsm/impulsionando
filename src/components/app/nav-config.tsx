import {
  LayoutDashboard, Building2, Tags, MapPin, Layers, Users, KeyRound,
  SlidersHorizontal, FileSearch, Boxes, KanbanSquare, UserPlus, GitBranch, CalendarClock,
  Calendar, Users2, Wrench, Clock, UsersRound,
  Wallet, ArrowLeftRight, FolderTree, CreditCard, Percent,
  Package, Truck, ArrowDownUp,
  ShoppingCart, Receipt, Plus, Wallet as WalletIcon,
  Contact, BarChart3, ShieldCheck, Inbox, GraduationCap, Stethoscope, Sparkles,
  Handshake, Link2, Briefcase, BadgeDollarSign, TrendingUp, Banknote, Copy,
  Home, Search as SearchIcon, Zap, Bot, MessageSquare,
  History as HistoryIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
  /** Código de permissão necessário. Se ausente, o item é visível por padrão. */
  perm?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const TOP_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.read" },
  { to: "/onboarding", label: "Começar / Melhorar", icon: Sparkles },
  { to: "/adm", label: "/adm — Central Impulsionando", icon: ShieldCheck, superOnly: true },
  { to: "/adm/agentes", label: "Central de Agentes", icon: Bot, superOnly: true },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Crescimento",
    defaultOpen: true,
    items: [
      { to: "/crm/board", label: "Kanban de oportunidades", icon: KanbanSquare, perm: "crm.opportunity.read" },
      { to: "/crm/leads", label: "Leads", icon: UserPlus, perm: "crm.lead.read" },
      { to: "/marketing/leads", label: "Leads do site", icon: Inbox, superOnly: true },
      { to: "/crm/pipelines", label: "Funis", icon: GitBranch, perm: "crm.pipeline.read" },
      { to: "/crm/activities", label: "Atividades", icon: CalendarClock, perm: "crm.activity.read" },
      { to: "/talents", label: "Banco de Talentos", icon: GraduationCap, superOnly: true },
    ],
  },
  {
    label: "Vendas",
    items: [
      { to: "/sales", label: "Visão geral", icon: ShoppingCart, perm: "sales.order.read" },
      { to: "/sales/new", label: "Nova venda (PDV)", icon: Plus, perm: "sales.order.write" },
      { to: "/sales/orders", label: "Pedidos", icon: Receipt, perm: "sales.order.read" },
      { to: "/sales/cash", label: "Fechamento de caixa", icon: WalletIcon, perm: "sales.cashsession.read" },
      { to: "/inventory", label: "Estoque — visão geral", icon: Package, perm: "inventory.product.read" },
      { to: "/inventory/products", label: "Produtos", icon: Boxes, perm: "inventory.product.read" },
      { to: "/inventory/movements", label: "Movimentações", icon: ArrowDownUp, perm: "inventory.movement.read" },
      { to: "/inventory/categories", label: "Categorias de estoque", icon: FolderTree, perm: "inventory.category.read" },
      { to: "/inventory/suppliers", label: "Fornecedores", icon: Truck, perm: "inventory.supplier.read" },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { to: "/customers", label: "Clientes", icon: Contact, perm: "customer.read" },
      { to: "/agenda", label: "Agenda — hoje", icon: Calendar, perm: "agenda.appointment.read" },
      { to: "/agenda/appointments", label: "Agendamentos", icon: CalendarClock, perm: "agenda.appointment.read" },
      { to: "/agenda/professionals", label: "Profissionais", icon: Users2, perm: "agenda.professional.read" },
      { to: "/agenda/services", label: "Serviços", icon: Wrench, perm: "agenda.service.read" },
      { to: "/agenda/schedules", label: "Horários", icon: Clock, perm: "agenda.schedule.write" },
      { to: "/agenda/waitlist", label: "Fila de espera", icon: UsersRound, perm: "agenda.waitlist.write" },
      { to: "/ehr", label: "Prontuário Eletrônico", icon: Stethoscope, perm: "ehr.record.read" },
    ],
  },
  {
    label: "Operação por nicho",
    items: [
      { to: "/imobiliaria/vitrine", label: "Imobiliária — vitrine", icon: Home },
      { to: "/imobiliaria/imoveis", label: "Imóveis", icon: Home },
      { to: "/imobiliaria/interessados", label: "Interessados", icon: Users2, perm: "realestate.interest.read" },
      { to: "/imobiliaria/mensagens", label: "Mensagens", icon: MessageSquare, perm: "realestate.message.read" },
      { to: "/imobiliaria/intencoes", label: "Buscas salvas", icon: SearchIcon },
      { to: "/imobiliaria/matches", label: "Matches", icon: Zap },
      { to: "/imobiliaria/modulos", label: "Módulos do nicho (imob.)", icon: Boxes },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/finance", label: "Financeiro — visão geral", icon: Wallet, perm: "finance.transaction.read" },
      { to: "/finance/transactions", label: "Lançamentos", icon: ArrowLeftRight, perm: "finance.transaction.read" },
      { to: "/finance/accounts", label: "Contas", icon: Wallet, perm: "finance.account.write" },
      { to: "/finance/categories", label: "Categorias financeiras", icon: FolderTree, perm: "finance.category.write" },
      { to: "/finance/methods", label: "Métodos de pagamento", icon: CreditCard, perm: "finance.method.write" },
      { to: "/finance/commissions", label: "Comissões", icon: Percent, perm: "finance.commission.read" },
      { to: "/finance/webhook-log", label: "Log de Webhooks", icon: HistoryIcon, perm: "finance.transaction.read" },
      { to: "/companies", label: "Empresas", icon: Building2, superOnly: true },
      { to: "/niches", label: "Nichos", icon: Tags, superOnly: true },
      { to: "/units", label: "Unidades", icon: MapPin, perm: "units.read" },
      { to: "/sectors", label: "Setores", icon: Layers, perm: "sectors.read" },
      { to: "/users", label: "Usuários", icon: Users, perm: "users.read" },
      { to: "/access-profiles", label: "Perfis de acesso", icon: KeyRound, perm: "profiles.read" },
      { to: "/access-profiles/matrix", label: "Matriz de Permissões", icon: KeyRound, perm: "profiles.read" },
      { to: "/permissions", label: "Permissões", icon: KeyRound, superOnly: true },
      { to: "/modules", label: "Módulos", icon: Boxes, perm: "modules.read" },
      { to: "/admin/trials", label: "Trials (7 dias)", icon: Sparkles, superOnly: true },
      { to: "/admin/billing", label: "Billing", icon: CreditCard, superOnly: true },
      { to: "/admin/billing-contracts", label: "Contratos recorrentes", icon: CreditCard, superOnly: true },
      { to: "/admin/billing-policy", label: "Régua de cobrança", icon: CreditCard, superOnly: true },
      { to: "/admin/modulos/clonagem", label: "Clonagem de Módulos", icon: Copy, superOnly: true },
      { to: "/minha-assinatura", label: "Minha Assinatura", icon: CreditCard },
      { to: "/settings", label: "Configurações", icon: SlidersHorizontal, perm: "settings.read" },
      { to: "/audit", label: "Auditoria", icon: FileSearch, perm: "audit.read" },
      { to: "/privacy", label: "Privacidade & Notificações", icon: ShieldCheck },
    ],
  },
  {
    label: "Afiliados",
    items: [
      { to: "/affiliates", label: "Dashboard", icon: LayoutDashboard, perm: "aff.module.read" },
      { to: "/affiliates/products", label: "Produtos", icon: Boxes, perm: "aff.module.read" },
      { to: "/affiliates/offers", label: "Ofertas", icon: BadgeDollarSign, perm: "aff.module.read" },
      { to: "/affiliates/affiliates", label: "Afiliados", icon: Handshake, perm: "aff.module.read" },
      { to: "/affiliates/coproducers", label: "Coprodutores", icon: Users2, perm: "aff.module.read" },
      { to: "/affiliates/managers", label: "Gerentes", icon: Briefcase, perm: "aff.module.read" },
      { to: "/affiliates/links", label: "Links / Cupons / QR", icon: Link2, perm: "aff.module.read" },
      { to: "/affiliates/sales", label: "Vendas", icon: ShoppingCart, perm: "aff.module.read" },
      { to: "/affiliates/commissions", label: "Comissões", icon: Percent, perm: "aff.module.read" },
      { to: "/affiliates/payouts", label: "Saques e Repasses", icon: Banknote, perm: "aff.module.read" },
      { to: "/affiliates/wallet", label: "Carteira & Alertas", icon: Wallet, perm: "aff.module.read" },
      { to: "/affiliates/reports", label: "Relatórios de afiliados", icon: TrendingUp, perm: "aff.module.read" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { to: "/insights/respostas", label: "Dashboard de Respostas", icon: Sparkles },
      { to: "/insights/oportunidades", label: "Central de Oportunidades", icon: Zap },
      { to: "/reports", label: "Relatórios — visão geral", icon: BarChart3, perm: "report.read" },
      { to: "/reports/sales", label: "Vendas", icon: ShoppingCart, perm: "report.read" },
      { to: "/reports/finance", label: "Financeiro", icon: Wallet, perm: "report.read" },
      { to: "/reports/inventory", label: "Estoque", icon: Package, perm: "report.read" },
      { to: "/reports/agenda", label: "Agenda", icon: Calendar, perm: "report.read" },
      { to: "/reports/crm", label: "CRM", icon: UserPlus, perm: "report.read" },
      { to: "/bi", label: "BI — visão geral", icon: BarChart3, perm: "bi.read" },
      { to: "/bi/company", label: "BI por cliente", icon: Building2, perm: "bi.read" },
      { to: "/bi/master", label: "BI Master", icon: Building2, superOnly: true },
      { to: "/bi/niches", label: "BI por nicho", icon: Tags, superOnly: true },
    ],
  },
];
