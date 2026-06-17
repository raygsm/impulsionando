import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Menu, LogIn, ChevronDown, Sparkles, Boxes, MessagesSquare, CalendarRange, CreditCard, BarChart3, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

type SubItem = { to: string; label: string; desc?: string; icon?: React.ComponentType<{ className?: string }> };
type MenuGroup = { label: string; to?: string; items?: SubItem[] };

const SOLUCOES: SubItem[] = [
  { to: "/modulos", label: "CRM & Atendimento", desc: "Leads, clientes, pipeline e SAC", icon: MessagesSquare },
  { to: "/modulos", label: "Automação & Comunicação", desc: "E-mail, WhatsApp, SMS e voz", icon: Sparkles },
  { to: "/modulos", label: "Agenda & Reservas", desc: "Agendamentos, mesas, salas", icon: CalendarRange },
  { to: "/modulos", label: "Pagamentos", desc: "Pix, cartão, recorrência", icon: CreditCard },
  { to: "/modulos", label: "BI & Dashboards", desc: "Métricas, MRR e gestão", icon: BarChart3 },
  { to: "/nichos", label: "Por nicho", desc: "Imobiliária, clínica, restaurante e mais", icon: Boxes },
  { to: "/modulos", label: "Ver todos os módulos", desc: "Catálogo completo", icon: Boxes },
];

const NAV: MenuGroup[] = [
  { label: "Início", to: "/" },
  { label: "Soluções", items: SOLUCOES },
  { label: "Demonstrações", to: "/demo" },
  { label: "Planos", to: "/planos" },
];



function useActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavLink({ to, label, exact, onClick }: { to: string; label: string; exact?: boolean; onClick?: () => void }) {
  const active = useActive(to, exact ?? to === "/");
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "px-2.5 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
        active ? "text-foreground font-medium bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
      )}
    >
      {label}
    </Link>
  );
}

function NavDropdown({ label, items }: { label: string; items: SubItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors whitespace-nowrap"
        >
          {label}
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2">
        <div className="grid gap-0.5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.label}
                to={it.to}
                className="flex items-start gap-3 rounded-md px-2.5 py-2 hover:bg-accent transition-colors"
              >
                {Icon ? (
                  <span className="shrink-0 grid place-items-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{it.label}</span>
                  {it.desc ? <span className="block text-xs text-muted-foreground leading-snug">{it.desc}</span> : null}
                </span>
              </Link>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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



        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV.map((g) =>
            g.items ? (
              <NavDropdown key={g.label} label={g.label} items={g.items} />
            ) : (
              <NavLink key={g.label} to={g.to!} label={g.label} />
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link to="/auth"><LogIn className="w-4 h-4" /> Entrar</Link>
          </Button>
          <Button asChild size="sm" className="gap-2 bg-gradient-primary shadow-elegant hidden md:inline-flex">
            <Link to="/orcamento"><Sparkles className="w-4 h-4" /> Começar agora</Link>
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
                {NAV.map((g) =>
                  g.items ? (
                    <details key={g.label} className="group">
                      <summary className="flex items-center justify-between px-2.5 py-2 text-sm rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent/50">
                        {g.label}
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-1 ml-2 pl-2 border-l border-border flex flex-col gap-0.5">
                        {g.items.map((it) => (
                          <Link key={it.label} to={it.to} onClick={() => setOpen(false)} className="px-2.5 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
                            {it.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <NavLink key={g.label} to={g.to!} label={g.label} onClick={() => setOpen(false)} />
                  ),
                )}
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
