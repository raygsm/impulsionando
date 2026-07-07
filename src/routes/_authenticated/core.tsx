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
  Megaphone, FileCode, Upload, ChevronDown, Menu, Search, type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core")({
  head: () => ({ meta: [{ title: "/adm — Impulsionando Core" }, { name: "robots", content: "noindex" }] }),
  component: CoreLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { to: "/core", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/core/saude", label: "Saúde", icon: HeartPulse },
      { to: "/core/financeiro-master", label: "Financeiro Master", icon: TrendingUp },
      { to: "/core/financeiro-consolidado", label: "Financeiro Consolidado", icon: Wallet },
    ],
  },
  {
    label: "Clientes & CRM",
    icon: Building2,
    items: [
      { to: "/core/clientes", label: "Clientes (360)", icon: Building2 },
      { to: "/core/testes", label: "Testes", icon: FlaskConical },
      { to: "/crm/board", label: "CRM", icon: KanbanSquare },
      { to: "/core/eventos", label: "Eventos", icon: MessageSquare },
      { to: "/core/marketing-leads", label: "Leads /marketing", icon: Megaphone },
      { to: "/core/marketing-pages", label: "CMS /marketing", icon: FileCode },
      { to: "/core/importar-clientes", label: "Importar Clientes (CSV)", icon: Upload },
      { to: "/marketing", label: "Impulsionando Brasil", icon: Sparkles },
      { to: "/core/finalizacao-comercial", label: "Finalização Comercial", icon: CheckCircle2 },
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
      { to: "/core/prompts", label: "Prompts (IA)", icon: Sparkles },
    ],
  },
  {
    label: "Implantação",
    icon: Rocket,
    items: [
      { to: "/core/nova-implantacao", label: "Nova Implantação (IA)", icon: Sparkles },
      { to: "/core/criar-projeto", label: "Criar Projeto (Fábrica)", icon: Rocket },
      { to: "/core/implantacoes", label: "Implantações", icon: Rocket },
      { to: "/core/releases", label: "Releases (DEV→PROD)", icon: Rocket },
      { to: "/core/dominios", label: "Domínios dos Tenants", icon: Globe },
      { to: "/admin/billing-policy", label: "Régua / Domínios", icon: Globe },
    ],
  },
  {
    label: "Financeiro & Billing",
    icon: Wallet,
    items: [
      { to: "/finance", label: "ERP / Financeiro", icon: Wallet },
      { to: "/admin/billing-contracts", label: "Billing", icon: CreditCard },
    ],
  },
  {
    label: "Governança",
    icon: KeyRound,
    items: [
      { to: "/core/parametros", label: "Parâmetros Globais", icon: SlidersHorizontal },
      { to: "/users", label: "Usuários", icon: Users },
      { to: "/permissions", label: "Permissões", icon: KeyRound },
      { to: "/audit", label: "Auditoria", icon: FileSearch },
      { to: "/settings", label: "Configurações", icon: SlidersHorizontal },
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
                <div className="overflow-y-auto max-h-[calc(100vh-140px)] p-3 space-y-4">
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
        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
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
