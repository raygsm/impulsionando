import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, X, ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { colorsEvents } from "@/lib/colors-analytics";

/**
 * Popup antifalsificação — exibido 1x por usuário (localStorage).
 * Alerta contra falsificações e reforça canais oficiais da Colors Saúde.
 */
const STORAGE_KEY = "colors:antifake-popup:v1";

export default function AntiFakePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  function dismiss(source: "entendi" | "comprar" | "close") {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* ignore */ }
    setOpen(false);
    colorsEvents.ctaClick("antifake_popup", source);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="antifake-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#0a0f0d] shadow-[0_40px_120px_-10px_rgba(16,185,129,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_0%,rgba(239,68,68,0.25),transparent_60%),radial-gradient(600px_circle_at_50%_100%,rgba(16,185,129,0.25),transparent_60%)]" />

        <button
          type="button"
          onClick={() => dismiss("close")}
          aria-label="Fechar aviso"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:bg-black/70 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pt-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-400 ring-1 ring-red-400/30">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </div>

          <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.28em] text-red-300">
            Atenção
          </p>
          <h2
            id="antifake-title"
            className="mt-2 text-center text-3xl font-black leading-tight text-white sm:text-4xl"
          >
            Cuidado com <span className="text-red-400">falsificações</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm text-white/75 sm:text-base">
            Para garantir que você está levando o <strong className="text-white">Super Green Black Original</strong>,
            compre <strong className="text-emerald-300">somente pelos canais oficiais da Colors Saúde</strong>.
            Não vendemos em marketplaces genéricos.
          </p>

          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-sm text-white/80">
            {[
              { icon: BadgeCheck, t: "Fórmula, lote e validade autênticos" },
              { icon: Lock, t: "Pagamento em ambiente seguro (PCI-DSS)" },
              { icon: ShieldCheck, t: "Garantia e suporte oficial Colors" },
            ].map((it) => (
              <li key={it.t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <it.icon className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <span>{it.t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => dismiss("entendi")}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Entendi
            </button>
            <Link
              to="/colors/super-green-black"
              onClick={() => dismiss("comprar")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-sm font-black text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.02]"
            >
              🔒 Comprar Original
            </Link>
          </div>

          <p className="mt-4 text-center text-[11px] text-white/45">
            Este aviso aparece apenas uma vez. Você pode fechá-lo a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
