import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, X, UtensilsCrossed, Bike, Calendar, Gift, Phone, MessageCircle, MapPin } from "lucide-react";
import { FOOD_MARCA } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice")({
  head: () => ({
    meta: [
      { title: "Food Service — Modelo oficial de gastronomia do Ecossistema Impulsionando" },
      { name: "description", content: "Plataforma completa para bares, restaurantes, hamburguerias, pizzarias, cafeterias, adegas, delivery e food trucks. Cardápio digital, comandas, mesas, QR code, fidelidade e CRM integrados ao Core Impulsionando." },
      { property: "og:title", content: "Food Service — Casa Impulsiona" },
      { property: "og:description", content: "Bar, cozinha e delivery. Do happy hour ao jantar, com cardápio digital, delivery próprio e fidelidade integrada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FoodServiceLayout,
});

const NAV = [
  { to: "/foodservice", label: "Início", icon: UtensilsCrossed, exact: true },
  { to: "/foodservice/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/foodservice/promocoes", label: "Promoções", icon: Gift },
  { to: "/foodservice/delivery", label: "Delivery", icon: Bike },
  { to: "/foodservice/reservas", label: "Reservas", icon: Calendar },
  { to: "/foodservice/fidelidade", label: "Fidelidade", icon: Gift },
  { to: "/foodservice/contato", label: "Contato", icon: Phone },
];

function FoodServiceLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-tenant", "foodservice");
    root.style.setProperty("--fs-ink", "#181513");
    root.style.setProperty("--fs-amber", "#d97706");
    root.style.setProperty("--fs-cream", "#faf6ef");
    root.style.setProperty("--fs-brick", "#7a1e1e");
    return () => {
      root.removeAttribute("data-tenant");
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[color:var(--fs-cream)] text-[color:var(--fs-ink)] antialiased">
      {/* Topbar */}
      <div className="hidden md:block bg-[color:var(--fs-ink)] text-white/85 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {FOOD_MARCA.endereco}</span>
          <div className="flex items-center gap-4">
            <a href={`tel:+55${FOOD_MARCA.telefone.replace(/\D/g, "")}`} className="hover:text-white inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {FOOD_MARCA.telefone}
            </a>
            <a href={FOOD_MARCA.whatsapp} target="_blank" rel="noopener" className="hover:text-white inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/foodservice" className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-10 rounded-lg bg-[color:var(--fs-brick)] text-[color:var(--fs-cream)] grid place-items-center font-serif text-xl font-bold">CI</div>
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold tracking-tight">Casa Impulsiona</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fs-amber)]">Bar · Cozinha · Delivery</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                activeProps={{ className: "bg-[color:var(--fs-brick)]/10 text-[color:var(--fs-brick)]" }}
                activeOptions={n.exact ? { exact: true } : undefined}
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-black/5 transition"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/foodservice/delivery"
              className="hidden md:inline-flex items-center gap-1 rounded-md bg-[color:var(--fs-amber)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              <Bike className="h-4 w-4" /> Pedir Delivery
            </Link>
            <button
              type="button"
              aria-label="Abrir menu"
              className="lg:hidden p-2 rounded-md hover:bg-black/5"
              onClick={() => setOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-lg font-bold">Menu</span>
              <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  activeProps={{ className: "bg-[color:var(--fs-brick)]/10 text-[color:var(--fs-brick)]" }}
                  activeOptions={n.exact ? { exact: true } : undefined}
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-black/5"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[color:var(--fs-ink)] text-white/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[color:var(--fs-brick)] text-[color:var(--fs-cream)] grid place-items-center font-serif font-bold">CI</div>
              <div>
                <div className="font-serif font-bold text-white">Casa Impulsiona</div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--fs-amber)]">Food Service</div>
              </div>
            </div>
            <p className="mt-4 text-white/60 text-xs leading-relaxed">
              Modelo oficial do segmento Gastronomia do Ecossistema Impulsionando.
              Preparado para bares, restaurantes, hamburguerias, pizzarias,
              cafeterias, adegas, delivery, casas noturnas, food trucks e dark kitchens.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Cardápio</div>
            <ul className="space-y-2">
              <li><Link to="/foodservice/cardapio" className="hover:text-white">Cardápio completo</Link></li>
              <li><Link to="/foodservice/promocoes" className="hover:text-white">Promoções e combos</Link></li>
              <li><Link to="/foodservice/delivery" className="hover:text-white">Delivery e retirada</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Casa</div>
            <ul className="space-y-2">
              <li><Link to="/foodservice/reservas" className="hover:text-white">Reserva de mesa</Link></li>
              <li><Link to="/foodservice/reservas" className="hover:text-white">Eventos privados</Link></li>
              <li><Link to="/foodservice/fidelidade" className="hover:text-white">Programa de fidelidade</Link></li>
              <li><Link to="/foodservice/contato" className="hover:text-white">Contato e horários</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Operação (demo)</div>
            <ul className="space-y-2">
              <li><Link to="/foodservice/operacao" className="hover:text-white">Comandas, mesas, cozinha</Link></li>
              <li><Link to="/foodservice/crm" className="hover:text-white">CRM & Impulsionito</Link></li>
              <li className="text-xs text-white/40 pt-3">Powered by Impulsionando</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-white/50 flex items-center justify-between flex-wrap gap-2">
            <span>© {new Date().getFullYear()} Casa Impulsiona · Tenant demo do Ecossistema Impulsionando</span>
            <span>CNPJ {FOOD_MARCA.cnpj}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
