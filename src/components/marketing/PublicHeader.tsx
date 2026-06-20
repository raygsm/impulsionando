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

function ItemLink({
  item,
  className,
  onClick,
}: {
  item: EmpresasItem;
  className?: string;
  onClick?: () => void;
}) {
  if (item.nichoSlug) {
    return (
      <Link
        to="/nichos/$slug"
        params={{ slug: item.nichoSlug }}
        onClick={onClick}
        className={className}
      >
        {item.label}
      </Link>
    );
  }
  return (
    <Link to={(item.to ?? "/empresas") as string} onClick={onClick} className={className}>
      {item.label}
    </Link>
  );
}

function MacroDetail({ macro }: { macro: EmpresasMacro }) {
  const Icon = macro.icon;
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md",
            macro.highlight
              ? "bg-gradient-primary text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{macro.label}</div>
          <p className="text-xs text-muted-foreground leading-snug">{macro.message}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Principais benefícios
          </div>
          <ul className="space-y-0.5 text-xs text-foreground/90">
            {macro.benefits.map((b) => (
              <li key={b} className="flex gap-1.5">
                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Subnichos
          </div>
          <div className="flex flex-wrap gap-1">
            {macro.items.map((it) => (
              <ItemLink
                key={`${it.label}-${it.nichoSlug ?? it.to ?? ""}`}
                item={it}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground hover:bg-accent transition-colors"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">Exemplos: </span>
            {macro.examples}
          </div>
          <div>
            <span className="font-semibold text-foreground">Módulos: </span>
            {macro.modules.join(" · ")}
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-2 pt-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link to={macro.demoTo as string}>
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Ver demonstração
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-gradient-primary text-primary-foreground">
          <Link to={macro.solutionTo as string}>Conhecer solução</Link>
        </Button>
      </div>
    </div>
  );
}

function EmpresasMenu() {
  const empresasActive = useActive("/empresas");
  const nichosActive = useActive("/nichos");
  const active = empresasActive || nichosActive;
  const [activeSlug, setActiveSlug] = useState<string>(EMPRESAS_MACROS[0]!.slug);
  const activeMacro =
    EMPRESAS_MACROS.find((m) => m.slug === activeSlug) ?? EMPRESAS_MACROS[0]!;

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
            <div className="grid grid-cols-[240px_minmax(0,1fr)] w-[820px]">
              <ul
                className="border-r border-border/60 p-2 bg-muted/30 rounded-l-md"
                aria-label="Macrocategorias"
              >
                {EMPRESAS_MACROS.map((m) => {
                  const Icon = m.icon;
                  const isActive = m.slug === activeMacro.slug;
                  return (
                    <li key={m.slug}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveSlug(m.slug)}
                        onFocus={() => setActiveSlug(m.slug)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                          m.highlight && "border border-primary/30",
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-md",
                            m.highlight
                              ? "bg-gradient-primary text-primary-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate font-medium">{m.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                      </button>
                    </li>
                  );
                })}
                <li className="mt-2 pt-2 border-t border-border/60">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/empresas"
                      className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/60"
                    >
                      Ver visão geral →
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
              <MacroDetail macro={activeMacro} />
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
                    {EMPRESAS_MACROS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <details key={m.slug} className="group">
                          <summary
                            className={cn(
                              "list-none cursor-pointer px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-accent/60 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              m.highlight && "font-semibold",
                            )}
                          >
                            <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">{m.label}</span>
                            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="ml-6 pl-2 border-l border-border/60 mt-1 mb-2 flex flex-col gap-0.5">
                            <p className="px-3 py-1 text-[11px] text-muted-foreground leading-snug">
                              {m.message}
                            </p>
                            {m.items.map((it) => (
                              <ItemLink
                                key={`${m.slug}-${it.label}`}
                                item={it}
                                onClick={() => setOpen(false)}
                                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60"
                              />
                            ))}
                            <div className="flex gap-1 px-1 pt-1">
                              <Link
                                to={m.demoTo as string}
                                onClick={() => setOpen(false)}
                                className="flex-1 text-center px-2 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-foreground"
                              >
                                Demonstração
                              </Link>
                              <Link
                                to={m.solutionTo as string}
                                onClick={() => setOpen(false)}
                                className="flex-1 text-center px-2 py-1 text-[11px] rounded bg-gradient-primary text-primary-foreground"
                              >
                                Solução
                              </Link>
                            </div>
                          </div>
                        </details>
                      );
                    })}
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
