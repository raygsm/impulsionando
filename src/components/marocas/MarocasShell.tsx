// Shell público da Marocas — Fase A (vitrine premium Copacabana).
// Header glass sticky, wrapper com data-tenant="marocas" ativando tokens,
// navegação estendida (Cardápio, Reservas, Eventos, Sobre, Contato),
// footer editorial com bairros, contato oficial e Instagram/WhatsApp.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Instagram,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMarocasCart } from "./useMarocasCart";
import { MarocasHelpFab } from "./MarocasHelpFab";
import { MoreContentFab } from "@/components/impulsionando";
import {
  MAROCAS_BRAND,
  MAROCAS_CONTATO,
  MAROCAS_HORARIOS,
  marocasWhatsAppUrl,
} from "./marocasContent";
import marocasLogo from "@/assets/marocas-logo.png.asset.json";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  breadcrumbs?: Crumb[];
  children: ReactNode;
  hideCartBadge?: boolean;
  transparentHeader?: boolean;
}

const NAV = [
  { label: "Cardápio", to: "/marocas/cardapio" },
  { label: "Delivery", to: "/marocas/delivery" },
  { label: "Reservas", to: "/marocas/reservas" },
  { label: "Eventos", to: "/marocas/eventos" },
  { label: "Sobre", to: "/marocas/sobre" },
  { label: "Contato", to: "/marocas/contato" },
];

