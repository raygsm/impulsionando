import { Link } from "@tanstack/react-router";
import { Music2, Sparkles, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";

type Crumb = { label: string; to?: string };

export function WmpShell({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: Crumb[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="wmp-brand">
      <a
        href="#wmp-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md"
        style={{ background: "var(--wmp-gold)", color: "var(--wmp-bg)" }}
      >
        Pular para o conteúdo
      </a>

      <header
        className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_oklab,var(--wmp-bg)_75%,transparent)] border-b border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)]"
        role="banner"
      >
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link
            to="/wmp"
            className="flex items-center gap-2 wmp-display text-xl"
            aria-label="WMP — Wagner Miller Produções, ir para o início"
          >
            <Music2 className="size-5" style={{ color: "var(--wmp-gold)" }} aria-hidden />
            <span>WMP</span>
            <span
              className="hidden sm:inline text-xs font-normal opacity-70"
              style={{ fontFamily: "Inter" }}
            >
              Wagner Miller Produções
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm" aria-label="Menu principal">
            <Link to="/wmp/pacotes" className="opacity-80 hover:opacity-100">Pacotes</Link>
            <Link to="/wmp/cases" className="opacity-80 hover:opacity-100">Cases</Link>
            <Link to="/wmp/sobre" className="opacity-80 hover:opacity-100">Sobre</Link>
            <Link to="/wmp/faq" className="opacity-80 hover:opacity-100">FAQ</Link>
            <Link to="/wmp/parceiro" className="opacity-80 hover:opacity-100">Seja Parceiro</Link>
            <Link
              to="/wmp/orcamento"
              className="wmp-cta"
              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              <Sparkles className="size-4" aria-hidden /> Orçamento em 60s
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center size-10 rounded-lg"
            style={{ background: "var(--wmp-surface-2)", color: "var(--wmp-fg)" }}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="wmp-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open && (
          <nav
            id="wmp-mobile-nav"
            className="md:hidden border-t border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)]"
            aria-label="Menu mobile"
          >
            <ul className="px-6 py-4 flex flex-col gap-3 text-sm">
              <li><Link to="/wmp/pacotes" onClick={() => setOpen(false)}>Pacotes</Link></li>
              <li><Link to="/wmp/cases" onClick={() => setOpen(false)}>Cases</Link></li>
              <li><Link to="/wmp/sobre" onClick={() => setOpen(false)}>Sobre</Link></li>
              <li><Link to="/wmp/faq" onClick={() => setOpen(false)}>FAQ</Link></li>
              <li><Link to="/wmp/parceiro" onClick={() => setOpen(false)}>Seja Parceiro</Link></li>
              <li>
                <Link
                  to="/wmp/orcamento"
                  onClick={() => setOpen(false)}
                  className="wmp-cta w-full justify-center"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.875rem" }}
                >
                  <Sparkles className="size-4" aria-hidden /> Orçamento em 60s
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Trilha de navegação"
          className="mx-auto max-w-7xl px-6 pt-4 text-xs opacity-75"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/wmp" className="hover:underline">WMP</Link>
            </li>
            {breadcrumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {c.to && i < breadcrumbs.length - 1 ? (
                  <Link to={c.to} className="hover:underline">{c.label}</Link>
                ) : (
                  <span aria-current="page" className="opacity-90">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <main id="wmp-main">{children}</main>

      <footer
        className="mt-24 border-t border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)]"
        role="contentinfo"
      >
        <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="wmp-display text-lg mb-2">WMP</div>
            <p className="opacity-70 leading-relaxed">
              Plataforma completa de produção, gestão e comercialização de eventos —
              som, luz, palco, estrutura e experiências.
            </p>
          </div>
          <div>
            <div className="wmp-display text-sm mb-3 opacity-90">Contratar</div>
            <ul className="space-y-2 opacity-80">
              <li><Link to="/wmp/orcamento" className="hover:opacity-100">Solicitar orçamento</Link></li>
              <li><Link to="/wmp/pacotes" className="hover:opacity-100">Pacotes</Link></li>
              <li><Link to="/wmp/cases" className="hover:opacity-100">Cases</Link></li>
            </ul>
          </div>
          <div>
            <div className="wmp-display text-sm mb-3 opacity-90">Institucional</div>
            <ul className="space-y-2 opacity-80">
              <li><Link to="/wmp/sobre" className="hover:opacity-100">Sobre a WMP</Link></li>
              <li><Link to="/wmp/faq" className="hover:opacity-100">Perguntas frequentes</Link></li>
              <li><Link to="/wmp/parceiro" className="hover:opacity-100">Seja parceiro</Link></li>
            </ul>
          </div>
          <div>
            <div className="wmp-display text-sm mb-3 opacity-90">Suporte</div>
            <ul className="space-y-2 opacity-80">
              <li className="flex items-start gap-2">
                <MessageCircle className="size-4 mt-0.5 shrink-0" aria-hidden style={{ color: "var(--wmp-gold)" }} />
                <span>
                  WhatsApp: canal exclusivo de atendimento pós-venda e suporte a clientes já contratados.
                  Para novos orçamentos, use o briefing online.
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-8 text-xs opacity-60 flex flex-col md:flex-row gap-3 justify-between">
          <span>© {new Date().getFullYear()} Wagner Miller Produções — todos os direitos reservados.</span>
          <span>
            Operado no ecossistema{" "}
            <a href="/" className="underline">Impulsionando</a>.
          </span>
        </div>
      </footer>
    </div>
  );
}
