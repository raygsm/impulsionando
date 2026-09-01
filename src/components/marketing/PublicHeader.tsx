import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, MessageCircle, LogIn, ShieldCheck, LockKeyhole, Crown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { PUBLIC_NICHES } from "@/data/public-niche-catalog";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/modulos", label: "Soluções" },
  { to: "/nichos", label: "Setores" },
  { to: "/demo", label: "Demonstrações" },
  { to: "/apresentacao", label: "Apresentação" },
  { to: "/vitrine", label: "Vitrine" },
  { to: "/clube", label: "Clube Impulsionando" },
  { to: "/planos", label: "Planos" },
] as const;

const PUBLIC_NICHE_COUNT = PUBLIC_NICHES.length;

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function navAriaLabel(item: (typeof NAV)[number]) {
  if (item.to === "/nichos") return `${item.label} — ${PUBLIC_NICHE_COUNT} setores disponíveis`;
  if (item.to === "/clube") return "Clube Impulsionando — benefícios, 10% de desconto, vitrine e estoque próximo";
  return item.label;
}

function openImpulsionito() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin: "public-header" } }));
}

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="Impulsionando Tecnologia — início">
          <LogoImpulsionando variant="light" size="lg" asLink={false} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} aria-label={navAriaLabel(item)} className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive(pathname, item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>{item.label}</Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button asChild variant="outline" size="sm" className="border-primary/40">
            <Link to="/clube"><Crown className="mr-2 h-4 w-4" />Clube</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/seguranca"><ShieldCheck className="mr-2 h-4 w-4" />Segurança e Privacidade</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="relative overflow-hidden border-slate-800 bg-slate-950 text-white hover:bg-slate-900 hover:text-white">
            <Link to="/cp" aria-label="CP — Chat Privado | Segurança e Privacidade">
              <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <LockKeyhole className="mr-2 h-4 w-4" />Chat Privado <span className="ml-1 hidden xl:inline">| Privacidade</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm"><Link to="/auth"><LogIn className="mr-2 h-4 w-4" />Entrar</Link></Button>
          <Button type="button" size="sm" onClick={openImpulsionito}><MessageCircle className="mr-2 h-4 w-4" />Impulsionito</Button>
        </div>

        <div className="ml-auto lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm">
              <SheetTitle className="sr-only">Menu principal</SheetTitle>
              <div className="mb-6"><LogoImpulsionando variant="light" size="lg" /></div>
              <nav className="flex flex-col gap-1" aria-label="Navegação mobile">
                {NAV.map((item) => <Link key={item.to} to={item.to} aria-label={navAriaLabel(item)} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-3 text-sm font-semibold transition-colors", isActive(pathname, item.to) ? "bg-primary/10 text-primary" : "hover:bg-accent")}>{item.label}</Link>)}
                <Link to="/clube/minha-conta" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-accent">Já sou assinante do Clube</Link>
                <Link to="/seguranca" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-accent">Segurança e Privacidade</Link>
                <Link to="/cp" onClick={() => setOpen(false)} className="my-1 flex items-center rounded-xl bg-slate-950 px-3 py-3 text-sm font-bold text-white"><span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-400"/><LockKeyhole className="mr-2 h-4 w-4"/>Chat Privado | Segurança e Privacidade</Link>
                <Link to="/auth" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-accent">Entrar no Core</Link>
              </nav>
              <Button type="button" className="mt-6 w-full" onClick={() => { setOpen(false); openImpulsionito(); }}><MessageCircle className="mr-2 h-4 w-4" />Falar com Impulsionito</Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
