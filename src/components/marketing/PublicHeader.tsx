import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  Download,
  Globe,
  LifeBuoy,
  LogIn,
  Menu,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { PUBLIC_NICHE_GROUPS, PUBLIC_NICHES } from "@/data/public-niche-catalog";
import { cn } from "@/lib/utils";

type SolucaoLink = {
  to: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SOLUCOES_POR_OBJETIVO: SolucaoLink[] = [
  { to: "/modulos", label: "Atrair e vender", hint: "Campanhas, funis, CRM e recompra", icon: Target },
  { to: "/modulos", label: "Atender e relacionar", hint: "CRM, agenda, pós-venda e comunicação", icon: MessageSquare },
  { to: "/modulos", label: "Organizar a operação", hint: "ERP, PDV, estoque, financeiro e documentos", icon: Wallet },
  { to: "/modulos", label: "Automatizar processos", hint: "Fluxos, integrações e Impulsionito", icon: Zap },
  { to: "/modulos", label: "Criar presença digital", hint: "Sites, portais, apps e identidade", icon: Globe },
  { to: "/modulos", label: "Analisar e crescer", hint: "BI, LTV, ticket médio, satisfação e indicadores", icon: BarChart3 },
];

const DEMOS_DESTAQUE = [
  { to: "/demo", label: "Ver todas as demonstrações", hint: "Hub completo por objetivo e segmento" },
  { to: "/demo/crm", label: "Jornada CRM completa", hint: "Do lead ao relacionamento e recompra" },
  { to: "/demo/whatsapp", label: "Atendimento conversacional", hint: "Veja a experiência do Impulsionito" },
  { to: "/vitrine", label: "Vitrine de páginas prontas", hint: "Experiências aplicáveis ao seu segmento" },
] as const;

const CONTEUDOS_LINKS = [
  { to: "/ecossistema", label: "Ecossistema Impulsionando", hint: "Como todas as áreas do negócio se conectam" },
  { to: "/sobre", label: "Sobre a Impulsionando", hint: "Nossa proposta e forma de operar" },
  { to: "/central-de-ajuda", label: "Central de ajuda", hint: "Guias, orientações e boas práticas" },
  { to: "/canal-oficial", label: "Canal oficial único", hint: "Como falamos com você com segurança" },
] as const;

const CLIENTE_LINKS = [
  { to: "/auth", label: "Entrar no Core", hint: "Acessar minha operação", icon: LogIn },
  { to: "/suporte", label: "Suporte e atendimento", hint: "Falar com nosso time", icon: LifeBuoy },
  { to: "/app", label: "Baixar o app", hint: "Instalar no celular ou desktop", icon: Download },
] as const;

function useActive(path: string) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname === path || pathname.startsWith(path + "/");
}

function triggerImpulsionito(origin: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin } }));
}

