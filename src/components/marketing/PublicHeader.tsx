import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Zap,
  Globe,
  MessageSquare,
  Wallet,
  Building2,
  UserRound,
  LifeBuoy,
  Download,
  LogIn,
  MessageCircle,
  Target,
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
import { NICHO_DETAILS, findNicho } from "@/components/marketing/nichoDetails";
import { cn } from "@/lib/utils";

/* ============================================================================
 * PublicHeader — Onda A1 (navegação global reconstruída)
 *
 * Regras aplicadas:
 *  - 6 entradas no máximo, organizadas por OBJETIVO do cliente
 *  - Megamenus progressivos e visualmente leves
 *  - 1 único CTA primário ("Descobrir minha solução")
 *  - Entrada clara "Já sou cliente"
 *  - Acesso destacado ao Impulsionito
 *  - Mobile próprio (drawer com navegação em duas camadas), não é um empilhamento
 *  - Foco visível, teclado, contraste, prefers-reduced-motion
 *
 * TODOS os destinos existentes preservados; nenhum link inerte.
 * ========================================================================== */

// --- Vocabulário oficial das entradas ---------------------------------------

type SolucaoLink = {
  to: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SOLUCOES_POR_OBJETIVO: SolucaoLink[] = [
  {
    to: "/modulos",
    label: "Atrair e vender",
    hint: "Campanhas, funis, WhatsApp e recompra",
    icon: Target,
  },
  {
    to: "/modulos",
    label: "Atender e relacionar",
    hint: "CRM, agenda, pós-venda e comunicação",
    icon: MessageSquare,
  },
  {
    to: "/modulos",
    label: "Organizar a operação",
    hint: "Financeiro, estoque, cobrança e documentos",
    icon: Wallet,
  },
  {
    to: "/modulos",
    label: "Automatizar processos",
    hint: "Fluxos, integrações e Cérebro IA",
    icon: Zap,
  },
  {
    to: "/modulos",
    label: "Criar presença digital",
    hint: "Sites, portais, apps e identidade",
    icon: Globe,
  },
  {
    to: "/modulos",
    label: "Analisar e crescer",
    hint: "BI, dashboards e indicadores",
    icon: BarChart3,
  },
];

// Setores — versão enxuta agrupada por macro, 1 clique = página do nicho.
type SetorCol = { title: string; slugs: string[] };
const SETOR_COLUMNS: SetorCol[] = [
  { title: "Saúde e bem-estar", slugs: ["clinicas", "psicologia", "saude", "fitness"] },
  { title: "Alimentação", slugs: ["bares-restaurantes", "microcervejarias"] },
  { title: "Imobiliário e eventos", slugs: ["imobiliaria", "eventos"] },
  { title: "Serviços profissionais", slugs: ["juridico", "contabilidade", "servicos"] },
  { title: "Varejo e veículos", slugs: ["ecommerce", "veiculos"] },
  { title: "Educação e parceiros", slugs: ["educacao", "fornecedores", "white-label"] },
];

// Demonstrações — 4 destaques ao invés de listar 40 rotas showroom.
const DEMOS_DESTAQUE = [
  {
    to: "/demo",
    label: "Ver todas as demonstrações",
    hint: "Hub completo com filtro por objetivo e setor",
  },
  {
    to: "/demo/crm",
    label: "Jornada CRM completa",
    hint: "Do lead ao pagamento sem sair da conversa",
  },
  {
    to: "/demo/whatsapp",
    label: "Atendimento no WhatsApp",
    hint: "Impulsionito respondendo em contexto real",
  },
  {
    to: "/vitrine",
    label: "Vitrine de páginas prontas",
    hint: "Templates aplicáveis ao seu setor",
  },
] as const;

// Conteúdos — sem inventar rotas novas.
const CONTEUDOS_LINKS = [
  {
    to: "/ecossistema",
    label: "Ecossistema Impulsionando",
    hint: "Como as empresas se conectam ao Core",
  },
  { to: "/sobre", label: "Sobre a Impulsionando", hint: "Nossa missão e como operamos" },
  {
    to: "/central-de-ajuda",
    label: "Central de ajuda",
    hint: "Guias, orientações e boas práticas",
  },
  {
    to: "/canal-oficial",
    label: "Canal oficial único",
    hint: "Como falamos com você com segurança",
  },
] as const;

// Para clientes — jornada pós-contratação.
const CLIENTE_LINKS = [
  { to: "/auth", label: "Entrar no Core", hint: "Acessar minha operação", icon: LogIn },
  { to: "/suporte", label: "Suporte e atendimento", hint: "Falar com nosso time", icon: LifeBuoy },
  { to: "/app", label: "Baixar o app", hint: "Instalar no celular ou desktop", icon: Download },
] as const;

// ---------------------------------------------------------------------------

function useActive(path: string, exact?: boolean) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function triggerImpulsionito(origin: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin } }));
}

