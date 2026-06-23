/**
 * ImpulsionitoFab — FAB global do assistente Impulsionito.
 *
 * Mostra dica contextual por rota e por nicho (?nicho= ou /nichos/$slug)
 * e abre o WhatsApp oficial com mensagem pré-preenchida.
 *
 * Posicionado em bottom-left para não conflitar com o OfficialWhatsAppFAB
 * (bottom-right). Não aparece em áreas autenticadas, login ou painéis internos.
 */
import { useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bot, X, MessageCircle } from "lucide-react";
import { buildOfficialWhatsAppUrl, trackWhatsAppCTA } from "@/lib/whatsapp-cta";
import { getImpulsionitoContext } from "@/data/impulsionito-context";

const HIDDEN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/reset-password-sent",
  "/portal.",
  "/paciente",
  "/mesa",
  "/lovable",
  "/admin",
];

function extractNiche(pathname: string, search: string): string | undefined {
  const sp = new URLSearchParams(search);
  const fromQuery = sp.get("nicho") ?? sp.get("niche") ?? undefined;
  if (fromQuery) return fromQuery;
  const nichoMatch = pathname.match(/^\/(?:nichos|recomendacao)\/([^/?#]+)/);
  return nichoMatch?.[1];
}

export function ImpulsionitoFab() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const [open, setOpen] = useState(false);

  const ctx = useMemo(() => {
    const niche = extractNiche(pathname, searchStr ?? "");
    return getImpulsionitoContext(pathname, niche);
  }, [pathname, searchStr]);

  if (
    pathname.startsWith("/_authenticated") ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  const waUrl = buildOfficialWhatsAppUrl(ctx.whatsapp);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Dica do Impulsionito"
          className="max-w-[300px] rounded-lg border border-border bg-card text-card-foreground shadow-elegant p-3 text-xs leading-snug animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5">
              <span className="inline-flex w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </span>
              <strong className="text-foreground">Impulsionito</strong>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar dica"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-muted-foreground mb-2">{ctx.tip}</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="impulsionito-fab"
            data-ctx={ctx.id}
            onClick={() =>
              trackWhatsAppCTA("whatsapp_fab_click", {
                origin: "impulsionito",
                path: pathname,
                ctx: ctx.id,
              })
            }
            className="inline-flex items-center gap-1.5 w-full justify-center rounded-md bg-[#25D366] text-white px-3 py-1.5 text-xs font-medium hover:brightness-110"
          >
            <MessageCircle className="w-3.5 h-3.5" /> {ctx.cta}
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Abrir assistente Impulsionito"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-3.5 py-2.5 shadow-elegant hover:brightness-110 transition-all font-medium text-sm"
      >
        <Bot className="w-5 h-5" aria-hidden="true" />
        <span className="hidden sm:inline">Impulsionito</span>
      </button>
    </div>
  );
}