function triggerClass(active: boolean) {
  return cn(
    "h-auto rounded-md bg-transparent px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  );
}

function MenuLinkRow({ to, label, hint, icon: Icon }: { to: string; label: string; hint: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <NavigationMenuLink asChild>
      <Link to={to} className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none">
        {Icon ? <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-4 w-4" /></span> : null}
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{label}</span><span className="block text-xs leading-snug text-muted-foreground">{hint}</span></span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </NavigationMenuLink>
  );
}

function SolucoesMenu() {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={triggerClass(useActive("/modulos") || useActive("/solucoes"))}>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[680px] max-w-[92vw] p-5 motion-rise">
          <div className="mb-3 text-eyebrow">O que você quer transformar</div>
          <div className="grid grid-cols-2 gap-1">{SOLUCOES_POR_OBJETIVO.map((item) => <MenuLinkRow key={item.label} {...item} />)}</div>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
            <NavigationMenuLink asChild><Link to="/orcamento" className="font-semibold text-primary hover:underline">Montar minha solução →</Link></NavigationMenuLink>
            <button type="button" onClick={() => triggerImpulsionito("header-solucoes")} className="inline-flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MessageCircle className="h-3.5 w-3.5" /> Ajuda do Impulsionito</button>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function SetoresMenu() {
  const visibleGroups = PUBLIC_NICHE_GROUPS.slice(0, 9);
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={triggerClass(useActive("/nichos") || useActive("/escolher-nicho"))}>Setores</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[980px] max-w-[94vw] p-5 motion-rise">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div><div className="text-eyebrow">Sua realidade, seu setor</div><p className="mt-0.5 text-xs text-muted-foreground">{PUBLIC_NICHES.length} jornadas comerciais publicadas e uma única fonte de verdade.</p></div>
            <NavigationMenuLink asChild><Link to="/escolher-nicho" className="text-xs font-semibold text-primary hover:underline">Buscar meu segmento →</Link></NavigationMenuLink>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-5">
            {visibleGroups.map((group) => (
              <div key={group.slug} className="min-w-0">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</div>
                <ul className="space-y-0.5">
                  {group.items.slice(0, 5).map((item) => (
                    <li key={item.slug}>
                      <NavigationMenuLink asChild>
                        <Link to="/nichos/$slug" params={{ slug: item.slug }} className="block truncate rounded-md px-2 py-1 text-xs text-foreground/80 transition-colors hover:bg-accent/60 hover:text-primary">{item.label}</Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
            <NavigationMenuLink asChild><Link to="/nichos" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Ver todos os setores <ArrowRight className="h-3 w-3" /></Link></NavigationMenuLink>
            <NavigationMenuLink asChild><Link to="/clube" className="text-muted-foreground hover:text-foreground">Consumidor final: Clube Impulsionando</Link></NavigationMenuLink>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function DemonstracoesMenu() {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={triggerClass(useActive("/demo") || useActive("/vitrine"))}>Demonstrações</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[560px] max-w-[92vw] p-5 motion-rise"><div className="mb-3 text-eyebrow">Veja funcionando antes de contratar</div><div className="grid gap-1">{DEMOS_DESTAQUE.map((item) => <MenuLinkRow key={item.to + item.label} {...item} icon={Sparkles} />)}</div></div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function ConteudosMenu() {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={triggerClass(useActive("/ecossistema") || useActive("/sobre") || useActive("/central-de-ajuda") || useActive("/canal-oficial"))}>Conteúdos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[520px] max-w-[92vw] p-5 motion-rise"><div className="mb-3 text-eyebrow">Aprofunde antes de decidir</div><div className="grid gap-1">{CONTEUDOS_LINKS.map((item) => <MenuLinkRow key={item.to} {...item} icon={Building2} />)}</div></div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function ClientesMenu() {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={triggerClass(useActive("/auth") || useActive("/suporte") || useActive("/app"))}><span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Já sou cliente</span></NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[440px] max-w-[92vw] p-5 motion-rise"><div className="mb-3 text-eyebrow">Entradas rápidas</div><div className="grid gap-1">{CLIENTE_LINKS.map((item) => <MenuLinkRow key={item.to} {...item} />)}</div><button type="button" onClick={() => triggerImpulsionito("header-cliente")} className="mt-3 flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10"><span><span className="block text-sm font-semibold text-primary">Falar com o Impulsionito</span><span className="block text-xs text-muted-foreground">Plano, onboarding, recursos e suporte</span></span><MessageCircle className="h-4 w-4 shrink-0 text-primary" /></button></div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<"root" | "setores">("root");
  if (view === "setores") {
    return (
      <div className="space-y-2">
        <button type="button" onClick={() => setView("root")} className="text-sm font-medium text-muted-foreground">← Voltar</button>
        <div className="border-b pb-3"><div className="font-semibold">Setores</div><div className="text-xs text-muted-foreground">{PUBLIC_NICHES.length} jornadas disponíveis</div></div>
        <Link to="/escolher-nicho" onClick={onClose} className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-3 text-sm font-semibold text-primary">Buscar meu segmento <ArrowRight className="h-4 w-4" /></Link>
        <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
          {PUBLIC_NICHE_GROUPS.map((group) => <div key={group.slug}><div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>{group.items.map((item) => <Link key={item.slug} to="/nichos/$slug" params={{ slug: item.slug }} onClick={onClose} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"><span>{item.label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}</div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Link to="/modulos" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span><span className="block text-sm font-semibold">Soluções</span><span className="block text-xs text-muted-foreground">Do PDV ao relacionamento</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <button type="button" onClick={() => setView("setores")} className="flex items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-accent"><span><span className="block text-sm font-semibold">Setores</span><span className="block text-xs text-muted-foreground">Supermercados, seguros, construção, saúde e muito mais</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
      <Link to="/demo" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span><span className="block text-sm font-semibold">Demonstrações</span><span className="block text-xs text-muted-foreground">Veja antes de contratar</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <Link to="/seguranca" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-primary" /><span><span className="block text-sm font-semibold">Segurança e Privacidade</span><span className="block text-xs text-muted-foreground">Dados Seguros e CP — Chat Privado</span></span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <Link to="/planos" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span><span className="block text-sm font-semibold">Planos</span><span className="block text-xs text-muted-foreground">Essencial, Ideal e Full</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <Link to="/ecossistema" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span><span className="block text-sm font-semibold">Ecossistema</span><span className="block text-xs text-muted-foreground">Conheça o Core e o Impulsionito</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <Link to="/auth" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent"><span><span className="block text-sm font-semibold">Já sou cliente</span><span className="block text-xs text-muted-foreground">Entrar no Core</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
      <div className="mt-4 grid gap-2 border-t pt-4"><Button asChild className="w-full gap-2 bg-gradient-primary"><Link to="/escolher-nicho" onClick={onClose}><Target className="h-4 w-4" /> Descobrir minha solução</Link></Button><Button variant="outline" type="button" className="w-full gap-2" onClick={() => { triggerImpulsionito("header-mobile"); onClose(); }}><MessageCircle className="h-4 w-4" /> Falar com o Impulsionito</Button></div>
    </div>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const plansActive = useActive("/planos");
  const securityActive = useActive("/seguranca") || useActive("/dados-seguros") || useActive("/cp");
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 xl:grid-cols-[1fr_auto_1fr] xl:px-8">
        <Link to="/" className="flex items-center justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Impulsionando — página inicial"><LogoImpulsionando variant="light" size="lg" asLink={false} /></Link>

        <NavigationMenu className="hidden xl:flex xl:justify-self-center">
          <NavigationMenuList className="gap-0.5">
            <SolucoesMenu />
            <SetoresMenu />
            <DemonstracoesMenu />
            <NavigationMenuItem><NavigationMenuLink asChild><Link to="/seguranca" className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", securityActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}><ShieldCheck className="h-3.5 w-3.5" />Segurança e Privacidade</Link></NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink asChild><Link to="/planos" className={cn("inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", plansActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>Planos</Link></NavigationMenuLink></NavigationMenuItem>
            <ConteudosMenu />
            <ClientesMenu />
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-self-end gap-2">
          <Button asChild size="sm" className="hidden gap-2 bg-gradient-primary text-primary-foreground shadow-elegant md:inline-flex"><Link to="/escolher-nicho"><Target className="h-4 w-4" /> Descobrir minha solução</Link></Button>
          <button type="button" onClick={() => triggerImpulsionito("header")} className="hidden h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/5 text-primary transition-colors hover:bg-primary/10 lg:inline-flex" aria-label="Abrir Impulsionito"><MessageCircle className="h-4 w-4" /></button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="xl:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[92vw] max-w-sm overflow-y-auto"><SheetTitle className="sr-only">Navegação Impulsionando</SheetTitle><div className="mb-6"><LogoImpulsionando variant="light" size="md" asLink={false} /><p className="mt-2 text-xs text-muted-foreground">Um ecossistema. Uma inteligência. Todo o seu negócio conectado.</p></div><MobileNav onClose={() => setOpen(false)} /></SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
