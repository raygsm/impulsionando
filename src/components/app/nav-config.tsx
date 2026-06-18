import {
  LayoutDashboard, Building2, Tags, MapPin, Layers, Users, KeyRound,
  SlidersHorizontal, FileSearch, Boxes, KanbanSquare, UserPlus, GitBranch, CalendarClock,
  Calendar, Users2, Wrench, Clock, UsersRound,
  Wallet, ArrowLeftRight, FolderTree, CreditCard, Percent,
  Package, Truck, ArrowDownUp,
  ShoppingCart, Receipt, Plus, Wallet as WalletIcon,
  Contact, BarChart3, ShieldCheck, Inbox, GraduationCap, Stethoscope, Sparkles, Crown,
  Handshake, Link2, Briefcase, BadgeDollarSign, TrendingUp, Banknote, Copy,
  Home, Search as SearchIcon, Zap, Bot, MessageSquare,
  History as HistoryIcon, Headphones, UserRound, Megaphone,
  Calculator, Activity, RefreshCw, BookOpen,
} from "lucide-react";

export type NavAudience = "core" | "white-label" | "empresa" | "consumidor";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
  /** Código de permissão necessário. Se ausente, o item é visível por padrão. */
  perm?: string;
  /** Renderiza um contador dinâmico ao lado do label. */
  badge?: "pendingPix";
  /** Audiências para as quais este item é relevante. Se ausente = todas. */
  audiences?: NavAudience[];
}


export interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  /** Audiências para as quais este grupo é relevante. Se ausente = todas. */
  audiences?: NavAudience[];
}

