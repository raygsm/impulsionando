import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import {
  buildOfficialWhatsAppUrl,
  OFFICIAL_WHATSAPP_PHONE_DISPLAY,
  trackWhatsAppCTA,
} from "@/lib/whatsapp-cta";

const WHATSAPP_URL = buildOfficialWhatsAppUrl(
  "Olá! Vim pelo site oficial da Impulsionando e gostaria de atendimento pelo canal oficial.",
);

// Não exibir o FAB em áreas autenticadas / login / checkout interno.
const HIDDEN_PREFIXES = [
  "/auth",
  "/reset-password",
  "/reset-password-sent",
  "/checkout",
  "/portal.",
  "/paciente",
  "/mesa",
  "/lovable",
];

export function OfficialWhatsAppFAB() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (
    pathname.startsWith("/_authenticated") ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Canal oficial da Impulsionando"
          className="max-w-[280px] rounded-lg border border-border bg-card text-card-foreground shadow-elegant p-3 text-xs leading-snug animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <strong className="text-foreground">Canal oficial único</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar aviso"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-muted-foreground">
            Toda informação, envio de documentos, comprovantes e solicitações deve
            ser feita <strong className="text-foreground">apenas</strong> pelo WhatsApp
            oficial <strong className="text-foreground">{OFFICIAL_WHATSAPP_PHONE_DISPLAY}</strong>.
            Contatos por outros canais não serão considerados.{" "}
            <a
              href="/canal-oficial"
              className="text-primary underline underline-offset-2"
            >
              Saiba mais
            </a>
            .
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Saiba mais sobre o canal oficial"
          className="hidden sm:inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Canal oficial
        </button>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Falar com a Impulsionando no WhatsApp oficial ${OFFICIAL_WHATSAPP_PHONE_DISPLAY}`}
          data-cta="whatsapp-fab"
          onClick={() =>
            trackWhatsAppCTA("whatsapp_fab_click", {
              origin: "fab",
              path: typeof window !== "undefined" ? window.location.pathname : "",
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-elegant hover:brightness-110 transition-all font-medium text-sm"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">
            WhatsApp oficial · {OFFICIAL_WHATSAPP_PHONE_DISPLAY}
          </span>
        </a>
      </div>
    </div>
  );
}
