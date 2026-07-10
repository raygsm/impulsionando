// Shell da área logada Marocas (Fase B — frontend-only).
// Sidebar por perfil + topbar minimalista + breadcrumbs + slot de quick actions.
// Nenhuma chamada real de auth/backend acontece aqui: o "perfil" é lido do
// localStorage (mock) e pode ser trocado via seletor no rodapé da sidebar.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  CalendarRange,
  CalendarClock,
  Sparkles,
  Wrench,
  PackageOpen,
  Users2,
  HardHat,
  Wallet,
  BarChart3,
  Zap,
  Brain,
  Settings,
  Menu as MenuIcon,
  X,
  ChevronRight,
  LogOut,
  UserRound,
  Building2,
  ClipboardList,
  ShieldCheck,
  Route as RouteIcon,
  History,
  Star,
  LifeBuoy,
  Map as MapIcon,
  DollarSign,
  Compass,
  ListChecks,
  BellRing,
} from "lucide-react";
import { MaroquitoFab } from "./MarocasHelpFab";
import marocasLogo from "@/assets/marocas-logo.png.asset.json";

export type MarocasProfile = "anfitriao" | "hospede" | "prestador";

const STORAGE_KEY = "marocas.perfil.mock";

export function useMarocasProfile(): [MarocasProfile, (p: MarocasProfile) => void] {
  const [profile, setProfile] = useState<MarocasProfile>("anfitriao");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as MarocasProfile | null;
      if (saved === "anfitriao" || saved === "hospede" || saved === "prestador") {
        setProfile(saved);
      }
    } catch {}
  }, []);
  const change = (p: MarocasProfile) => {
    setProfile(p);
    try { window.localStorage.setItem(STORAGE_KEY, p); } catch {}
  };
  return [profile, change];
}

interface NavItem { label: string; to: string; icon: ReactNode }

