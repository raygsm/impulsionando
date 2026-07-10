import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { colorsEvents } from "@/lib/colors-analytics";

/**
 * Floating CTA — "Comprar Original".
 *
 * Onda 1 (front-end): removido o botão "Suporte" no WhatsApp deste FAB.
 * O atendimento conversacional passa a ser centralizado no Impulsionito
 * (bottom-left, montado no __root). O WhatsApp permanece disponível nas
 * páginas onde é canal oficial documentado (rastreio, minha-conta),
 * como link inline — nunca como FAB flutuante.
 */
interface Props {
  /** Rota interna do CTA principal. Default: PDP Super Green Black. */
  buyTo?: "/colors/super-green-black" | "/colors";
  /** Rótulo de origem enviado ao analytics. */
  source?: string;
}

export default function ComprarOriginalFab({
  buyTo = "/colors/super-green-black",
  source = "fab",
}: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5"
      aria-label="Ações rápidas"
    >
      <div className="pointer-events-auto">
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
