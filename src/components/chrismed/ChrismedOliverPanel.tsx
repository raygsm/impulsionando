/**
 * ChrismedOliverPanel — painel funcional do concierge Oliver (V3.F).
 *
 * Escuta:
 *  - `chrismed:oliver:open`   → abre o painel.
 *  - `chrismed:oliver:context` → substitui o contexto (saudação + sugestões).
 *
 * Trata-se de um painel funcional com AÇÕES REAIS (navegar, mostrar
 * informação, fechar). Não simula conversa com IA. A integração
 * conversacional (transport, WhatsApp interno, triagem) depende do Codex.
 *
 * A11y é herdada do Radix (Dialog):
 *  - foco inicial no painel;
 *  - retorno de foco ao launcher ao fechar;
 *  - Escape fecha;
 *  - foco preso enquanto aberto;
 *  - respeita prefers-reduced-motion via classes utilitárias.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  resolveOliverContext,
  type OliverContext,
  type OliverQuickReply,
} from '@/content/chrismed/oliver-contexts';

const WHATSAPP_ENABLED = false; // Codex libera quando URL + transferência de contexto forem validadas.

export function ChrismedOliverPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const defaultCtx = useMemo(() => resolveOliverContext(pathname), [pathname]);
  const [override, setOverride] = useState<OliverContext | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const ctx = override ?? defaultCtx;





  // Substitui / limpa o contexto ao mudar de rota.
  useEffect(() => {
    setOverride(null);
    setInfo(null);
    // Sai da CHRISMED → fecha o painel.
    if (!pathname.startsWith('/chrismed')) setOpen(false);
  }, [pathname]);

  // Listeners globais.
  useEffect(() => {
    const onOpen = () => {
      setInfo(null);
      setOpen(true);
    };
    const onContext = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<OliverContext> | undefined;
      if (!detail) return;
      // Aceita override parcial; mescla sobre a base da rota.
      setOverride({
        key: detail.key ?? defaultCtx.key,
        eyebrow: detail.eyebrow ?? defaultCtx.eyebrow,
        greeting: detail.greeting ?? defaultCtx.greeting,
        quickReplies: detail.quickReplies ?? defaultCtx.quickReplies,
      });
    };
    window.addEventListener('chrismed:oliver:open', onOpen);
    window.addEventListener('chrismed:oliver:context', onContext as EventListener);
    return () => {
      window.removeEventListener('chrismed:oliver:open', onOpen);
      window.removeEventListener('chrismed:oliver:context', onContext as EventListener);
    };
  }, [defaultCtx]);

  const runReply = (r: OliverQuickReply) => {
    setInfo(null);
    if (r.kind === 'navigate') {
      setOpen(false);
      navigate({ to: r.to, search: (r.search ?? {}) as never });
      return;
    }
    if (r.kind === 'info') {
      setInfo(r.message);
      return;
    }
    if (r.kind === 'close') {
      setOpen(false);
    }
  };

  return (
    <>
      <span data-oliver-panel-mounted="true" hidden />
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-0 text-[var(--chrismed-ink)] motion-reduce:transition-none motion-reduce:animate-none sm:max-w-md"
      >
        <SheetHeader className="border-b border-[var(--chrismed-sand)] px-6 py-5 text-left">
          <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
            Oliver · {ctx.eyebrow}
          </p>
          <SheetTitle className="chrismed-serif mt-1 text-2xl font-light text-[var(--chrismed-ink)]">
            Concierge CHRISMED
          </SheetTitle>
          <SheetDescription className="chrismed-sans text-sm leading-relaxed text-[var(--chrismed-graphite)]">
            {ctx.greeting}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
            Sugestões
          </p>
          <ul className="mt-4 space-y-2">
            {ctx.quickReplies.map((r) => (
              <li key={r.label}>
                <button
                  type="button"
                  onClick={() => runReply(r)}
                  className="chrismed-sans w-full rounded-none border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]/40 px-4 py-3 text-left text-sm text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] hover:bg-[var(--chrismed-bone)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>

          {info && (
            <div
              role="status"
              aria-live="polite"
              className="chrismed-sans mt-6 border-l-2 border-[var(--chrismed-champagne-deep)] bg-[var(--chrismed-bone)]/60 px-4 py-4 text-sm leading-relaxed text-[var(--chrismed-graphite)]"
            >
              {info}
            </div>
          )}

          <div className="mt-8 border-t border-[var(--chrismed-sand)] pt-6">
            <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
              Continuar por outro canal
            </p>
            <button
              type="button"
              disabled={!WHATSAPP_ENABLED}
              className="chrismed-sans mt-3 w-full cursor-not-allowed border border-dashed border-[var(--chrismed-sand)] bg-transparent px-4 py-3 text-left text-sm text-[var(--chrismed-mist)]"
              aria-disabled="true"
              title="Disponível assim que o Codex fornecer o número oficial e a transferência de contexto."
            >
              Continuar pelo WhatsApp — disponível em breve
            </button>
            <p className="chrismed-sans mt-3 text-[11px] leading-relaxed text-[var(--chrismed-mist)]">
              A conversa com o agente ainda está em integração pelo Codex. Oliver oferece apoio administrativo — não diagnostica, não prescreve e não substitui avaliação médica.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
