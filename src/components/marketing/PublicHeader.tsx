import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Menu, LogIn, Sparkles, PlayCircle, ChevronDown, ChevronRight, Target, HelpCircle, Building2, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
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
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { cn } from "@/lib/utils";

const WHATSAPP_NICHO_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20ajuda%20para%20escolher%20o%20meu%20nicho%20na%20Impulsionando.";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

type NavItem = {
  to: string;
  label: string;
  exact?: boolean;
  search?: Record<string, string>;
};

/**
 * Menu principal por jornada. "Empresas" abre um submenu com a lista de Nichos
 * e atalhos para Recursos, Demonstrações e Planos.
 */
const NAV: NavItem[] = [
  { to: "/", label: "Início", exact: true },
  { to: "/clube", label: "Clube" },
  { to: "/planos", label: "Empresas", search: { tab: "empresas" } },
  { to: "/planos", label: "White Label", search: { tab: "white-label" } },
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
  search,
}: {
  to: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
  search?: Record<string, string>;
}) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      search={search as never}
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

function groupItems(items: EmpresasItem[]) {
  const map = new Map<string, { key: string; nichoSlug?: string; to?: string; labels: string[] }>();
  for (const it of items) {
    const key = it.nichoSlug ? `n:${it.nichoSlug}` : `t:${it.to ?? "/empresas"}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.labels.includes(it.label)) existing.labels.push(it.label);
    } else {
      map.set(key, { key, nichoSlug: it.nichoSlug, to: it.to, labels: [it.label] });
    }
  }
  return Array.from(map.values());
}

function MacroDetail({ macro }: { macro: EmpresasMacro }) {
  const Icon = macro.icon;
  const groups = groupItems(macro.items);
  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="flex items-start gap-3 pb-3 border-b border-border/60">
        <span
          aria-hidden="true"
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            macro.highlight
              ? "bg-gradient-primary text-primary-foreground shadow-sm"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">{macro.label}</h3>
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
              {groups.length} {groups.length === 1 ? "destino" : "destinos"} · {macro.modules.length} módulos
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
            {macro.message}
          </p>
        </div>
      </div>

      {/* Conteúdo: 2 colunas (destinos + insights) */}
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 py-3 flex-1 min-h-0">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Nichos atendidos
          </div>
          <ul className="space-y-0.5">
            {groups.map((g) => {
              const primary = g.labels[0]!;
              const synonyms = g.labels.slice(1);
              const item: EmpresasItem = { label: primary, nichoSlug: g.nichoSlug, to: g.to };
              return (
                <li key={g.key}>
                  <ItemLink
                    item={item}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-accent/60 hover:text-primary transition-colors"
                  />
                  {synonyms.length > 0 ? (
                    <div className="px-2 -mt-0.5 pb-0.5 text-[10px] text-muted-foreground/80 leading-tight">
                      {synonyms.join(" · ")}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 flex flex-col gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Por que escolher
            </div>
            <ul className="space-y-1 text-xs text-foreground/90">
              {macro.benefits.map((b) => (
                <li key={b} className="flex gap-1.5">
                  <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                  <span className="leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Módulos
            </div>
            <div className="flex flex-wrap gap-1">
              {macro.modules.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground/80 leading-snug">
            <span className="font-semibold text-foreground/80">Exemplos: </span>
            {macro.examples}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-2 pt-3 border-t border-border/60">
        <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
          <Link to={macro.demoTo as string}>
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Ver demonstração
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1 h-8 text-xs bg-gradient-primary text-primary-foreground">
          <Link to={macro.solutionTo as string}>Conhecer solução →</Link>
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
            <div className="grid grid-cols-[220px_minmax(0,1fr)] w-[760px]">
              <ul
                className="border-r border-border/60 p-2 bg-muted/30 rounded-l-md flex flex-col"
                aria-label="Macrocategorias"
              >
                <li className="px-2 pt-1 pb-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Setores
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 tabular-nums">
                    {EMPRESAS_MACROS.length} verticais
                  </div>
                </li>
                {EMPRESAS_MACROS.map((m) => {
                  const Icon = m.icon;
                  const isActive = m.slug === activeMacro.slug;
                  const count = groupItems(m.items).length;
                  return (
                    <li key={m.slug}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveSlug(m.slug)}
                        onFocus={() => setActiveSlug(m.slug)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                          m.highlight && !isActive && "ring-1 ring-primary/20",
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-md",
                            m.highlight
                              ? "bg-gradient-primary text-primary-foreground"
                              : isActive
                                ? "bg-primary/15 text-primary"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                        <span className="flex-1 truncate font-medium text-xs">{m.label}</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/70">
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li className="mt-auto pt-2 border-t border-border/60">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/empresas"
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-background/60"
                    >
                      Visão geral
                      <ChevronRight className="h-3 w-3" />
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

function NichosMenu() {
  const active = useActive("/nichos") || useActive("/escolher-nicho");
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
            Nichos
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-[240px_minmax(0,1fr)] w-[780px]">
              {/* Rail de jornada do lead — CTA-first */}
              <div className="border-r border-border/60 p-3 bg-gradient-to-br from-primary/10 via-muted/30 to-accent/5 rounded-l-md flex flex-col gap-2">
                <div className="px-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Sua jornada
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Escolha por onde começar:
                  </div>
                </div>

                <NavigationMenuLink asChild>
                  <Link
                    to="/nichos"
                    className="group rounded-lg border border-primary/20 bg-background/80 backdrop-blur p-3 hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Já sei meu nicho</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">
                      Ver soluções, jornada e demo do meu segmento.
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-primary group-hover:gap-1.5 transition-all">
                      Explorar nichos <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </NavigationMenuLink>

                <NavigationMenuLink asChild>
                  <Link
                    to="/escolher-nicho"
                    className="group rounded-lg border bg-background/80 backdrop-blur p-3 hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <HelpCircle className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-semibold text-foreground">Não sei ainda</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug">
                      Te ajudamos a descobrir em 2 minutos.
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-accent group-hover:gap-1.5 transition-all">
                      Descobrir meu nicho <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </NavigationMenuLink>

                <NavigationMenuLink asChild>
                  <Link
                    to="/white-label"
                    className="group rounded-lg border border-primary/30 bg-gradient-primary text-primary-foreground p-3 hover:brightness-110 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">Sou parceiro / agência</span>
                    </div>
                    <div className="text-[10px] text-primary-foreground/85 leading-snug">
                      Venda com sua marca via White Label.
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold group-hover:gap-1.5 transition-all">
                      Ver White Label <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </NavigationMenuLink>

                <div className="mt-auto pt-2 border-t border-border/60">
                  <a
                    href={WHATSAPP_NICHO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-md btn-whatsapp px-2 py-1.5 text-[11px] font-semibold"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Falar com consultor
                  </a>
                </div>
              </div>

              {/* Grid de nichos — todos, navegação direta */}
              <div className="p-3 flex flex-col">
                <div className="flex items-center justify-between px-1 pb-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Todos os nichos
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 tabular-nums">
                      {NICHO_DETAILS.length} segmentos prontos
                    </div>
                  </div>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/nichos"
                      className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      Ver todos <ChevronRight className="h-3 w-3" />
                    </Link>
                  </NavigationMenuLink>
                </div>
                <div className="grid grid-cols-3 gap-1.5 flex-1 content-start">
                  {NICHO_DETAILS.map((n) => {
                    const Icon = n.icon;
                    return (
                      <NavigationMenuLink asChild key={n.slug}>
                        <Link
                          to="/nichos/$slug"
                          params={{ slug: n.slug }}
                          className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-primary/30 hover:bg-accent/40 transition-colors min-w-0"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {n.shortLabel}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    );
                  })}
                </div>

                {/* CTA inferior */}
                <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/demo/escolher-nicho"
                      className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Ver demonstrações
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/orcamento"
                      className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-primary text-primary-foreground px-2 py-1.5 text-[11px] font-semibold shadow-sm hover:brightness-110 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Começar agora
                    </Link>
                  </NavigationMenuLink>
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
          <NichosMenu />
          {NAV.filter((n) => n.to !== "/").map((it) => (
            <NavLink key={`${it.to}-${it.label}`} {...it} />
          ))}

        </nav>

        <div className="flex items-center gap-2">
          {/* Busque o que Precisa — botão colorido + "?" para o Clube */}
          <div className="hidden md:inline-flex items-center gap-1">
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all animate-in"
            >
              <Link to="/busca">
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">Busque o que Precisa</span>
                <span className="lg:hidden">Buscar</span>
              </Link>
            </Button>
            <Link
              to="/clube"
              aria-label="O que é o Clube de Vantagens? (necessário para buscar)"
              title="O que é o Clube de Vantagens?"
              className="grid h-8 w-8 place-items-center rounded-full border border-primary/40 text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
            >
              ?
            </Link>
          </div>

          <InstallAppButton className="hidden md:inline-flex" />

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
                  <NavLink key={`${it.to}-${it.label}`} {...it} onClick={() => setOpen(false)} />
                ))}


                <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-border">
                  <Button asChild className="gap-2 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white">
                    <Link to="/busca" onClick={() => setOpen(false)}>
                      <Search className="w-4 h-4 mr-1" /> Busque o que Precisa
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/clube" onClick={() => setOpen(false)}>
                      <HelpCircle className="w-4 h-4 mr-1" /> O que é o Clube? (necessário p/ buscar)
                    </Link>
                  </Button>
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/orcamento" onClick={() => setOpen(false)}>
                      <Sparkles className="w-4 h-4 mr-2" /> Começar Agora
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/demo/escolher-nicho" onClick={() => setOpen(false)}>
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
