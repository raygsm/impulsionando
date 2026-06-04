import { Link } from "@tanstack/react-router";
import { MessageCircle, PlayCircle, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20a%20Impulsionando%20Tecnologia%20sobre%20m%C3%B3dulos%2C%20automa%C3%A7%C3%A3o%2C%20agenda%20online%2C%20WhatsApp%2C%20CRM%20ou%20sistemas%20personalizados.";

type NavItem = { to: string; label: string; desc?: string; external?: boolean };

const SOLUCOES: NavItem[] = [
  { to: "/solucoes", label: "Visão geral de soluções", desc: "Como combinamos módulos para sua operação" },
  { to: "/modulos", label: "Módulos da plataforma", desc: "Agenda, CRM, PDV, checkout, automação e mais" },
  { to: "/nichos", label: "Soluções por nicho", desc: "Saúde, alimentação, serviços, e-commerce, fitness…" },
  {
    to: "https://impulsionandobrasil.com.br",
    label: "Marketing (Impulsionando Brasil) ↗",
    desc: "Tráfego, social media, funis e estratégia",
    external: true,
  },
];

const DEMOS: NavItem[] = [
  { to: "/demo", label: "Demonstração interativa", desc: "Tour guiado pela plataforma" },
  { to: "/demo/white-label", label: "Demo White Label", desc: "Para agências e revendas" },
  { to: "/demo/cliente-final", label: "Demo Cliente Final", desc: "Visão do operador" },
  { to: "/showroom/fitness", label: "Showroom Fitness", desc: "Academia, personal e estúdio" },
  { to: "/showroom/eventos", label: "Showroom Eventos", desc: "Ingressos, transferência, NPS" },
  { to: "/como-funciona/fitness", label: "Como funciona — Fitness", desc: "Passo a passo de implantação" },
];

const EMPRESA: NavItem[] = [
  { to: "/sobre", label: "Sobre o Grupo Impulsionando" },
  { to: "/trabalhe-conosco", label: "Trabalhe conosco" },
  { to: "/contato", label: "Contato" },
  {
    to: "https://impulsionandobrasil.com.br",
    label: "Impulsionando Brasil ↗",
    desc: "Site de marketing do grupo",
    external: true,
  },
  { to: "/privacidade", label: "Privacidade (LGPD)" },
  { to: "/termos", label: "Termos de uso" },
];

function ItemLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  if (item.external) {
    return (
      <a
        href={item.to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="flex flex-col items-start gap-0.5 py-2 cursor-pointer w-full"
      >
        <span className="text-sm font-medium text-foreground">{item.label}</span>
        {item.desc && <span className="text-xs text-muted-foreground">{item.desc}</span>}
      </a>
    );
  }
  return (
    <Link to={item.to} onClick={onClick} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer w-full">
      <span className="text-sm font-medium text-foreground">{item.label}</span>
      {item.desc && <span className="text-xs text-muted-foreground">{item.desc}</span>}
    </Link>
  );
}

function DesktopDropdown({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md inline-flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {label}
        <ChevronDown className="w-3.5 h-3.5" />
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


export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 md:h-24 lg:h-28 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logoAsset.url}
            alt="Impulsionando Tecnologia"
            className="h-16 md:h-20 lg:h-24 w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            activeProps={{ className: "text-foreground font-medium" }}
            activeOptions={{ exact: true }}
          >
            Início
          </Link>
          <DesktopDropdown label="Soluções" items={SOLUCOES} />
          <DesktopDropdown label="Demonstrações" items={DEMOS} />
          <Link
            to="/planos"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Planos
          </Link>
          <Link
            to="/orcamento"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Orçamento
          </Link>
          <DesktopDropdown label="Empresa" items={EMPRESA} />
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-2 bg-gradient-primary shadow-elegant hover:shadow-card-hover hidden md:inline-flex"
          >
            <Link to="/demo">
              <PlayCircle className="w-4 h-4" />
              <span>Demonstração</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="btn-whatsapp gap-2 hidden md:inline-flex">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          </Button>

          {/* Mobile menu */}
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
                    Soluções
                  </p>
                  <div className="flex flex-col gap-2">
                    {SOLUCOES.map((it) => (
                      <div key={it.to + it.label} className="text-sm text-foreground/90 hover:text-foreground">
                        <ItemLink item={it} onClick={() => setMobileOpen(false)} />
                      </div>
                    ))}
                  </div>

                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Demonstrações
                  </p>
                  <div className="flex flex-col gap-2">
                    {DEMOS.map((it) => (
                      <div key={it.to + it.label} className="text-sm text-foreground/90 hover:text-foreground">
                        <ItemLink item={it} onClick={() => setMobileOpen(false)} />
                      </div>
                    ))}
                  </div>

                </div>

                <Link
                  to="/planos"
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium"
                >
                  Planos
                </Link>
                <Link
                  to="/orcamento"
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium"
                >
                  Orçamento
                </Link>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Empresa
                  </p>
                  <div className="flex flex-col gap-2">
                    {EMPRESA.map((it) => (
                      <div key={it.to + it.label} className="text-sm text-foreground/90 hover:text-foreground">
                        <ItemLink item={it} onClick={() => setMobileOpen(false)} />
                      </div>
                    ))}
                  </div>

                </div>

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
