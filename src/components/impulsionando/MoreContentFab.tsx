/**
 * MoreContentFab — Botão flutuante "há mais conteúdo, role para ver".
 *
 * Padrão global do Ecossistema Impulsionando (Onda 2.6): aparece sempre que
 * a página está scrollável (scrollHeight > clientHeight + 32) e o usuário
 * ainda está longe do fim (>= 160px). Desaparece quando chega perto do fim.
 * Ao clicar, rola ~85% da viewport com scroll-smooth.
 *
 * Uso típico dentro do shell de cada tenant:
 *   <MoreContentFab accent="var(--garrido-gold)" bg="var(--garrido-ink)" />
 *
 * Nunca colocar 2× por página (o shell já monta uma instância).
 */
import { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

export interface MoreContentFabProps {
  /** cor do texto/icone. Default: var(--primary-foreground) */
  accent?: string;
  /** cor do fundo. Default: var(--primary) */
  bg?: string;
  /** label acessível. Default em pt-BR. */
  label?: string;
  /** oculta se sticky bottom-nav estiver presente */
  offsetBottom?: number;
  /** classe adicional para posicionamento (evita conflito com WhatsApp FAB) */
  className?: string;
}

export function MoreContentFab({
  accent = "var(--primary-foreground, #fff)",
  bg = "var(--primary, #1a1f2e)",
  label = "Há mais conteúdo — role para ver mais",
  offsetBottom = 20,
  className = "",
}: MoreContentFabProps) {
  const [visible, setVisible] = useState(false);

  const check = useCallback(() => {
    if (typeof window === "undefined") return;
    const doc = document.documentElement;
    const total = doc.scrollHeight;
    const viewport = window.innerHeight;
    const scrolled = window.scrollY || doc.scrollTop;
    const scrollable = total - viewport > 32;
    const nearBottom = total - (scrolled + viewport) < 160;
    setVisible(scrollable && !nearBottom);
  }, []);

  useEffect(() => {
    check();
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener("scroll", check, opts);
    window.addEventListener("resize", check, opts);
    // Recheck após mount de conteúdo dinâmico (imagens etc.)
    const t = window.setTimeout(check, 400);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.clearTimeout(t);
    };
  }, [check]);

  const scrollMore = () => {
    if (typeof window === "undefined") return;
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollMore}
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
        visible ? "opacity-95 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
      } ${className}`}
      style={{
        bottom: `${offsetBottom}px`,
        backgroundColor: bg,
        color: accent,
      }}
    >
      <span className="hidden sm:inline">Role para ver mais</span>
      <span className="sm:hidden">Mais abaixo</span>
      <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
    </button>
  );
}
