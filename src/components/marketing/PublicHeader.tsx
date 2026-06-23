import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  LogIn,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Target,
  HelpCircle,
  Building2,
  ArrowRight,
  Download,
  ShoppingCart,
  MessageCircle,
  Network,
} from "lucide-react";
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
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { cn } from "@/lib/utils";

const WHATSAPP_NICHO_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20ajuda%20para%20escolher%20o%20meu%20nicho%20na%20Impulsionando.";

type NavItem = {
  to: string;
  label: string;
  exact?: boolean;
};

// Menu principal (W16) — Empresas removido. Ordem oficial:
// Início · Nichos · Demonstrações · Vitrine · Faça Parte do Ecossistema · Suporte
// (Entrar / Contratar Agora / Baixar App ficam nas ações da direita)
const NAV_AFTER_NICHOS: NavItem[] = [
  { to: "/demo", label: "Demonstrações" },
  { to: "/vitrine", label: "Vitrine" },
  { to: "/ecossistema", label: "Faça Parte do Ecossistema" },
  { to: "/suporte", label: "Suporte" },
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
              {/* Rail de jornada do lead */}
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

              {/* Grid de nichos */}
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

                <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/demo"
                      className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Ver demonstrações
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/checkout"
                      className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-primary text-primary-foreground px-2 py-1.5 text-[11px] font-semibold shadow-sm hover:brightness-110 transition-all"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Contratar Agora
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

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center shrink-0 [&_img]:!h-56">
          <LogoImpulsionando variant="light" size="xl" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Menu principal">
          <NavLink to="/" label="Início" exact />
          <NichosMenu />
          {NAV_AFTER_NICHOS.map((it) => (
            <NavLink key={`${it.to}-${it.label}`} {...it} />
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
            <Link to="/checkout">
              <ShoppingCart className="w-4 h-4" /> Contratar Agora
            </Link>
          </Button>

          {/* Baixar App — sempre último item, sempre visível, destacado */}
          <Button
            asChild
            size="sm"
            className="hidden md:inline-flex gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:brightness-110"
          >
            <Link to="/app">
              <Download className="w-4 h-4" /> Baixar App
            </Link>
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

                <details className="group">
                  <summary className="list-none cursor-pointer flex items-center justify-between px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60">
                    <span className="flex items-center gap-2"><Network className="h-4 w-4" />Nichos</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="ml-2 pl-3 border-l border-border/60 mt-1 flex flex-col gap-0.5">
                    <Link to="/nichos" onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-foreground hover:bg-accent/60 rounded-md font-semibold">
                      Ver todos os nichos →
                    </Link>
                    {NICHO_DETAILS.map((n) => (
                      <Link
                        key={n.slug}
                        to="/nichos/$slug"
                        params={{ slug: n.slug }}
                        onClick={() => setOpen(false)}
                        className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60"
                      >
                        {n.shortLabel}
                      </Link>
                    ))}
                  </div>
                </details>

                <NavLink to="/demo" label="Demonstrações" onClick={() => setOpen(false)} />
                <NavLink to="/vitrine" label="Vitrine" onClick={() => setOpen(false)} />
                <NavLink to="/ecossistema" label="Faça Parte do Ecossistema" onClick={() => setOpen(false)} />
                <NavLink to="/suporte" label="Suporte" onClick={() => setOpen(false)} />

                <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-border">
                  <Button asChild variant="ghost">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" /> Entrar
                    </Link>
                  </Button>
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/checkout" onClick={() => setOpen(false)}>
                      <ShoppingCart className="w-4 h-4 mr-2" /> Contratar Agora
                    </Link>
                  </Button>
                  <Button asChild className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <Link to="/app" onClick={() => setOpen(false)}>
                      <Download className="w-4 h-4 mr-2" /> Baixar App
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

