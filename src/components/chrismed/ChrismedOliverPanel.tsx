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
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  resolveOliverContextOverride,
  type OliverContext,
  type OliverQuickReply,
} from '@/content/chrismed/oliver-contexts';
import {
  closeChrismedOliver,
  focusChrismedOliverTrigger,
  openChrismedOliver,
  setChrismedOliverInfo,
  useChrismedOliverState,
} from './oliver-store';

const WHATSAPP_ENABLED = false; // Codex libera quando URL + transferência de contexto forem validadas.

export function ChrismedOliverPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { open, context, info } = useChrismedOliverState();

  const ctx: OliverContext = resolveOliverContextOverride(pathname, context);

  const runReply = (r: OliverQuickReply) => {
    setChrismedOliverInfo(null);
    if (r.kind === 'navigate') {
      closeChrismedOliver();
      navigate({ to: r.to as never, search: (r.search ?? {}) as never });
      return;
    }
    if (r.kind === 'info') {
      setChrismedOliverInfo(r.message);
      return;
    }
    if (r.kind === 'close') {
      closeChrismedOliver();
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) openChrismedOliver();
        else closeChrismedOliver();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          onPointerDown={closeChrismedOliver}
          className="fixed inset-0 z-[90] bg-[var(--chrismed-noir)]/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-chrismed-oliver-panel
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            focusChrismedOliverTrigger();
          }}
          className="fixed inset-y-0 right-0 z-[91] flex h-dvh w-full max-w-[min(100vw,28rem)] flex-col gap-0 border-l border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-0 text-[var(--chrismed-ink)] shadow-[0_24px_80px_-24px_rgba(15,15,15,0.55)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right motion-reduce:animate-none"
        >
        <div className="border-b border-[var(--chrismed-sand)] px-6 py-5 text-left">
          <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
            Oliver · {ctx.eyebrow}
          </p>
          <DialogPrimitive.Title className="chrismed-serif mt-1 text-2xl font-light text-[var(--chrismed-ink)]">
            Concierge CHRISMED
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="chrismed-sans mt-2 pr-10 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
            {ctx.greeting}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            type="button"
            aria-label="Fechar Oliver"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center border border-[var(--chrismed-sand)] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>

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
            >
              Canal indisponível neste momento
            </button>
            <p className="chrismed-sans mt-3 text-[11px] leading-relaxed text-[var(--chrismed-mist)]">
              Oliver oferece apoio administrativo — não diagnostica, não prescreve e não substitui avaliação médica.
            </p>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
