/**
 * GarridoShell — Layout unificado da Imobiliária Garrido.
 *
 * Concentra header + navegação pré-filtrada + skip-link + footer +
 * FAB "Há mais conteúdo" (padrão global do ecossistema Onda 2.6).
 *
 * Regras do ecossistema:
 * - WhatsApp NUNCA como CTA principal em rota comercial. Fica só no
 *   rodapé e na página /garrido/contato como canal de suporte.
 * - CTA principal do proprietário: "Avaliar meu imóvel" (interno).
 * - CTA principal do comprador/locatário: "Buscar imóveis" (interno).
 * - Nav aponta com preset (?finalidade=..., ?categoria=..., ?tag=...).
 */
import { Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu as MenuIcon,
  X,
  Home,
  KeyRound,
  MapPin,
  Building2,
  TreePine,
  Sparkles,
  Phone,
  User,
} from "lucide-react";
import { MoreContentFab } from "@/components/impulsionando";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  search?: Record<string, string | number | undefined>;
};

const NAV: NavItem[] = [
  { to: "/garrido", label: "Início", icon: Home },
  { to: "/garrido/comprar", label: "Comprar", icon: KeyRound },
  { to: "/garrido/alugar", label: "Alugar", icon: MapPin },
  { to: "/garrido/temporada", label: "Temporada", icon: Sparkles },
  { to: "/garrido/lancamentos", label: "Lançamentos", icon: Building2 },
  { to: "/garrido/comercial", label: "Comercial", icon: Building2 },
  { to: "/garrido/rural", label: "Rural", icon: TreePine },
];