export const TOP_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.read" },
  { to: "/dashboards/core", label: "Dashboard Core", icon: LayoutDashboard, audiences: ["core"] },
  { to: "/dashboards/white-label", label: "Dashboard WL", icon: LayoutDashboard, audiences: ["white-label", "core"] },
  { to: "/dashboards/empresa", label: "Dashboard Empresa", icon: LayoutDashboard, audiences: ["empresa"] },
  { to: "/dashboards/consumidor", label: "Minha área (Consumidor)", icon: LayoutDashboard, audiences: ["consumidor"] },
  { to: "/cockpits", label: "Cockpits", icon: TrendingUp, superOnly: true },
  { to: "/notifications", label: "Notificações", icon: Inbox },
  { to: "/contabilidade/cockpit", label: "Cockpit Contábil", icon: Calculator, superOnly: true },
  { to: "/onboarding", label: "Começar / Melhorar", icon: Sparkles },
  { to: "/saiba-mais", label: "Saiba Mais", icon: BookOpen },
  { to: "/adm", label: "/adm — Central Impulsionando", icon: ShieldCheck, superOnly: true },
  { to: "/adm/agentes", label: "Central de Agentes", icon: Bot, superOnly: true },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Captar",
    defaultOpen: true,
    items: [
      { to: "/commercial/cockpit", label: "Cockpit Comercial", icon: TrendingUp, perm: "crm.opportunity.read" },
      { to: "/crm/board", label: "Kanban de oportunidades", icon: KanbanSquare, perm: "crm.opportunity.read" },
      { to: "/crm/leads", label: "Leads", icon: UserPlus, perm: "crm.lead.read" },
      { to: "/crm/pipelines", label: "Funis", icon: GitBranch, perm: "crm.pipeline.read" },
      { to: "/crm/activities", label: "Atividades", icon: CalendarClock, perm: "crm.activity.read" },
      { to: "/marketing/leads", label: "Leads do site", icon: Inbox, superOnly: true },
      { to: "/marketing/cockpit", label: "Cockpit de Marketing", icon: Megaphone, superOnly: true },
      { to: "/talents", label: "Banco de Talentos", icon: GraduationCap, superOnly: true },
    ],
  },
  {
    label: "Relacionar",
    items: [
      { to: "/customers", label: "Clientes", icon: Contact, perm: "customer.read" },
      { to: "/agenda", label: "Agenda — hoje", icon: Calendar, perm: "agenda.appointment.read" },
      { to: "/agenda/appointments", label: "Agendamentos", icon: CalendarClock, perm: "agenda.appointment.read" },
      { to: "/agenda/professionals", label: "Profissionais", icon: Users2, perm: "agenda.professional.read" },
      { to: "/agenda/services", label: "Serviços", icon: Wrench, perm: "agenda.service.read" },
      { to: "/agenda/schedules", label: "Horários", icon: Clock, perm: "agenda.schedule.write" },
      { to: "/agenda/waitlist", label: "Fila de espera", icon: UsersRound, perm: "agenda.waitlist.write" },
      { to: "/ehr", label: "Prontuário Eletrônico", icon: Stethoscope, perm: "ehr.record.read" },
      { to: "/imobiliaria/interessados", label: "Interessados (Imob.)", icon: Users2, perm: "realestate.interest.read" },
      { to: "/clube", label: "Minha área Clube", icon: Sparkles },
      { to: "/consumer/unified", label: "Clube — Membros", icon: UserRound, perm: "users.read" },
    ],
  },
  {
    label: "Operar",
    items: [
      { to: "/operations/cockpit", label: "Cockpit de Operações", icon: TrendingUp, perm: "sales.order.read" },
      { to: "/sales", label: "Vendas — visão geral", icon: ShoppingCart, perm: "sales.order.read" },
      { to: "/sales/new", label: "Nova venda (PDV)", icon: Plus, perm: "sales.order.write" },
      { to: "/sales/orders", label: "Pedidos", icon: Receipt, perm: "sales.order.read" },
      { to: "/sales/cash", label: "Fechamento de caixa", icon: WalletIcon, perm: "sales.cashsession.read" },
      { to: "/inventory", label: "Estoque — visão geral", icon: Package, perm: "inventory.product.read" },
      { to: "/inventory/products", label: "Produtos", icon: Boxes, perm: "inventory.product.read" },
      { to: "/inventory/movements", label: "Movimentações", icon: ArrowDownUp, perm: "inventory.movement.read" },
      { to: "/inventory/categories", label: "Categorias de estoque", icon: FolderTree, perm: "inventory.category.read" },
      { to: "/inventory/suppliers", label: "Fornecedores", icon: Truck, perm: "inventory.supplier.read" },
      { to: "/imobiliaria/vitrine", label: "Imobiliária — vitrine", icon: Home },
      { to: "/realestate/cockpit", label: "Imobiliária — cockpit", icon: Home },
      { to: "/imobiliaria/imoveis", label: "Imóveis", icon: Home },
      { to: "/imobiliaria/intencoes", label: "Buscas salvas", icon: SearchIcon },
      { to: "/imobiliaria/matches", label: "Matches", icon: Zap },
      { to: "/imobiliaria/modulos", label: "Módulos do nicho (imob.)", icon: Boxes },
    ],
  },
  {
    label: "Cobrar",
    items: [
      { to: "/finance/cockpit", label: "Cockpit Financeiro", icon: TrendingUp, perm: "finance.transaction.read" },
      { to: "/finance", label: "Financeiro — visão geral", icon: Wallet, perm: "finance.transaction.read" },
      { to: "/finance/transactions", label: "Lançamentos", icon: ArrowLeftRight, perm: "finance.transaction.read" },
      { to: "/finance/accounts", label: "Contas", icon: Wallet, perm: "finance.account.write" },
      { to: "/finance/categories", label: "Categorias financeiras", icon: FolderTree, perm: "finance.category.write" },
      { to: "/finance/methods", label: "Métodos de pagamento", icon: CreditCard, perm: "finance.method.write" },
      { to: "/finance/integracoes", label: "Integrações de pagamento", icon: Wallet, perm: "finance.method.write", badge: "pendingPix" },
      { to: "/finance/commissions", label: "Comissões", icon: Percent, perm: "finance.commission.read" },
      { to: "/minha-assinatura", label: "Minha Assinatura", icon: CreditCard },
      { to: "/affiliates", label: "Afiliados — Dashboard", icon: LayoutDashboard, perm: "aff.module.read" },
      { to: "/affiliates/sales", label: "Afiliados — Vendas", icon: ShoppingCart, perm: "aff.module.read" },
      { to: "/affiliates/commissions", label: "Afiliados — Comissões", icon: Percent, perm: "aff.module.read" },
      { to: "/affiliates/payouts", label: "Saques e Repasses", icon: Banknote, perm: "aff.module.read" },
      { to: "/affiliates/wallet", label: "Carteira & Alertas", icon: Wallet, perm: "aff.module.read" },
      { to: "/affiliates/links", label: "Links / Cupons / QR", icon: Link2, perm: "aff.module.read" },
      { to: "/affiliates/affiliates", label: "Afiliados (cadastro)", icon: Handshake, perm: "aff.module.read" },
      { to: "/affiliates/coproducers", label: "Coprodutores", icon: Users2, perm: "aff.module.read" },
      { to: "/affiliates/managers", label: "Gerentes", icon: Briefcase, perm: "aff.module.read" },
      { to: "/affiliates/products", label: "Produtos (afiliados)", icon: Boxes, perm: "aff.module.read" },
      { to: "/affiliates/offers", label: "Ofertas", icon: BadgeDollarSign, perm: "aff.module.read" },
    ],
  },
  {
    label: "Comunicar",
    items: [
      { to: "/imobiliaria/mensagens", label: "Mensagens (Imob.)", icon: MessageSquare, perm: "realestate.message.read" },
      { to: "/notifications", label: "Notificações", icon: Inbox },
      { to: "/privacy", label: "Privacidade & Notificações", icon: ShieldCheck },
    ],
  },
  {
    label: "Automatizar",
    items: [
      { to: "/adm/agentes", label: "Central de Agentes", icon: Bot, superOnly: true },
      { to: "/finance/webhook-log", label: "Log de Webhooks", icon: HistoryIcon, perm: "finance.transaction.read" },
    ],
  },
  {
    label: "Analisar",
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
  {
    label: "Melhorar",
    items: [
      { to: "/onboarding", label: "Onboarding / Melhorar", icon: Sparkles },
      { to: "/saiba-mais", label: "Saiba Mais (planos, módulos, nichos)", icon: BookOpen },
      { to: "/saiba-mais/saude", label: "Saúde da Conta", icon: Activity },
      { to: "/saiba-mais/versoes", label: "Versões & Atualizações", icon: RefreshCw },
    ],
  },
  {
    label: "Administração",
    audiences: ["empresa", "core"],
    items: [
      { to: "/companies", label: "Empresas", icon: Building2, superOnly: true },
      { to: "/niches", label: "Nichos", icon: Tags, superOnly: true },
      { to: "/units", label: "Unidades", icon: MapPin, perm: "units.read" },
      { to: "/sectors", label: "Setores", icon: Layers, perm: "sectors.read" },
      { to: "/users/corporate", label: "Visão Corporativa", icon: Users, perm: "users.read" },
      { to: "/users", label: "Usuários", icon: Users, perm: "users.read" },
      { to: "/access-profiles", label: "Perfis de acesso", icon: KeyRound, perm: "profiles.read" },
      { to: "/access-profiles/matrix", label: "Matriz de Permissões", icon: KeyRound, perm: "profiles.read" },
      { to: "/permissions", label: "Permissões", icon: KeyRound, superOnly: true },
      { to: "/modules", label: "Módulos", icon: Boxes, perm: "modules.read" },
      { to: "/settings", label: "Configurações", icon: SlidersHorizontal, perm: "settings.read" },
      { to: "/audit", label: "Auditoria", icon: FileSearch, perm: "audit.read" },
      { to: "/privacy/cockpit", label: "Cockpit LGPD", icon: ShieldCheck, superOnly: true },
      { to: "/admin/trials", label: "Trials (7 dias)", icon: Sparkles, superOnly: true },
      { to: "/admin/clube", label: "Clube — Cockpit", icon: Crown, superOnly: true },
      { to: "/admin/billing", label: "Billing", icon: CreditCard, superOnly: true },
      { to: "/admin/billing-contracts", label: "Contratos recorrentes", icon: CreditCard, superOnly: true },
      { to: "/admin/billing-policy", label: "Régua de cobrança", icon: CreditCard, superOnly: true },
      { to: "/admin/modulos/clonagem", label: "Clonagem de Módulos", icon: Copy, superOnly: true },
      { to: "/white-label/cockpit", label: "White Label Cockpit", icon: Layers, superOnly: true },
      { to: "/support/cockpit", label: "Suporte — Cockpit", icon: Headphones, superOnly: true },
      { to: "/affiliates/reports", label: "Relatórios de afiliados", icon: TrendingUp, perm: "aff.module.read" },
    ],
  },
];
