// Shell padrão Marocas food service. Header + footer + breadcrumbs + link mobile.
// Reutilizável por qualquer tenant do nicho de alimentação: basta trocar
// `brand`, `home` e `nav` — os componentes internos permanecem.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, ShoppingBag, Menu as MenuIcon, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useMarocasCart } from "./useMarocasCart";
import { MarocasHelpFab } from "./MarocasHelpFab";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  breadcrumbs?: Crumb[];
  children: ReactNode;
  hideCartBadge?: boolean;
}

const NAV = [
  { label: "Cardápio", to: "/marocas/cardapio" },
  { label: "Reservas", to: "/marocas/reservas" },
  { label: "Meus pedidos", to: "/marocas/pedidos" },
  { label: "Planos", to: "/marocas/planos" },
];

export function MarocasShell({ breadcrumbs, children, hideCartBadge }: Props) {
  const { totalItens } = useMarocasCart();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1 focus:rounded"
      >
        Ir para o conteúdo
      </a>

      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/marocas" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Marocas
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-primary transition" activeProps={{ className: "text-primary font-semibold" }}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!hideCartBadge && (
              <Link
                to="/marocas/carrinho"
                className="relative rounded-full p-2 hover:bg-muted transition"
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
              className="hidden md:inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Entrar
            </Link>
            <button
              className="md:hidden rounded-md border p-2"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="container mx-auto px-4 md:px-6 py-2 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
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
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-bold">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="rounded-md border p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="p-4 space-y-1 text-lg">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} onClick={() => setOpen(false)} className="block px-3 py-3 rounded-md hover:bg-muted">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/marocas/login" onClick={() => setOpen(false)} className="block px-3 py-3 rounded-md hover:bg-muted">
                Entrar
              </Link>
            </li>
          </ul>
        </div>
      )}

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 md:px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-bold text-base">
              <UtensilsCrossed className="h-5 w-5 text-primary" /> Marocas
            </div>
            <p className="text-muted-foreground mt-2">
              Cozinha da casa, delivery próprio e reservas — operado sobre o core Impulsionando.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Pedir</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/marocas/cardapio" className="hover:text-primary">Cardápio</Link></li>
              <li><Link to="/marocas/reservas" className="hover:text-primary">Reservar mesa</Link></li>
              <li><Link to="/marocas/pedidos" className="hover:text-primary">Meus pedidos</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Institucional</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/marocas/planos" className="hover:text-primary">Planos para operadores</Link></li>
              <li><Link to="/marocas/faq" className="hover:text-primary">Dúvidas frequentes</Link></li>
              <li><Link to="/marocas/assistente" className="hover:text-primary">Assistente Marocas</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Suporte</div>
            <p className="text-muted-foreground">
              WhatsApp: SAC e pós-venda. Para pedidos, use sempre o app.<br />
              Horário: 11h às 23h.
            </p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Marocas · Cliente conectado ao core Impulsionando.
        </div>
      </footer>

      <MarocasHelpFab />
    </div>
  );
}
