import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Menu, LogIn, Sparkles, PlayCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import {
  EMPRESAS_MACROS,
  type EmpresasItem,
  type EmpresasMacro,
} from "@/components/marketing/empresasMacros";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

type NavItem = { to: string; label: string; exact?: boolean };

/**
 * Menu principal por jornada. "Empresas" abre um submenu com a lista de Nichos
 * e atalhos para Recursos, Demonstrações e Planos.
 */
const NAV: NavItem[] = [
  { to: "/", label: "Início", exact: true },
  { to: "/white-label", label: "White Label" },
  { to: "/clube", label: "Clube" },
  { to: "/demo", label: "Demonstrações" },
  { to: "/escolher-nicho", label: "Planos" },
];

function useActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavLink({
  to,
  label,
  exact,
  onClick,
}: {
  to: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "text-foreground font-semibold bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      )}
    >
      {label}
    </Link>
  );
}

function EmpresasMenu() {
  const empresasActive = useActive("/empresas");
  const nichosActive = useActive("/nichos");
  const active = empresasActive || nichosActive;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              "h-auto px-3 py-1.5 text-sm rounded-md bg-transparent",
              active
                ? "text-foreground font-semibold bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            Empresas
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-0 w-[640px]">
              <div className="p-4 bg-gradient-primary text-primary-foreground rounded-l-md flex flex-col gap-3">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  Para empresas
                </div>
                <h3 className="text-lg font-bold leading-tight">
                  A plataforma certa para o seu nicho
                </h3>
                <p className="text-sm opacity-90 leading-snug">
                  Módulos, jornadas e demonstrações pensados para cada tipo de
                  operação. Escolha por onde começar.
                </p>
                <div className="mt-auto flex flex-col gap-2">
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link to="/empresas">Ver visão geral</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full bg-white/10 border-white/40 text-primary-foreground hover:bg-white/20"
                  >
                    <Link to="/escolher-nicho">Ver planos</Link>
                  </Button>
                </div>
              </div>

              <div className="p-3 max-h-[420px] overflow-y-auto">
                <h2
                  id="nichos-submenu-heading"
                  className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Nichos
                </h2>
                <ul
                  className="grid grid-cols-1 gap-1"
                  aria-labelledby="nichos-submenu-heading"
                >
                  {NICHO_DETAILS.map((n) => {
                    const Icon = n.icon;
                    return (
                      <li key={n.slug}>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/nichos/$slug"
                            params={{ slug: n.slug }}
                            aria-label={`${n.shortLabel}: ${n.cardDesc}`}
                            className="flex items-start gap-3 rounded-md p-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                          >
                            <span
                              aria-hidden="true"
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium text-foreground truncate">
                                {n.shortLabel}
                              </span>
                              <span className="block text-xs text-muted-foreground line-clamp-2">
                                {n.cardDesc}
                              </span>
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 pt-2 border-t border-border/60 grid grid-cols-3 gap-1 text-xs">
                  <Link
                    to="/empresas"
                    className="px-2 py-1.5 rounded hover:bg-accent text-center text-muted-foreground hover:text-foreground"
                  >
                    Recursos
                  </Link>
                  <Link
                    to="/demo"
                    className="px-2 py-1.5 rounded hover:bg-accent text-center text-muted-foreground hover:text-foreground"
                  >
                    Demos
                  </Link>
                  <Link
                    to="/escolher-nicho"
                    className="px-2 py-1.5 rounded hover:bg-accent text-center text-muted-foreground hover:text-foreground"
                  >
                    Planos
                  </Link>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [nichosOpen, setNichosOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center shrink-0 [&_img]:!h-56">
          <LogoImpulsionando variant="light" size="xl" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Menu principal">
          <NavLink to="/" label="Início" exact />
          <EmpresasMenu />
          {NAV.filter((n) => n.to !== "/").map((it) => (
            <NavLink key={it.to} {...it} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link to="/auth">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-lg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <Link to="/orcamento">
              <Sparkles className="w-4 h-4" /> Começar Agora
            </Link>
          </Button>

          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden xl:inline-flex">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> Impulsionito
            </a>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                <NavLink to="/" label="Início" exact onClick={() => setOpen(false)} />

                {/* Empresas → submenu Nichos (acordeão no mobile) */}
                <button
                  type="button"
                  onClick={() => setNichosOpen((v) => !v)}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    nichosOpen
                      ? "text-foreground font-semibold bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                  )}
                  aria-expanded={nichosOpen}
                  aria-controls="nichos-mobile-submenu"
                >
                  Empresas
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 transition-transform",
                      nichosOpen && "rotate-180",
                    )}
                  />
                </button>
                {nichosOpen ? (
                  <div
                    id="nichos-mobile-submenu"
                    role="region"
                    aria-label="Submenu de nichos"
                    className="ml-2 pl-3 border-l border-border/60 flex flex-col gap-0.5"
                  >
                    <Link
                      to="/empresas"
                      onClick={() => setOpen(false)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Visão geral
                    </Link>
                    <h3 className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Nichos
                    </h3>
                    {NICHO_DETAILS.map((n) => (
                      <Link
                        key={n.slug}
                        to="/nichos/$slug"
                        params={{ slug: n.slug }}
                        onClick={() => setOpen(false)}
                        aria-label={n.shortLabel}
                        className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <n.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{n.shortLabel}</span>
                      </Link>
                    ))}
                    <Link
                      to="/demo"
                      onClick={() => setOpen(false)}
                      className="px-3 py-1.5 mt-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Demonstrações
                    </Link>
                    <Link
                      to="/escolher-nicho"
                      onClick={() => setOpen(false)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Planos
                    </Link>
                  </div>
                ) : null}

                {NAV.filter((n) => n.to !== "/").map((it) => (
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