const NAV_ANFITRIAO: NavItem[] = [
  { label: "Dashboard", to: "/marocas/app/anfitriao", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Meus imóveis", to: "/marocas/app/anfitriao/imoveis", icon: <Home className="h-4 w-4" /> },
  { label: "Reservas", to: "/marocas/app/anfitriao/reservas", icon: <CalendarRange className="h-4 w-4" /> },
  { label: "Agenda operacional", to: "/marocas/app/anfitriao/agenda", icon: <CalendarClock className="h-4 w-4" /> },
  { label: "Limpezas", to: "/marocas/app/anfitriao/limpezas", icon: <Sparkles className="h-4 w-4" /> },
  { label: "Manutenções", to: "/marocas/app/anfitriao/manutencoes", icon: <Wrench className="h-4 w-4" /> },
  { label: "Reposições", to: "/marocas/app/anfitriao/reposicoes", icon: <PackageOpen className="h-4 w-4" /> },
  { label: "Hóspedes", to: "/marocas/app/anfitriao/hospedes", icon: <Users2 className="h-4 w-4" /> },
  { label: "Prestadores", to: "/marocas/app/anfitriao/prestadores", icon: <HardHat className="h-4 w-4" /> },
  { label: "Financeiro", to: "/marocas/app/anfitriao/financeiro", icon: <Wallet className="h-4 w-4" /> },
  { label: "Relatórios", to: "/marocas/app/anfitriao/relatorios", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Automações", to: "/marocas/app/anfitriao/automacoes", icon: <Zap className="h-4 w-4" /> },
  { label: "Cérebro IA", to: "/marocas/app/anfitriao/cerebro-ia", icon: <Brain className="h-4 w-4" /> },
  { label: "Configurações", to: "/marocas/app/anfitriao/configuracoes", icon: <Settings className="h-4 w-4" /> },
];

const NAV_HOSPEDE: NavItem[] = [
  { label: "Minha reserva", to: "/marocas/app/hospede", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Dados do imóvel", to: "/marocas/app/hospede/imovel", icon: <Home className="h-4 w-4" /> },
  { label: "Acesso & senha", to: "/marocas/app/hospede/acesso", icon: <ShieldCheck className="h-4 w-4" /> },
  { label: "Regras da casa", to: "/marocas/app/hospede/regras", icon: <ListChecks className="h-4 w-4" /> },
  { label: "Suporte 24h", to: "/marocas/app/hospede/suporte", icon: <LifeBuoy className="h-4 w-4" /> },
  { label: "Roteiros no Rio", to: "/marocas/app/hospede/roteiros", icon: <MapIcon className="h-4 w-4" /> },
  { label: "Histórico", to: "/marocas/app/hospede/historico", icon: <History className="h-4 w-4" /> },
  { label: "Avaliação", to: "/marocas/app/hospede/avaliacao", icon: <Star className="h-4 w-4" /> },
];

const NAV_PRESTADOR: NavItem[] = [
  { label: "Minha agenda", to: "/marocas/app/prestador", icon: <CalendarClock className="h-4 w-4" /> },
  { label: "Serviços disponíveis", to: "/marocas/app/prestador/disponiveis", icon: <BellRing className="h-4 w-4" /> },
  { label: "Aceitos", to: "/marocas/app/prestador/aceitos", icon: <ListChecks className="h-4 w-4" /> },
  { label: "Em andamento", to: "/marocas/app/prestador/andamento", icon: <RouteIcon className="h-4 w-4" /> },
  { label: "Histórico", to: "/marocas/app/prestador/historico", icon: <History className="h-4 w-4" /> },
  { label: "Valores", to: "/marocas/app/prestador/valores", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Regiões", to: "/marocas/app/prestador/regioes", icon: <Compass className="h-4 w-4" /> },
  { label: "Disponibilidade", to: "/marocas/app/prestador/disponibilidade", icon: <CalendarRange className="h-4 w-4" /> },
  { label: "Meus dados", to: "/marocas/app/prestador/cadastro", icon: <UserRound className="h-4 w-4" /> },
  { label: "Avaliações", to: "/marocas/app/prestador/avaliacoes", icon: <Star className="h-4 w-4" /> },
];

export const NAV_BY_PROFILE: Record<MarocasProfile, NavItem[]> = {
  anfitriao: NAV_ANFITRIAO,
  hospede: NAV_HOSPEDE,
  prestador: NAV_PRESTADOR,
};

const PROFILE_META: Record<MarocasProfile, { label: string; icon: ReactNode; hint: string }> = {
  anfitriao: { label: "Anfitrião", icon: <Building2 className="h-4 w-4" />, hint: "Proprietário / gestor" },
  hospede:   { label: "Hóspede",   icon: <UserRound className="h-4 w-4" />, hint: "Estadia atual" },
  prestador: { label: "Prestador", icon: <HardHat className="h-4 w-4" />,  hint: "Operação de campo" },
};

export interface MarocasAppShellProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}

export function MarocasAppShell({ title, description, breadcrumbs, actions, children }: MarocasAppShellProps) {
  const [profile, setProfile] = useMarocasProfile();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = NAV_BY_PROFILE[profile];

  return (
    <div
      data-tenant="marocas"
      className="min-h-dvh bg-background flex text-foreground"
      style={{
        ["--marocas-coral" as any]: "oklch(0.68 0.14 32)",
        ["--marocas-sand" as any]: "oklch(0.94 0.03 80)",
      }}
    >
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card">
        <SidebarHeader />
        <NavList nav={nav} pathname={location.pathname} />
        <SidebarFooter profile={profile} setProfile={setProfile} />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card border-r flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-3 border-b">
              <SidebarHeader compact />
              <button aria-label="Fechar menu" className="p-2 rounded-md hover:bg-muted" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList nav={nav} pathname={location.pathname} onNavigate={() => setOpen(false)} />
            <SidebarFooter profile={profile} setProfile={setProfile} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur h-14 px-3 sm:px-6 flex items-center gap-3">
          <button
            aria-label="Abrir menu"
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {PROFILE_META[profile].label} · Marocas
            </div>
            <div className="text-sm font-semibold truncate">{title}</div>
          </div>
          <Link
            to="/marocas"
            className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-primary"
          >
            Ir para o site público
          </Link>
        </header>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="px-3 sm:px-6 py-2 text-xs text-muted-foreground flex items-center gap-1 flex-wrap border-b bg-muted/30">
            <Link to="/marocas/app" className="hover:text-primary">Painel</Link>
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {c.to ? <Link to={c.to} className="hover:text-primary">{c.label}</Link> : <span className="text-foreground font-medium">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}

        {/* Page header + actions */}
        <div className="px-3 sm:px-6 pt-6 pb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        <main className="flex-1 px-3 sm:px-6 pb-20 lg:pb-10">{children}</main>
      </div>

      <MaroquitoFab />
    </div>
  );
}

function SidebarHeader({ compact }: { compact?: boolean } = {}) {
  return (
    <Link to="/marocas/app" className="flex items-center gap-2.5 p-4 border-b">
      <span className="grid place-items-center h-9 w-9 rounded-full bg-white shadow-sm overflow-hidden ring-1 ring-black/5">
        <img src={marocasLogo.url} alt="" className="h-8 w-8 object-contain" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight">Marocas</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Painel</span>
        </span>
      )}
    </Link>
  );
}

function NavList({ nav, pathname, onNavigate }: { nav: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${
              active
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "hover:bg-muted text-foreground/85"
            }`}
          >
            <span className={active ? "opacity-100" : "opacity-70"}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ profile, setProfile }: { profile: MarocasProfile; setProfile: (p: MarocasProfile) => void }) {
  return (
    <div className="border-t p-3 space-y-2 bg-muted/30">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">Perfil (mock)</div>
      <div className="grid grid-cols-3 gap-1">
        {(["anfitriao", "hospede", "prestador"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProfile(p)}
            className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition ${
              profile === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {PROFILE_META[p].label}
          </button>
        ))}
      </div>
      <Link
        to="/marocas/login"
        className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-background transition"
      >
        <LogOut className="h-3.5 w-3.5" /> Sair (mock)
      </Link>
      <p className="text-[10px] text-muted-foreground leading-relaxed px-1">
        Perfil apenas visual. Autenticação real e permissões serão conectadas pelo Codex.
      </p>
    </div>
  );
}
