import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, X, Home, KeyRound, MapPin, Building2, TreePine, Sparkles, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/garrido")({
  head: () => ({
    meta: [
      { title: "Imobiliária Garrido — Compra, venda, locação e temporada no Rio" },
      { name: "description", content: "Imóveis residenciais, comerciais e rurais no Rio de Janeiro e região. Compra, venda, locação, temporada, lançamentos e alto padrão com a Imobiliária Garrido." },
      { property: "og:title", content: "Imobiliária Garrido — Referência no mercado imobiliário do Rio" },
      { property: "og:description", content: "Compra, venda, locação, temporada e lançamentos com curadoria Garrido." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: GarridoLayout,
});

const NAV: { to: string; label: string; icon: any; params?: Record<string, string> }[] = [
  { to: "/garrido", label: "Início", icon: Home },
  { to: "/garrido/buscar", label: "Comprar", icon: KeyRound },
  { to: "/garrido/buscar", label: "Alugar", icon: MapPin },
  { to: "/garrido/buscar", label: "Temporada", icon: Sparkles },
  { to: "/garrido/buscar", label: "Lançamentos", icon: Building2 },
  { to: "/garrido/buscar", label: "Comercial", icon: Building2 },
  { to: "/garrido/buscar", label: "Rural", icon: TreePine },
];

function GarridoLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-tenant", "garrido");
    root.style.setProperty("--garrido-ink", "#1a1f2e");
    root.style.setProperty("--garrido-gold", "#b8935a");
    root.style.setProperty("--garrido-cream", "#f6f1e6");
    return () => { root.removeAttribute("data-tenant"); };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[color:var(--garrido-cream)] text-[color:var(--garrido-ink)] antialiased">
      {/* Topbar institucional */}
      <div className="hidden md:block bg-[color:var(--garrido-ink)] text-white/85 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span>CRECI-RJ · Rio de Janeiro e Região Serrana · Atendimento 7 dias</span>
          <div className="flex items-center gap-4">
            <a href="tel:+552140028922" className="hover:text-white inline-flex items-center gap-1"><Phone className="h-3 w-3" /> (21) 4002-8922</a>
            <a href="https://wa.me/5521999990000" target="_blank" rel="noopener" className="hover:text-white inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/garrido" className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-10 rounded-md bg-[color:var(--garrido-ink)] text-[color:var(--garrido-gold)] grid place-items-center font-serif text-xl font-bold">G</div>
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold tracking-tight text-[color:var(--garrido-ink)]">Garrido</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--garrido-gold)]">Imobiliária</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Navegação principal">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:text-[color:var(--garrido-ink)] hover:bg-[color:var(--garrido-cream)] transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/garrido/avaliar"
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold text-[color:var(--garrido-ink)] border border-[color:var(--garrido-ink)]/20 hover:bg-[color:var(--garrido-cream)]"
            >
              Avaliar meu imóvel
            </Link>
            <Link
              to="/garrido/anunciar"
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-bold text-white bg-[color:var(--garrido-ink)] hover:brightness-125 transition"
            >
              Anunciar imóvel
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  className="block px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link to="/garrido/avaliar" className="text-center rounded-md py-2.5 font-semibold border border-[color:var(--garrido-ink)]/20" onClick={() => setOpen(false)}>Avaliar</Link>
                <Link to="/garrido/anunciar" className="text-center rounded-md py-2.5 font-bold text-white bg-[color:var(--garrido-ink)]" onClick={() => setOpen(false)}>Anunciar</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* WhatsApp flutuante */}
      <a
        href="https://wa.me/5521999990000?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20Imobili%C3%A1ria%20Garrido."
        target="_blank"
        rel="noopener"
        aria-label="Falar no WhatsApp com a Imobiliária Garrido"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-xl hover:scale-105 transition"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Footer */}
      <footer className="mt-16 bg-[color:var(--garrido-ink)] text-white/85">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-serif text-2xl font-bold text-white mb-2">Garrido</div>
            <p className="text-white/70 leading-relaxed">
              Imobiliária tradicional no Rio de Janeiro. Compra, venda, locação, temporada,
              lançamentos, alto padrão, imóveis comerciais e rurais.
            </p>
            <p className="text-white/50 text-xs mt-3">CRECI-J-RJ 12.345 · Desde 1998</p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Encontre seu imóvel</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/garrido/buscar" className="hover:text-white">Comprar</Link></li>
              <li><Link to="/garrido/buscar" className="hover:text-white">Alugar</Link></li>
              <li><Link to="/garrido/buscar" className="hover:text-white">Temporada</Link></li>
              <li><Link to="/garrido/buscar" className="hover:text-white">Lançamentos</Link></li>
              <li><Link to="/garrido/buscar" className="hover:text-white">Alto padrão</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Proprietários</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/garrido/anunciar" className="hover:text-white">Anunciar imóvel</Link></li>
              <li><Link to="/garrido/avaliar" className="hover:text-white">Avaliar meu imóvel</Link></li>
              <li><Link to="/garrido/financiamento" className="hover:text-white">Simulador de financiamento</Link></li>
              <li><Link to="/garrido/contato" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Ecossistema Impulsionando</div>
            <ul className="space-y-1.5 text-white/70">
              <li>CRM · Agenda · WhatsApp</li>
              <li>Área do Cliente · Corretor · Proprietário</li>
              <li>Automações N8N · Impulsionito IA</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Imobiliária Garrido · Operado pelo{" "}
          <span className="text-white font-semibold">Ecossistema Impulsionando</span>
        </div>
      </footer>
    </div>
  );
}
