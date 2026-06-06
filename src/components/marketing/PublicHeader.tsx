import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, PlayCircle, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20a%20Impulsionando%20Tecnologia%20sobre%20m%C3%B3dulos%2C%20automa%C3%A7%C3%A3o%2C%20agenda%20online%2C%20WhatsApp%2C%20CRM%20ou%20sistemas%20personalizados.";

type NavItem = { to: string; label: string; desc?: string; external?: boolean };
type NavGroup = { heading: string; items: NavItem[] };

// ─────────────────────────────────────────────────────────────────────────────
// SOLUÇÕES — agrupado por área funcional. Cada item aponta para módulos existentes.
// ─────────────────────────────────────────────────────────────────────────────
const SOLUCOES_GROUPS: NavGroup[] = [
  {
    heading: "Comercial & Atendimento",
    items: [
      { to: "/modulos/crm", label: "CRM, Leads e Funis", desc: "Jornada completa do lead à fidelização" },
      { to: "/modulos/automacao", label: "WhatsApp & Comunicação", desc: "Atendimento 24h, lembretes e IA" },
    ],
  },
  {
    heading: "Operação",
    items: [
      { to: "/modulos/agenda", label: "Agenda & Reservas", desc: "Agendamento, reagendamento, lista de espera" },
      { to: "/modulos/commerce", label: "Vendas & Checkout", desc: "Pedidos, Pix, cartão, baixa automática" },
      { to: "/modulos/pdv", label: "PDV & Comandas", desc: "Caixa, mesas, fechamento de comanda" },
      { to: "/modulos/estoque", label: "Estoque & Compras", desc: "Produtos, fornecedores, alertas" },
      { to: "/modulos/delivery", label: "Delivery & Entregas", desc: "Pedido online, entregador, status" },
    ],
  },
  {
    heading: "Crescimento",
    items: [
      { to: "/modulos/fidelizacao", label: "Afiliados, Cupons e Indicações", desc: "Links únicos, splits, painel do afiliado" },
      { to: "/modulos/bi", label: "Dashboards & BI", desc: "Indicadores por nicho, comparativos, exportação" },
      { to: "/modulos/eventos", label: "Eventos & Ingressos", desc: "Lotes, check-in, transferência de titular" },
    ],
  },
  {
    heading: "Plataforma",
    items: [
      { to: "/modulos/erp", label: "ERP, Usuários & Permissões", desc: "Setores, auditoria, financeiro, assinaturas" },
      { to: "/modulos/saude", label: "Prontuário & Saúde", desc: "Evoluções, exames, área do paciente" },
      { to: "/modulos/area_cliente", label: "Área do Cliente", desc: "Histórico, documentos, autoatendimento" },
      { to: "/modulos/white_label", label: "White Label & Multi-empresa", desc: "Operação para agências e revendas" },
    ],
  },
  {
    heading: "Catálogo completo",
    items: [
      { to: "/modulos", label: "Todos os Módulos Disponíveis →", desc: "Ver a vitrine completa de módulos" },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// NICHOS — 7 categorias principais, cada uma apontando para páginas de nicho existentes.
// ─────────────────────────────────────────────────────────────────────────────
const NICHOS_GROUPS: NavGroup[] = [
  {
    heading: "Saúde, Bem-estar e Performance",
    items: [
      { to: "/nichos/clinicas", label: "Clínicas, consultórios e profissionais", desc: "Agenda médica, prontuário, área do paciente" },
      { to: "/nichos/fitness", label: "Academias, CrossFit, Personal e Pilates", desc: "Turmas, planos, presença, reativação" },
    ],
  },
  {
    heading: "Alimentação, Bebidas e Experiências",
    items: [
      { to: "/nichos/bares-restaurantes", label: "Bares, restaurantes, delivery e cafés", desc: "Reservas, comandas, PDV, delivery" },
      { to: "/nichos/microcervejarias", label: "Microcervejarias", desc: "Rótulos, lotes, B2B, recompra" },
      { to: "/nichos/fornecedores", label: "Fornecedores e distribuidores", desc: "Catálogo B2B, pedidos, giro" },
    ],
  },
  {
    heading: "Serviços, Educação e Atendimento",
    items: [
      { to: "/nichos/servicos", label: "Prestadores, consultorias e escolas", desc: "Orçamentos, propostas, follow-up, pacotes" },
    ],
  },
  {
    heading: "Varejo, E-commerce e Produtos",
    items: [
      { to: "/nichos/ecommerce", label: "Lojas, supermercados e e-commerce", desc: "Recompra, clube de vantagens, segmentação" },
    ],
  },
  {
    heading: "Eventos & White Label",
    items: [
      { to: "/showroom/eventos", label: "Eventos e ingressos", desc: "Lotes, check-in, transferência, NPS" },
      { to: "/nichos/white-label", label: "White Label e Parceiros", desc: "Briefing, módulos, recorrência, multi-cliente" },
    ],
  },
  {
    heading: "Todos os nichos",
    items: [
      { to: "/nichos", label: "Ver todos os nichos →", desc: "Catálogo completo por segmento" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PLANOS — preços + orçamento sob medida
// ─────────────────────────────────────────────────────────────────────────────
const PLANOS: NavItem[] = [
  { to: "/planos", label: "Planos e preços", desc: "Compare módulos, recursos e limites" },
  { to: "/orcamento", label: "Orçamento personalizado", desc: "Monte um plano sob medida para seu negócio" },
];


function useIsActivePath(path: string) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/modulos") {
    return pathname === "/modulos";
  }
  if (path.startsWith("/modulos/")) {
    return pathname === path;
  }
  if (path.startsWith("/nichos/")) {
    return pathname === path;
  }
  return pathname === path;
}

function useHasActiveChild(groups: NavGroup[]) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return groups.some((g) =>
    g.items.some((it) => {
      if (it.to === "/modulos") return pathname === "/modulos";
      if (it.to.startsWith("/modulos/")) return pathname === it.to;
      if (it.to.startsWith("/nichos/")) return pathname === it.to;
      return pathname === it.to;
    })
  );
}

function useHasActiveFlat(items: NavItem[]) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return items.some((it) => pathname === it.to);
}

function ItemLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const isActive = useIsActivePath(item.to);
  const activeClass = isActive ? "bg-accent text-accent-foreground" : "";

  if (item.external) {
    return (
      <a
        href={item.to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={`flex flex-col items-start gap-0.5 py-2 cursor-pointer w-full rounded-sm px-2 ${activeClass}`}
      >
        <span className="text-sm font-medium text-foreground">{item.label}</span>
        {item.desc && <span className="text-xs text-muted-foreground">{item.desc}</span>}
      </a>
    );
  }

  const moduleSlugMatch = item.to.match(/^\/modulos\/([^/]+)$/);
  const nichoSlugMatch = item.to.match(/^\/nichos\/([^/]+)$/);

  const content = (
    <>
      <span className="text-sm font-medium text-foreground">{item.label}</span>
      {item.desc && <span className="text-xs text-muted-foreground">{item.desc}</span>}
    </>
  );
  const className = `flex flex-col items-start gap-0.5 py-2 cursor-pointer w-full rounded-sm px-2 ${activeClass}`;

  if (moduleSlugMatch) {
    return (
      <Link to="/modulos/$slug" params={{ slug: moduleSlugMatch[1] }} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }
  if (nichoSlugMatch) {
    return (
      <Link to="/nichos/$slug" params={{ slug: nichoSlugMatch[1] }} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <Link to={item.to} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}


function DesktopDropdownFlat({ label, items }: { label: string; items: NavItem[] }) {
  const hasActive = useHasActiveFlat(items);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`px-3 py-2.5 lg:px-4 lg:py-3 text-sm lg:text-[15px] hover:text-foreground transition-colors rounded-md inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasActive ? "text-foreground font-medium bg-accent" : "text-muted-foreground"}`}>
        {label}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {items.map((it) => (
          <DropdownMenuItem key={it.to + it.label} asChild>
            <ItemLink item={it} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopDropdownGrouped({ label, groups }: { label: string; groups: NavGroup[] }) {
  const hasActive = useHasActiveChild(groups);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`px-3 py-2.5 lg:px-4 lg:py-3 text-sm lg:text-[15px] hover:text-foreground transition-colors rounded-md inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasActive ? "text-foreground font-medium bg-accent" : "text-muted-foreground"}`}>
        {label}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[420px] max-h-[80vh] overflow-y-auto">
        {groups.map((g, idx) => (
          <div key={g.heading}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {g.heading}
            </DropdownMenuLabel>
            {g.items.map((it) => (
              <DropdownMenuItem key={it.to + it.label} asChild>
                <ItemLink item={it} />
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-28 md:h-32 lg:h-40 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logoAsset.url}
            alt="Impulsionando Tecnologia"
            className="h-24 md:h-28 lg:h-36 w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors rounded-md"
            activeProps={{ className: "text-foreground font-medium" }}
            activeOptions={{ exact: true }}
          >
            Início
          </Link>
          <DesktopDropdownGrouped label="Nichos" groups={NICHOS_GROUPS} />
          <DesktopDropdownFlat label="Planos" items={PLANOS} />
          <Link
            to="/contato"
            className="px-3 py-3 text-[15px] text-muted-foreground hover:text-foreground transition-colors rounded-md"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex lg:h-10 lg:px-4 lg:text-[15px]">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-2 bg-gradient-primary shadow-elegant hover:shadow-card-hover hidden md:inline-flex lg:h-10 lg:px-5 lg:text-[15px]"
          >
            <Link to="/demo">
              <PlayCircle className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
              <span>Demonstração</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden md:inline-flex lg:h-10 lg:px-5 lg:text-[15px]">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 overflow-y-auto">
              <SheetTitle className="text-left">Menu</SheetTitle>
                <div className="mt-6 flex flex-col gap-6">
                  <Link to="/" onClick={() => setMobileOpen(false)} className="text-base font-medium">
                    Início
                  </Link>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Nichos
                    </p>
                    <div className="flex flex-col gap-3">
                      {NICHOS_GROUPS.map((g) => (
                        <div key={g.heading}>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mt-2 mb-1">
                            {g.heading}
                          </p>
                          <div className="flex flex-col gap-1">
                            {g.items.map((it) => (
                              <div key={it.to + it.label} className="text-sm text-foreground/90 hover:text-foreground">
                                <ItemLink item={it} onClick={() => setMobileOpen(false)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Planos
                    </p>
                    <div className="flex flex-col gap-2">
                      {PLANOS.map((it) => (
                        <div key={it.to + it.label} className="text-sm text-foreground/90 hover:text-foreground">
                          <ItemLink item={it} onClick={() => setMobileOpen(false)} />
                        </div>
                      ))}
                    </div>
                  </div>

                <Link
                  to="/contato"
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium"
                >
                  Contato
                </Link>

                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button asChild className="bg-gradient-primary">
                    <Link to="/demo" onClick={() => setMobileOpen(false)}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Demonstração
                    </Link>
                  </Button>
                  <Button asChild className="btn-whatsapp">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      Entrar
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
