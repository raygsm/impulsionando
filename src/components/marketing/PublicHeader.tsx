import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Menu, LogIn, Sparkles, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

/**
 * IA do menu por jornada:
 *  - Início
 *  - Empresas        → /empresas      (jornada B2B: nichos, módulos, planos, demos)
 *  - White Label     → /white-label   (jornada para quem quer ser provedor SaaS)
 *  - Clube           → /clube         (jornada do consumidor final)
 *  - Demonstrações   → /demo
 *  - Planos          → /planos
 *  - Entrar          → /auth
 *  + CTA destacado "Começar Agora" sempre visível.
 */
type NavItem = { to: string; label: string; exact?: boolean };

const NAV: NavItem[] = [
  { to: "/",            label: "Início",        exact: true },
  { to: "/empresas",    label: "Empresas" },
  { to: "/white-label", label: "White Label" },
  { to: "/clube",       label: "Clube" },
  { to: "/demo",        label: "Demonstrações" },
  { to: "/planos",      label: "Planos" },
];

function useActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavLink({ to, label, exact, onClick }: { to: string; label: string; exact?: boolean; onClick?: () => void }) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
        active
          ? "text-foreground font-semibold bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      )}
    >
      {label}
    </Link>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center shrink-0 [&_img]:!h-56">
          <LogoImpulsionando variant="light" size="xl" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Menu principal">
          {NAV.map((it) => (
            <NavLink key={it.to} {...it} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link to="/auth"><LogIn className="w-4 h-4" /> Entrar</Link>
          </Button>

          {/* CTA destaque: sempre visível, hover forte, cor fixa */}
          <Button
            asChild
            size="sm"
            className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-lg hover:brightness-110 transition-all"
          >
            <Link to="/orcamento"><Sparkles className="w-4 h-4" /> Começar Agora</Link>
          </Button>

          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden xl:inline-flex">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> Impulsionito
            </a>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((it) => (
                  <NavLink key={it.to} {...it} onClick={() => setOpen(false)} />
                ))}
                <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-border">
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/orcamento" onClick={() => setOpen(false)}>
                      <Sparkles className="w-4 h-4 mr-2" /> Começar Agora
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/demo" onClick={() => setOpen(false)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Ver Demonstrações
                    </Link>
                  </Button>
                  <Button asChild className="btn-whatsapp">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" /> Falar com Impulsionito
                    </a>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" /> Entrar
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
