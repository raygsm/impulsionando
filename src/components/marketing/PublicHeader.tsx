import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, PlayCircle, Menu, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20um%20especialista%20da%20Impulsionando.";

type MainLink = { to: "/" | "/empresas" | "/white-label" | "/consumidor" | "/demo" | "/planos"; label: string; exact?: boolean };

const MAIN_NAV: MainLink[] = [
  { to: "/", label: "Início", exact: true },
  { to: "/empresas", label: "Empresas" },
  { to: "/white-label", label: "White Label" },
  { to: "/consumidor", label: "Consumidor" },
  { to: "/demo", label: "Demonstrações" },
  { to: "/planos", label: "Planos" },
];

function useIsActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function HeaderLink({ item, onClick }: { item: MainLink; onClick?: () => void }) {
  const active = useIsActive(item.to, item.exact);
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`px-3 py-2.5 lg:px-4 lg:py-3 text-sm lg:text-[15px] transition-colors rounded-md ${
        active ? "text-foreground font-medium bg-accent" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-24 sm:h-32 md:h-40 lg:h-48 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <LogoImpulsionando variant="light" size="2xl" />

        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {MAIN_NAV.map((item) => (
            <HeaderLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          <Button asChild size="sm" className="gap-2 bg-gradient-primary shadow-elegant hover:shadow-card-hover hidden md:inline-flex lg:h-10 lg:px-4">
            <Link to="/demo">
              <PlayCircle className="w-4 h-4" />
              <span>Ver demonstração</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden md:inline-flex lg:h-10 lg:px-4">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Falar com especialista</span>
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex lg:h-10 lg:px-3 gap-1.5">
            <Link to="/auth">
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-2">
                {MAIN_NAV.map((item) => (
                  <HeaderLink key={item.to} item={item} onClick={() => setMobileOpen(false)} />
                ))}

                <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/demo" onClick={() => setMobileOpen(false)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Ver demonstração
                    </Link>
                  </Button>
                  <Button asChild className="btn-whatsapp">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" /> Falar com especialista
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
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
