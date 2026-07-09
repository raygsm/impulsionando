import { Link } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { colorsEvents } from "@/lib/colors-analytics";

/**
 * Floating CTAs — "Comprar Original" + WhatsApp.
 * Mobile-safe: respeita safe-area, empilha vertical no mobile.
 * Colocar no fim da árvore (após o footer).
 */
interface Props {
  /** Rota interna do CTA principal. Default: PDP Super Green Black. */
  buyTo?: "/colors/super-green-black" | "/colors";
  /** URL do WhatsApp oficial. */
  whatsappHref?: string;
  /** Rótulo de origem enviado ao analytics. */
  source?: string;
}

export default function ComprarOriginalFab({
  buyTo = "/colors/super-green-black",
  whatsappHref = "https://wa.me/5521967862834",
  source = "fab",
}: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5"
      aria-label="Ações rápidas"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => colorsEvents.whatsappClick(source)}
          aria-label="Suporte Colors no WhatsApp (SAC e pós-venda)"
          title="Suporte SAC · pós-venda e dúvidas de pedido"
          className="group inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)] transition hover:scale-[1.03] hover:bg-[#20bd5a]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Suporte</span>
        </a>

        <Link
          to={buyTo}
          onClick={() => colorsEvents.ctaClick("fab_comprar_original", buyTo)}
          aria-label="Comprar Super Green Black original"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-5 py-3 text-sm font-black text-black shadow-[0_14px_36px_-8px_rgba(16,185,129,0.75)] transition hover:scale-[1.03]"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 -left-6 w-6 -skew-x-12 bg-white/40 opacity-0 transition group-hover:translate-x-[220%] group-hover:opacity-100"
          />
          <ShieldCheck className="h-5 w-5" aria-hidden />
          <span>Comprar Original</span>
        </Link>
      </div>
    </div>
  );
}
