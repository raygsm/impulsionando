import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, PlayCircle, Menu, LogIn, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

type Item = { to: string; label: string; exact?: boolean; external?: boolean };

const MAIN_NAV: Item[] = [
  { to: "/", label: "Início", exact: true },
  { to: "/modulos", label: "Soluções" },
  { to: "/nichos", label: "Nichos" },
  { to: "/demo", label: "Demonstrações" },
  { to: "/planos", label: "Planos" },
  { to: "/orcamento", label: "Orçamento" },
  { to: "https://impulsionandobrasil.com.br", label: "Impulsionando Brasil", external: true },
];

function useActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavItem({ item, onClick }: { item: Item; onClick?: () => void }) {
  const active = useActive(item.to, item.exact);
  const cls = `px-3 py-2 text-sm transition-colors rounded-md whitespace-nowrap ${
    active ? "text-foreground font-medium bg-accent" : "text-muted-foreground hover:text-foreground"
  }`;
  if (item.external) {
    return (
      <a href={item.to} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls + " inline-flex items-center gap-1"}>
        {item.label} <ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  return <Link to={item.to} onClick={onClick} className={cls}>{item.label}</Link>;
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center shrink-0">
          <LogoImpulsionando variant="light" size="xl" />
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5">
          {MAIN_NAV.map((i) => <NavItem key={i.to} item={i} />)}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-2 bg-gradient-primary shadow-elegant hidden md:inline-flex">
            <Link to="/demo"><PlayCircle className="w-4 h-4" /> Testar Demonstração</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 hidden lg:inline-flex">
            <Link to="/orcamento">Montar meu Sistema</Link>
          </Button>
          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden md:inline-flex">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden xl:inline">Impulsionito</span>
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link to="/auth"><LogIn className="w-4 h-4" /> Entrar</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {MAIN_NAV.map((i) => <NavItem key={i.to} item={i} onClick={() => setOpen(false)} />)}
                <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-border">
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/demo" onClick={() => setOpen(false)}><PlayCircle className="w-4 h-4 mr-2" /> Testar Demonstração</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/orcamento" onClick={() => setOpen(false)}>Montar meu Sistema</Link>
                  </Button>
                  <Button asChild className="btn-whatsapp">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" /> Falar com Impulsionito
                    </a>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/auth" onClick={() => setOpen(false)}><LogIn className="w-4 h-4 mr-2" /> Entrar</Link>
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
