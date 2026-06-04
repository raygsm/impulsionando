import { Link } from "@tanstack/react-router";
import { MessageCircle, PlayCircle, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20a%20Impulsionando%20Tecnologia%20sobre%20m%C3%B3dulos%2C%20automa%C3%A7%C3%A3o%2C%20agenda%20online%2C%20WhatsApp%2C%20CRM%20ou%20sistemas%20personalizados.";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/solucoes", label: "Soluções" },
  { to: "/modulos", label: "Módulos" },
  { to: "/showroom/fitness", label: "Showroom Fitness" },
  { to: "/planos", label: "Planos" },
  { to: "/orcamento", label: "Orçamento" },
  { to: "/contato", label: "Contato" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-24 md:h-28 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-16 md:h-20 lg:h-24 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 hidden xl:inline-flex">
            <Link to="/demo/white-label">
              <Building2 className="w-4 h-4" />
              <span>White Label</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 hidden xl:inline-flex">
            <Link to="/demo/cliente-final">
              <Store className="w-4 h-4" />
              <span>Cliente Final</span>
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-2 bg-gradient-primary shadow-elegant hover:shadow-card-hover relative"
          >
            <Link to="/demo">
              <PlayCircle className="w-4 h-4" />
              <span>Demonstração</span>
              <span className="hidden sm:inline-flex ml-1 text-[10px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                grátis
              </span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 hidden md:inline-flex">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