export function MarocasShell({
  breadcrumbs,
  children,
  hideCartBadge,
  transparentHeader,
}: Props) {
  const { totalItens } = useMarocasCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparentHeader) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentHeader]);

  const headerBg = transparentHeader
    ? scrolled
      ? "bg-background/90 backdrop-blur-xl border-b border-border/60"
      : "bg-gradient-to-b from-black/50 to-transparent text-white"
    : "bg-background/95 backdrop-blur-xl border-b border-border/60";

  return (
    <div
      data-tenant="marocas"
      className="min-h-dvh bg-background flex flex-col"
      style={{
        // Copacabana Sunset — camada quente por cima do verde marocas
        ["--marocas-coral" as any]: "oklch(0.68 0.18 32)",
        ["--marocas-sand" as any]: "oklch(0.94 0.03 80)",
      }}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1 focus:rounded z-50"
      >
        Ir para o conteúdo
      </a>

      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${headerBg}`}
      >
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-18 flex items-center justify-between gap-4">
          <Link
            to="/marocas"
            className="flex items-center gap-2.5 font-bold shrink-0 group"
            aria-label="Marocas — Copacabana"
          >
            <span className="grid place-items-center h-9 w-9 rounded-full bg-white shadow-sm overflow-hidden ring-1 ring-black/5">
              <img
                src={marocasLogo.url}
                alt=""
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-base tracking-tight">Marocas</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-70">
                Copacabana · RJ
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="relative py-1 hover:text-primary transition after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                activeProps={{
                  className: "text-primary font-semibold after:w-full",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/marocas/reservas"
              className="hidden md:inline-flex items-center rounded-full border border-current/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-white/10 transition"
            >
              Reservar mesa
            </Link>
            {!hideCartBadge && (
              <Link
                to="/marocas/carrinho"
                className="relative rounded-full p-2 hover:bg-white/10 transition"
                aria-label={`Carrinho com ${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItens > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {totalItens}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/marocas/login"
              className="hidden md:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition"
            >
              Entrar
            </Link>
            <button
              className="lg:hidden rounded-md p-2 hover:bg-white/10 transition min-h-11 min-w-11 grid place-items-center"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="breadcrumb"
            className="container mx-auto px-4 md:px-6 py-2 text-xs text-muted-foreground flex items-center gap-1 flex-wrap"
          >
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {c.to ? (
                  <Link to={c.to} className="hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b">
            <Link
              to="/marocas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-bold"
            >
              <img src={marocasLogo.url} alt="" className="h-8 w-8" />
              Marocas
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="rounded-md border p-2 min-h-11 min-w-11 grid place-items-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="p-4 space-y-1 text-lg">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 rounded-md hover:bg-muted"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 border-t">
              <Link
                to="/marocas/pedidos"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 rounded-md hover:bg-muted"
              >
                Meus pedidos
              </Link>
            </li>
            <li>
              <Link
                to="/marocas/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 rounded-md hover:bg-muted"
              >
                Entrar
              </Link>
            </li>
            <li>
              <Link
                to="/marocas/planos"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 rounded-md hover:bg-muted text-sm text-muted-foreground"
              >
                Sou dono de restaurante · Ver planos
              </Link>
            </li>
          </ul>
          <div className="p-4 mt-4 border-t space-y-3 text-sm">
            <a
              href={marocasWhatsAppUrl("Olá! Vim do site da Marocas.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary font-semibold"
            >
              <Phone className="h-4 w-4" /> {MAROCAS_CONTATO.whatsappHumanizado}
            </a>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {MAROCAS_CONTATO.enderecoLinha1}
            </div>
          </div>
        </div>
      )}

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 relative overflow-hidden bg-[oklch(0.15_0.02_240)] text-white">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
        <div className="container mx-auto px-4 md:px-6 py-14 grid md:grid-cols-4 gap-10 text-sm">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-white overflow-hidden">
                <img
                  src={marocasLogo.url}
                  alt=""
                  className="h-8 w-8 object-contain"
                />
              </span>
              {MAROCAS_BRAND.nome}
            </div>
            <p className="text-white/70 mt-3 leading-relaxed">
              {MAROCAS_BRAND.assinatura}. Desde {MAROCAS_BRAND.fundacao} servindo o
              bairro mais cosmopolita do Brasil.
            </p>
            <a
              href={MAROCAS_CONTATO.instagramUrl + MAROCAS_CONTATO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-white/85 hover:text-white transition"
            >
              <Instagram className="h-4 w-4" /> @{MAROCAS_CONTATO.instagram}
            </a>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
              Pedir & reservar
            </div>
            <ul className="space-y-2 text-white/85">
              <li>
                <Link to="/marocas/cardapio" className="hover:text-primary">
                  Cardápio completo
                </Link>
              </li>
              <li>
                <Link to="/marocas/delivery" className="hover:text-primary">
                  Delivery na Zona Sul
                </Link>
              </li>
              <li>
                <Link to="/marocas/reservas" className="hover:text-primary">
                  Reservar mesa
                </Link>
              </li>
              <li>
                <Link to="/marocas/eventos" className="hover:text-primary">
                  Eventos privados
                </Link>
              </li>
              <li>
                <Link to="/marocas/pedidos" className="hover:text-primary">
                  Meus pedidos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
              A casa
            </div>
            <ul className="space-y-2 text-white/85">
              <li>
                <Link to="/marocas/sobre" className="hover:text-primary">
                  Nossa história
                </Link>
              </li>
              <li>
                <Link to="/marocas/contato" className="hover:text-primary">
                  Contato & mapa
                </Link>
              </li>
              <li>
                <Link to="/marocas/faq" className="hover:text-primary">
                  Dúvidas frequentes
                </Link>
              </li>
              <li>
                <Link to="/marocas/planos" className="hover:text-primary">
                  Sou dono · plataforma
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-3">
              Onde nos achar
            </div>
            <address className="not-italic text-white/85 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {MAROCAS_CONTATO.enderecoLinha1}
                  <br />
                  {MAROCAS_CONTATO.enderecoLinha2}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <a
                  href={marocasWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {MAROCAS_CONTATO.whatsappHumanizado}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <ul className="space-y-0.5 text-xs">
                  {MAROCAS_HORARIOS.map((h) => (
                    <li
                      key={h.dia}
                      className={h.fechado ? "text-white/50" : ""}
                    >
                      <span className="font-medium">{h.dia}:</span> {h.horario}
                    </li>
                  ))}
                </ul>
              </div>
            </address>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
            <span>
              © {new Date().getFullYear()} {MAROCAS_BRAND.nome} · Copacabana ·
              CNPJ sob demanda
            </span>
            <span>
              Operado sobre o core{" "}
              <Link
                to="/"
                className="underline decoration-primary/50 hover:text-white"
              >
                Impulsionando
              </Link>
            </span>
          </div>
        </div>
      </footer>

      <MarocasHelpFab />
      <MoreContentFab offsetBottom={92} />
    </div>
  );
}
