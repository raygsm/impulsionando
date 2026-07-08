import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Search,
  Building2,
  Package,
  Wrench,
  CalendarDays,
  Bike,
  Building,
  Ticket,
  Wallet,
  Heart,
  Star,
  Sparkles,
  History,
  User,
  Crown,
} from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

/**
 * Shell oficial do Clube Impulsionando (consumidor final).
 * Ativa o escopo `data-tenant="clube"` para que os primitivos da
 * biblioteca `src/components/impulsionando/*` herdem o token de cor
 * do Clube automaticamente.
 */
const NAV = [
  { to: "/clube", label: "Home", icon: Home, exact: true },
  { to: "/clube/buscar", label: "Buscar", icon: Search },
  { to: "/clube/empresas", label: "Empresas", icon: Building2 },
  { to: "/clube/produtos", label: "Produtos", icon: Package },
  { to: "/clube/servicos", label: "Serviços", icon: Wrench },
  { to: "/clube/eventos", label: "Eventos", icon: CalendarDays },
  { to: "/clube/delivery", label: "Delivery", icon: Bike },
  { to: "/clube/imoveis", label: "Imóveis", icon: Building },
  { to: "/clube/vouchers", label: "Vouchers", icon: Ticket },
  { to: "/clube/cashback", label: "Cashback", icon: Wallet },
  { to: "/clube/favoritos", label: "Favoritos", icon: Heart },
  { to: "/clube/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/clube/recomendacoes", label: "Impulsionito", icon: Sparkles },
  { to: "/clube/historico", label: "Histórico", icon: History },
  { to: "/clube/minha-conta", label: "Minha Conta", icon: User },
  { to: "/clube/planos", label: "Planos", icon: Crown },
] as const;

export function ClubeShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div data-tenant="clube" className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      {/* Nav horizontal com rolagem em mobile */}
      <nav aria-label="Clube" className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {NAV.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
              return (
                <li key={to} className="shrink-0">
                  <Link
                    to={to}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm border transition ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
