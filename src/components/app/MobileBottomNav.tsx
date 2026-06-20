import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Store, Search, Bell, Menu } from "lucide-react";
import { useAudience } from "@/hooks/use-audience";

/**
 * Bottom-tab bar exibida apenas no mobile (<lg). Complementa o Sheet do
 * MobileSidebar, oferecendo acesso 1-toque às áreas mais frequentes do
 * ecossistema. Os destinos variam por audiência.
 */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { audience } = useAudience();

  const tabs = [
    { to: "/dashboard", label: "Início", icon: LayoutDashboard },
    audience === "consumidor"
      ? { to: "/consumidor/beneficios", label: "Benefícios", icon: Store }
      : { to: "/marketplace-eco", label: "Marketplace", icon: Store },
    { to: "/buscar", label: "Buscar", icon: Search },
    { to: "/notifications", label: "Avisos", icon: Bell },
    { to: "/ajuda", label: "Menu", icon: Menu },
  ] as const;

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span className="truncate max-w-[64px]">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
