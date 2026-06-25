import { Link } from "@tanstack/react-router";
import { Music2, Sparkles } from "lucide-react";

export function WmpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wmp-brand">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_oklab,var(--wmp-bg)_75%,transparent)] border-b border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/wmp" className="flex items-center gap-2 wmp-display text-xl">
            <Music2 className="size-5" style={{ color: "var(--wmp-gold)" }} />
            <span>WMP</span>
            <span className="text-xs font-normal opacity-70" style={{ fontFamily: "Inter" }}>
              Wagner Miller Produções
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/wmp" hash="servicos" className="opacity-80 hover:opacity-100">Serviços</Link>
            <Link to="/wmp" hash="cases" className="opacity-80 hover:opacity-100">Cases</Link>
            <Link to="/wmp/parceiro" className="opacity-80 hover:opacity-100">Seja Parceiro</Link>
            <Link to="/wmp/orcamento" className="wmp-cta" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
              <Sparkles className="size-4" /> Orçamento em 60s
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[color-mix(in_oklab,var(--wmp-gold)_18%,transparent)]">
        <div className="mx-auto max-w-7xl px-6 py-10 text-sm opacity-70 flex flex-col md:flex-row gap-4 justify-between">
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