export function GarridoShell() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-tenant", "garrido");
    root.style.setProperty("--garrido-ink", "#1a1f2e");
    root.style.setProperty("--garrido-gold", "#b8935a");
    root.style.setProperty("--garrido-cream", "#f6f1e6");
    return () => {
      root.removeAttribute("data-tenant");
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[color:var(--garrido-cream)] text-[color:var(--garrido-ink)] antialiased">
      {/* Skip link acessibilidade */}
      <a
        href="#garrido-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:text-[color:var(--garrido-ink)] focus:px-3 focus:py-2 focus:shadow-lg focus:font-semibold"
      >
        Pular para o conteúdo
      </a>

      {/* Topbar institucional */}
      <div className="hidden md:block bg-[color:var(--garrido-ink)] text-white/85 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <span className="min-w-0 truncate">
            CRECI-J-RJ · Rio de Janeiro e Região Serrana · Atendimento 7 dias
          </span>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="tel:+552140028922"
              className="hover:text-white inline-flex items-center gap-1"
            >
              <Phone className="h-3 w-3" aria-hidden /> (21) 4002-8922
            </a>
            <Link
              to="/garrido/entrar"
              className="hover:text-white inline-flex items-center gap-1"
            >
              <User className="h-3 w-3" aria-hidden /> Área do cliente
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap">
          <Link to="/garrido" className="flex items-center gap-2 shrink-0 min-w-0">
            <div
              aria-hidden
              className="h-10 w-10 shrink-0 rounded-md bg-[color:var(--garrido-ink)] text-[color:var(--garrido-gold)] grid place-items-center font-serif text-xl font-bold"
            >
              G
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-serif text-lg font-bold tracking-tight text-[color:var(--garrido-ink)] truncate">
                Garrido
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--garrido-gold)]">
                Imobiliária
              </div>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-1 ml-6 min-w-0"
            aria-label="Navegação principal Garrido"
          >
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="px-3 py-2 rounded-md text-sm font-semibold text-slate-700 hover:text-[color:var(--garrido-ink)] hover:bg-[color:var(--garrido-cream)] transition-colors"
                activeProps={{ className: "text-[color:var(--garrido-ink)] bg-[color:var(--garrido-cream)]" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 hidden lg:block" />

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              to="/garrido/avaliar"
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold text-[color:var(--garrido-ink)] border border-[color:var(--garrido-ink)]/20 hover:bg-[color:var(--garrido-cream)] min-h-11"
            >
              Avaliar meu imóvel
            </Link>
            <Link
              to="/garrido/anunciar"
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-bold text-white bg-[color:var(--garrido-ink)] hover:brightness-125 transition min-h-11"
            >
              Anunciar imóvel
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 min-h-11 min-w-11"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="garrido-mobile-nav"
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <MenuIcon className="h-6 w-6" aria-hidden />}
          </button>
        </div>

        {open && (
          <div id="garrido-mobile-nav" className="lg:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  className="block px-3 py-3 rounded-md font-semibold text-slate-800 hover:bg-slate-100 min-h-11"
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link
                  to="/garrido/avaliar"
                  className="text-center rounded-md py-2.5 font-semibold border border-[color:var(--garrido-ink)]/20 min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Avaliar
                </Link>
                <Link
                  to="/garrido/anunciar"
                  className="text-center rounded-md py-2.5 font-bold text-white bg-[color:var(--garrido-ink)] min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Anunciar
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/garrido/entrar"
                  className="text-center rounded-md py-2.5 font-semibold border border-black/10 min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/garrido/area"
                  className="text-center rounded-md py-2.5 font-semibold border border-black/10 min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Área do cliente
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="garrido-main" className="flex-1">
        <Outlet />
      </main>

      {/* FAB global do ecossistema — indica que há mais conteúdo */}
      <MoreContentFab
        bg="var(--garrido-ink)"
        accent="var(--garrido-gold)"
      />

      {/* Footer */}
      <footer className="mt-16 bg-[color:var(--garrido-ink)] text-white/85">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-serif text-2xl font-bold text-white mb-2">Garrido</div>
            <p className="text-white/70 leading-relaxed">
              Imobiliária no Rio de Janeiro. Compra, venda, locação, temporada,
              lançamentos, alto padrão, imóveis comerciais e rurais. Empresa
              conectada ao Core Impulsionando.
            </p>
            <p className="text-white/50 text-xs mt-3">Registro CRECI ativo</p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Encontre seu imóvel</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/garrido/comprar" className="hover:text-white">Comprar</Link></li>
              <li><Link to="/garrido/alugar" className="hover:text-white">Alugar</Link></li>
              <li><Link to="/garrido/temporada" className="hover:text-white">Temporada</Link></li>
              <li><Link to="/garrido/lancamentos" className="hover:text-white">Lançamentos</Link></li>
              <li><Link to="/garrido/comercial" className="hover:text-white">Comercial</Link></li>
              <li><Link to="/garrido/rural" className="hover:text-white">Rural</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Proprietários & Contas</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/garrido/anunciar" className="hover:text-white">Anunciar imóvel</Link></li>
              <li><Link to="/garrido/avaliar" className="hover:text-white">Avaliar meu imóvel</Link></li>
              <li><Link to="/garrido/financiamento" className="hover:text-white">Simulador de financiamento</Link></li>
              <li><Link to="/garrido/area" className="hover:text-white">Área do cliente</Link></li>
              <li><Link to="/garrido/corretor" className="hover:text-white">Área do corretor</Link></li>
              <li><Link to="/garrido/entrar" className="hover:text-white">Entrar / Cadastrar</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Ajuda</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/garrido/faq" className="hover:text-white">Perguntas frequentes</Link></li>
              <li><Link to="/garrido/politicas" className="hover:text-white">Políticas e LGPD</Link></li>
              <li><Link to="/garrido/contato" className="hover:text-white">Contato & atendimento</Link></li>
              <li className="pt-2 text-xs text-white/50">
                WhatsApp é canal de suporte e pós-venda. Para negociar imóveis,
                use os fluxos internos "Agendar visita" e "Solicitar proposta".
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60 px-4">
          © {new Date().getFullYear()} Imobiliária Garrido · Operado pelo{" "}
          <span className="text-white font-semibold">Ecossistema Impulsionando</span>
        </div>
      </footer>
    </div>
  );
}
