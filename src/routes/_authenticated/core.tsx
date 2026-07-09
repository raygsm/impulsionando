import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Building2, LayoutDashboard, Boxes, CreditCard, Globe, Rocket,
  KanbanSquare, Wallet, MessageSquare, Users, KeyRound, FileSearch,
  SlidersHorizontal, Plug, HeartPulse, FlaskConical, TrendingUp, Sparkles, CheckCircle2,
  Megaphone, FileCode, Upload, ChevronDown, Menu, Search,
  Workflow, Bot, Handshake, Store, Receipt, Banknote, Activity, Gauge,
  LineChart, ShieldCheck, ScrollText, Send, Ticket, FileText, Server,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core")({
  head: () => ({ meta: [{ title: "/adm — Impulsionando Core" }, { name: "robots", content: "noindex" }] }),
  component: CoreLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };

// Fase 3.1 — Shell Core consolidado (frontend-only).
// Rotas técnicas internas seguem preservadas fora do menu;
// grupos abaixo cobrem os fluxos operacionais do dia a dia.
const GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { to: "/core", label: "Dashboard Master", icon: LayoutDashboard, exact: true },
      { to: "/core/dashboard-macro", label: "Dashboard Macro", icon: Gauge },
      { to: "/core/bi-ecossistema", label: "BI do Ecossistema", icon: LineChart },
      { to: "/core/saude", label: "Saúde do Ecossistema", icon: HeartPulse },
      { to: "/core/dashboards", label: "Dashboards Salvos", icon: LayoutDashboard },
    ],
  },
  {
    label: "Clientes conectados ao Core",
    icon: Building2,
    items: [
      { to: "/core/clientes", label: "Clientes 360", icon: Building2 },
      { to: "/core/nova-implantacao", label: "Nova Implantação (IA)", icon: Sparkles },
      { to: "/core/criar-projeto", label: "Criar Projeto (Fábrica)", icon: Rocket },
      { to: "/core/implantacoes", label: "Implantações", icon: Rocket },
      { to: "/core/importar-clientes", label: "Importar Clientes (CSV)", icon: Upload },
      { to: "/core/testes", label: "Contas de Teste", icon: FlaskConical },
      { to: "/core/dominios", label: "Domínios dos Clientes", icon: Globe },
      { to: "/core/publicacao", label: "Publicação DEV→PROD", icon: Rocket },
      { to: "/core/releases", label: "Releases", icon: Rocket },
      { to: "/core/consumidor-premium", label: "Consumidores Premium", icon: Users },
    ],
  },
  {
    label: "Comercial & CRM",
    icon: KanbanSquare,
    items: [
      { to: "/core/comercial", label: "Comercial (Hub)", icon: TrendingUp },
      { to: "/crm/board", label: "CRM — Kanban", icon: KanbanSquare },
      { to: "/core/marketing-leads", label: "Leads /marketing", icon: Megaphone },
      { to: "/core/marketing-pages", label: "CMS /marketing", icon: FileCode },
      { to: "/core/feira-leads", label: "Feira de Leads", icon: Users },
      { to: "/core/briefings", label: "Briefings", icon: FileText },
      { to: "/core/demos", label: "Demos", icon: Send },
      { to: "/core/demo-insights", label: "Insights de Demos", icon: LineChart },
      { to: "/core/finalizacao-comercial", label: "Finalização Comercial", icon: CheckCircle2 },
      { to: "/core/eventos", label: "Eventos Comerciais", icon: Ticket },
    ],
  },
  {
    label: "Produtos & Planos",
    icon: Boxes,
    items: [
      { to: "/core/planos", label: "Gestão de Planos", icon: CreditCard },
      { to: "/core/modulos", label: "Biblioteca de Módulos", icon: Boxes },
      { to: "/core/instalar-modulo", label: "Instalar Módulo", icon: Boxes },
      { to: "/core/templates", label: "Templates de Site", icon: Globe },
      { to: "/core/nichos", label: "Nichos", icon: Boxes },
      { to: "/core/estudio-visual", label: "Estúdio Visual", icon: Sparkles },
      { to: "/core/monetizacao", label: "Monetização", icon: TrendingUp },
    ],
  },
  {
    label: "Cérebro IA",
    icon: Bot,
    items: [
      { to: "/core/prompts", label: "Prompts (IA)", icon: Sparkles },
      { to: "/core/metricas-reguas", label: "Réguas & Métricas IA", icon: LineChart },
      { to: "/core/nova-implantacao", label: "IA de Implantação", icon: Bot },
    ],
  },
  {
    label: "Automação & N8N",
    icon: Workflow,
    items: [
      { to: "/core/automacao", label: "Automação (Hub)", icon: Workflow },
      { to: "/core/automacao/fluxos", label: "Fluxos", icon: Workflow },
      { to: "/core/automacao/templates", label: "Templates", icon: FileCode },
      { to: "/core/automacao/modelos-nicho", label: "Modelos por Nicho", icon: Boxes },
      { to: "/core/automacao/modelos-plano", label: "Modelos por Plano", icon: CreditCard },
      { to: "/core/automacao/modelos-tenant", label: "Modelos por Cliente", icon: Building2 },
      { to: "/core/automacao/canais", label: "Canais", icon: MessageSquare },
      { to: "/core/automacao/webhooks", label: "Webhooks", icon: Plug },
      { to: "/core/automacao/aprovacoes", label: "Aprovações", icon: CheckCircle2 },
      { to: "/core/automacao/monitoramento", label: "Monitoramento", icon: Activity },
      { to: "/core/automacao/erros", label: "Erros", icon: ShieldCheck },
      { to: "/core/automacao/historico", label: "Histórico", icon: ScrollText },
      { to: "/core/automacao/logs", label: "Logs", icon: FileSearch },
      { to: "/core/automacao/fallback-humano", label: "Fallback Humano", icon: Users },
      { to: "/core/automacao/demonstracoes", label: "Demonstrações", icon: Send },
      { to: "/core/automacao/producao", label: "Produção", icon: Server },
      { to: "/core/integracoes/n8n", label: "Integração N8N", icon: Plug },
    ],
  },
  {
    label: "Marketplace",
    icon: Handshake,
    items: [
      { to: "/core/marketplace", label: "Marketplace (Hub)", icon: Handshake },
      { to: "/core/marketplace/fornecedores", label: "Fornecedores", icon: Store },
      { to: "/core/marketplace/compradores", label: "Compradores", icon: Users },
      { to: "/core/marketplace/pedidos", label: "Pedidos", icon: Receipt },
      { to: "/core/marketplace/financeiro", label: "Financeiro B2B", icon: Banknote },
    ],
  },
  {
    label: "Cobrança & Mercado Pago",
    icon: Wallet,
    items: [
      { to: "/finance", label: "ERP Financeiro", icon: Wallet },
      { to: "/core/financeiro-master", label: "Financeiro Master", icon: TrendingUp },
      { to: "/core/financeiro-consolidado", label: "Financeiro Consolidado", icon: Wallet },
      { to: "/core/contratos", label: "Contratos", icon: FileText },
      { to: "/core/repasses", label: "Repasses", icon: Banknote },
      { to: "/admin/billing-contracts", label: "Billing (Contratos)", icon: CreditCard },
      { to: "/admin/billing-policy", label: "Régua de Cobrança", icon: ScrollText },
      { to: "/core/integracoes/mercadopago", label: "Mercado Pago", icon: CreditCard },
    ],
  },
  {
    label: "Observabilidade & Suporte",
    icon: Activity,
    items: [
      { to: "/core/observabilidade", label: "Observabilidade", icon: Activity },
      { to: "/core/diagnostico-geral", label: "Diagnóstico Geral", icon: Gauge },
      { to: "/core/integracoes/diagnostico", label: "Diagnóstico de Integrações", icon: Plug },
      { to: "/core/suporte", label: "Suporte Interno", icon: MessageSquare },
      { to: "/audit", label: "Auditoria", icon: FileSearch },
    ],
  },
  {
    label: "Governança",
    icon: KeyRound,
    items: [
      { to: "/core/administracao", label: "Administração Master", icon: ShieldCheck },
      { to: "/core/parametros", label: "Parâmetros Globais", icon: SlidersHorizontal },
      { to: "/core/configuracoes", label: "Configurações do Core", icon: SlidersHorizontal },
      { to: "/core/flags", label: "Feature Flags", icon: SlidersHorizontal },
      { to: "/core/menus", label: "Menus Dinâmicos", icon: Menu },
      { to: "/users", label: "Usuários", icon: Users },
      { to: "/permissions", label: "Permissões", icon: KeyRound },
      { to: "/settings", label: "Configurações Gerais", icon: SlidersHorizontal },
      { to: "/modules", label: "Integrações", icon: Plug },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
}

function CoreLayout() {
  const { data: me } = useCurrentUser();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => {
    for (const g of GROUPS) for (const it of g.items) if (isActive(location.pathname, it)) return { group: g, item: it };
    return null;
  }, [location.pathname]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return GROUPS;
    return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(term)) })).filter((g) => g.items.length);
  }, [q]);

  if (!me?.isImpulsionandoStaff) {
    return (
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas equipe Impulsionando acessa /adm (Core Manager).</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        {/* Breadcrumb / current */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">Core</span>
            {activeItem && (
              <>
                <span className="text-muted-foreground shrink-0">/</span>
                <span className="text-xs text-muted-foreground shrink-0">{activeItem.group.label}</span>
                <span className="text-muted-foreground shrink-0">/</span>
                <span className="text-sm font-semibold truncate">{activeItem.item.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar seção…"
                className="h-8 pl-7 w-56 text-sm"
              />
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border">
                  <Menu className="w-4 h-4" /> Menu
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Core Manager</SheetTitle>
                </SheetHeader>
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar seção…" className="h-9 pl-7 text-sm" />
                  </div>
                </div>
                <div className="overflow-y-auto scroll-contrast max-h-[calc(100vh-140px)] p-3 space-y-4">
                  {filtered.map((g) => {
                    const GIcon = g.icon;
                    return (
                      <div key={g.label}>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                          <GIcon className="w-3.5 h-3.5" /> {g.label}
                        </div>
                        <ul className="space-y-0.5">
                          {g.items.map((it) => {
                            const Icon = it.icon;
                            const active = isActive(location.pathname, it);
                            return (
                              <li key={it.to}>
                                <Link
                                  to={it.to}
                                  onClick={() => setMobileOpen(false)}
                                  className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-md ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                >
                                  <Icon className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{it.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Grouped dropdowns — desktop */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 overflow-x-auto scroll-contrast">
          {GROUPS.map((g) => {
            const GIcon = g.icon;
            const groupActive = g.items.some((i) => isActive(location.pathname, i));
            return (
              <DropdownMenu key={g.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`shrink-0 inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md transition ${
                      groupActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}
                  >
                    <GIcon className="w-4 h-4" />
                    <span>{g.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">{g.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active = isActive(location.pathname, it);
                    return (
                      <DropdownMenuItem key={it.to} asChild>
                        <Link to={it.to} className={`flex items-center gap-2 ${active ? "text-primary font-medium" : ""}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{it.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

        {/* Filtered search results — desktop */}
        {q.trim() && (
          <div className="hidden md:block border-t px-3 py-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma seção encontrada para "{q}".</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {filtered.flatMap((g) => g.items).map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setQ("")}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border hover:bg-muted"
                    >
                      <Icon className="w-3.5 h-3.5" /> {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
}
