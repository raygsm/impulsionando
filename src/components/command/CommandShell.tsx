import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Target,
  Headphones,
  Workflow,
  Sparkles,
  Settings,
  Search,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { signOutSafely } from "@/lib/sign-out";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { GlobalCommandPalette } from "@/components/command/GlobalCommandPalette";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/command", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/command/clientes", label: "Clientes", icon: Users },
  { to: "/command/aprovacoes", label: "Aprovações", icon: CheckCircle2 },
  { to: "/command/catalogo", label: "Catálogo", icon: BookOpen },
  { to: "/command/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/command/comercial", label: "Comercial", icon: Target },
  { to: "/command/atendimento", label: "Atendimento", icon: Headphones },
  { to: "/command/automacoes", label: "Automações", icon: Workflow },
  { to: "/command/ia", label: "IA", icon: Sparkles },
  { to: "/command/config", label: "Configurações", icon: Settings },
];

export function CommandShell() {
  const { data: me, isLoading } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/auth" });
  }, [me, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && me && !me.isImpulsionandoStaff) {
      navigate({ to: "/" });
    }
  }, [me, isLoading, navigate]);

  if (isLoading || !me) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex bg-background">
      <aside className="hidden lg:flex flex-col w-60 border-r bg-sidebar text-sidebar-foreground shrink-0">
        <div className="h-14 px-4 flex items-center border-b border-sidebar-border">
          <Link to="/command" className="font-semibold tracking-tight text-sm">
            Impulsionando <span className="text-muted-foreground">/ Command</span>
          </Link>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as "/command"}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          <div className="truncate">{me.user.email}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide">Modo Master</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card/50 backdrop-blur flex items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="relative flex-1 max-w-xl text-left group"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <span className="flex items-center h-9 pl-9 pr-3 rounded-md border bg-background text-sm text-muted-foreground group-hover:border-foreground/20">
              Pesquisar cliente, ticket, automação…
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border bg-muted font-mono">⌘K</kbd>
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOutSafely({ queryClient: qc, navigate })}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <GlobalCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
