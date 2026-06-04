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

type NavItem = { to: string; label: string; desc?: string };

const SOLUCOES: NavItem[] = [
  { to: "/solucoes", label: "Visão geral de soluções", desc: "Como combinamos módulos para sua operação" },
  { to: "/modulos", label: "Módulos da plataforma", desc: "Agenda, CRM, PDV, checkout, automação e mais" },
  { to: "/nichos", label: "Soluções por nicho", desc: "Saúde, alimentação, serviços, e-commerce, fitness…" },
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
  { to: "/sobre", label: "Sobre a Impulsionando" },
  { to: "/trabalhe-conosco", label: "Trabalhe conosco" },
  { to: "/contato", label: "Contato" },
  { to: "/privacidade", label: "Privacidade (LGPD)" },
  { to: "/termos", label: "Termos de uso" },
];

function DesktopDropdown({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md inline-flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {label}
        <ChevronDown className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {items.map((it) => (
          <DropdownMenuItem key={it.to} asChild>
            <Link to={it.to} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
              <span className="text-sm font-medium text-foreground">{it.label}</span>
              {it.desc && <span className="text-xs text-muted-foreground">{it.desc}</span>}
            </Link>
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logoAsset.url}
            alt="Impulsionando Tecnologia"
            className="h-14 md:h-16 lg:h-20 w-auto object-contain"
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
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-foreground/90 hover:text-foreground"
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Demonstrações
                  </p>
                  <div className="flex flex-col gap-2">
                    {DEMOS.map((it) => (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-foreground/90 hover:text-foreground"
                      >
                        {it.label}
                      </Link>
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
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-foreground/90 hover:text-foreground"
                      >
                        {it.label}
                      </Link>
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