// --- Trigger reutilizável para os megamenus (aparência unificada) -----------

function menuTriggerClass(active: boolean) {
  return cn(
    "h-auto px-3 py-1.5 text-sm rounded-md bg-transparent font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "text-foreground bg-accent"
      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
  );
}

function panelClass(width = "w-[640px]") {
  return cn("p-5", width, "max-w-[92vw] motion-rise");
}

function MenuLinkRow({
  to,
  label,
  hint,
  icon: Icon,
  params,
}: {
  to: string;
  label: string;
  hint: string;
  icon?: React.ComponentType<{ className?: string }>;
  params?: Record<string, string>;
}) {
  return (
    <NavigationMenuLink asChild>
      <Link
        to={to}
        params={params as never}
        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none transition-colors"
      >
        {Icon ? (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground truncate">{label}</span>
          <span className="block text-xs text-muted-foreground leading-snug">{hint}</span>
        </span>
        <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-transform group-hover:translate-x-0.5 shrink-0" />
      </Link>
    </NavigationMenuLink>
  );
}

// --- Megamenus --------------------------------------------------------------

function SolucoesMenu() {
  const active = useActive("/modulos") || useActive("/solucoes");
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={menuTriggerClass(active)}>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={panelClass("w-[680px]")}>
          <div className="text-eyebrow mb-3">O que você quer transformar</div>
          <div className="grid grid-cols-2 gap-1">
            {SOLUCOES_POR_OBJETIVO.map((s) => (
              <MenuLinkRow key={s.label} to={s.to} label={s.label} hint={s.hint} icon={s.icon} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
            <NavigationMenuLink asChild>
              <Link to="/orcamento" className="text-primary font-semibold hover:underline">
                Não sei por onde começar → montar orçamento
              </Link>
            </NavigationMenuLink>
            <button
              type="button"
              onClick={() => triggerImpulsionito("header-solucoes")}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Ajuda do Impulsionito
            </button>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function SetoresMenu() {
  const active = useActive("/nichos") || useActive("/escolher-nicho");
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={menuTriggerClass(active)}>Setores</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={panelClass("w-[820px]")}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-eyebrow">Sua realidade, seu setor</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {NICHO_DETAILS.length} segmentos com jornadas prontas.
              </p>
            </div>
            <NavigationMenuLink asChild>
              <Link
                to="/escolher-nicho"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Não sei meu setor →
              </Link>
            </NavigationMenuLink>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {SETOR_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {col.title}
                </div>
                <ul className="space-y-0.5">
                  {col.slugs.map((slug) => {
                    const n = findNicho(slug);
                    if (!n) return null;
                    return (
                      <li key={slug}>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/nichos/$slug"
                            params={{ slug: n.slug }}
                            className="block rounded-md px-2 py-1 text-xs text-foreground/80 hover:text-primary hover:bg-accent/60 truncate transition-colors"
                          >
                            {n.shortLabel}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
            <NavigationMenuLink asChild>
              <Link
                to="/nichos"
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                Ver todos os setores <ArrowRight className="h-3 w-3" />
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link to="/clube" className="text-muted-foreground hover:text-foreground">
                Consumidor final: Clube Impulsionando
              </Link>
            </NavigationMenuLink>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function DemonstracoesMenu() {
  const active = useActive("/demo") || useActive("/vitrine");
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={menuTriggerClass(active)}>
        Demonstrações
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={panelClass("w-[560px]")}>
          <div className="text-eyebrow mb-3">Veja funcionando antes de contratar</div>
          <div className="grid grid-cols-1 gap-1">
            {DEMOS_DESTAQUE.map((d) => (
              <MenuLinkRow
                key={d.to + d.label}
                to={d.to}
                label={d.label}
                hint={d.hint}
                icon={Sparkles}
              />
            ))}
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function ConteudosMenu() {
  const active =
    useActive("/ecossistema") ||
    useActive("/sobre") ||
    useActive("/central-de-ajuda") ||
    useActive("/canal-oficial");
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={menuTriggerClass(active)}>Conteúdos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={panelClass("w-[520px]")}>
          <div className="text-eyebrow mb-3">Aprofunde antes de decidir</div>
          <div className="grid grid-cols-1 gap-1">
            {CONTEUDOS_LINKS.map((c) => (
              <MenuLinkRow key={c.to} to={c.to} label={c.label} hint={c.hint} icon={Building2} />
            ))}
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function ClientesMenu() {
  const active = useActive("/auth") || useActive("/suporte") || useActive("/app");
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={menuTriggerClass(active)}>
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5" /> Já sou cliente
        </span>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={panelClass("w-[440px]")}>
          <div className="text-eyebrow mb-3">Entradas rápidas</div>
          <div className="grid grid-cols-1 gap-1">
            {CLIENTE_LINKS.map((c) => (
              <MenuLinkRow key={c.to} to={c.to} label={c.label} hint={c.hint} icon={c.icon} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => triggerImpulsionito("header-cliente")}
            className="mt-3 w-full flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-primary">
                Falar com o Impulsionito
              </span>
              <span className="block text-xs text-muted-foreground">
                Cobrança, plano, onboarding e documentos
              </span>
            </span>
            <MessageCircle className="h-4 w-4 text-primary shrink-0" />
          </button>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

// --- Mobile: drawer com navegação em duas camadas ---------------------------

type MobileSection = "root" | "solucoes" | "setores" | "demos" | "conteudos" | "cliente";

function MobileNav({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<MobileSection>("root");

  const go = (to: string) => {
    onClose();
    setSection("root");
    return to;
  };

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border">
      <button
        type="button"
        onClick={() => setSection("root")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-1"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );

  const Row = ({
    to,
    label,
    hint,
    params,
  }: {
    to: string;
    label: string;
    hint?: string;
    params?: Record<string, string>;
  }) => (
    <Link
      to={to}
      params={params as never}
      onClick={() => go(to)}
      className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground leading-snug">{hint}</span>
        ) : null}
      </span>
      <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground/60 shrink-0" />
    </Link>
  );

  const SectionButton = ({
    id,
    label,
    hint,
    icon: Icon,
  }: {
    id: MobileSection;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none transition-colors"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
    </button>
  );

  if (section === "root") {
    return (
      <div className="flex flex-col gap-1">
        <SectionButton
          id="solucoes"
          label="Soluções"
          hint="O que você quer transformar"
          icon={Sparkles}
        />
        <SectionButton
          id="setores"
          label="Setores"
          hint="Sua realidade, seu segmento"
          icon={Building2}
        />
        <SectionButton
          id="demos"
          label="Demonstrações"
          hint="Veja funcionando antes"
          icon={Target}
        />
        <Link
          to="/planos"
          onClick={onClose}
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-accent/60"
        >
          <span>
            <span className="block text-sm font-semibold text-foreground">Planos</span>
            <span className="block text-xs text-muted-foreground">
              Comparar e escolher o plano ideal
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
        <SectionButton
          id="conteudos"
          label="Conteúdos"
          hint="Ecossistema, ajuda, canal oficial"
          icon={Users}
        />
        <SectionButton
          id="cliente"
          label="Já sou cliente"
          hint="Entrar no Core, suporte, app"
          icon={UserRound}
        />

        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
          <Button
            asChild
            size="lg"
            className="w-full gap-2 bg-gradient-primary text-primary-foreground"
          >
            <Link to="/escolher-nicho" onClick={onClose}>
              <Target className="w-4 h-4" /> Descobrir minha solução
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => {
              triggerImpulsionito("header-mobile");
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            <MessageCircle className="w-4 h-4" /> Falar com o Impulsionito
          </button>
        </div>
      </div>
    );
  }

  if (section === "solucoes") {
    return (
      <>
        <Header title="Soluções por objetivo" />
        <div className="flex flex-col gap-0.5">
          {SOLUCOES_POR_OBJETIVO.map((s) => (
            <Row key={s.label} to={s.to} label={s.label} hint={s.hint} />
          ))}
          <div className="mt-3 pt-3 border-t border-border">
            <Row to="/orcamento" label="Montar orçamento" hint="Recomendação sob medida" />
          </div>
        </div>
      </>
    );
  }

  if (section === "setores") {
    return (
      <>
        <Header title="Setores" />
        <div className="flex flex-col gap-0.5">
          <Row to="/escolher-nicho" label="Não sei meu setor" hint="Diagnóstico rápido" />
          <Row to="/nichos" label="Ver todos os setores" />
          {NICHO_DETAILS.slice(0, 12).map((n) => (
            <Row key={n.slug} to="/nichos/$slug" params={{ slug: n.slug }} label={n.shortLabel} />
          ))}
        </div>
      </>
    );
  }

  if (section === "demos") {
    return (
      <>
        <Header title="Demonstrações" />
        <div className="flex flex-col gap-0.5">
          {DEMOS_DESTAQUE.map((d) => (
            <Row key={d.to + d.label} to={d.to} label={d.label} hint={d.hint} />
          ))}
        </div>
      </>
    );
  }

  if (section === "conteudos") {
    return (
      <>
        <Header title="Conteúdos" />
        <div className="flex flex-col gap-0.5">
          {CONTEUDOS_LINKS.map((c) => (
            <Row key={c.to} to={c.to} label={c.label} hint={c.hint} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Já sou cliente" />
      <div className="flex flex-col gap-0.5">
        {CLIENTE_LINKS.map((c) => (
          <Row key={c.to} to={c.to} label={c.label} hint={c.hint} />
        ))}
        <button
          type="button"
          onClick={() => {
            triggerImpulsionito("header-mobile-cliente");
            onClose();
          }}
          className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-left hover:bg-primary/10"
        >
          <span>
            <span className="block text-sm font-semibold text-primary">
              Falar com o Impulsionito
            </span>
            <span className="block text-xs text-muted-foreground">Cobrança, plano, onboarding</span>
          </span>
          <MessageCircle className="h-4 w-4 text-primary" />
        </button>
      </div>
    </>
  );
}

// --- Header ----------------------------------------------------------------

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 xl:grid-cols-[1fr_auto_1fr] xl:px-8">
        <Link
          to="/"
          className="flex items-center justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Impulsionando — página inicial"
        >
          <LogoImpulsionando variant="light" size="lg" asLink={false} />
        </Link>

        <NavigationMenu className="hidden xl:flex xl:justify-self-center">
          <NavigationMenuList className="gap-0.5">
            <SolucoesMenu />
            <SetoresMenu />
            <DemonstracoesMenu />
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  to="/planos"
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    useActive("/planos")
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                  )}
                >
                  Planos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <ConteudosMenu />
            <ClientesMenu />
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-self-end gap-2">
          {/* CTA primário único */}
          <Button
            asChild
            size="sm"
            className="hidden gap-2 bg-gradient-primary text-primary-foreground shadow-elegant btn-alive md:inline-flex"
          >
            <Link to="/escolher-nicho">
              <Target className="w-4 h-4" /> Descobrir minha solução
            </Link>
          </Button>

          {/* Entrar — link discreto (ClientesMenu já cobre o resto) */}
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1.5 py-1"
          >
            <LogIn className="w-3.5 h-3.5" /> Entrar
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left mb-3">Menu</SheetTitle>
              <MobileNav onClose={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
