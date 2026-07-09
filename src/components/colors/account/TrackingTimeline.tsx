import { Truck, CheckCircle2, Circle, MapPin, Package } from "lucide-react";
import type { ColorsOrder } from "@/data/colors-mock-account";
import { formatDatePt } from "@/data/colors-mock-account";

/**
 * TrackingTimeline — timeline visual de rastreamento Correios / Melhor Envio.
 * Frontend-only, dados mockados. Pronto para receber payload real de API.
 */
export default function TrackingTimeline({ order }: { order: ColorsOrder }) {
  const doneCount = order.timeline.filter((e) => e.done).length;
  const pct = Math.round((doneCount / order.timeline.length) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Rastreamento</p>
            <p className="mt-1 text-lg font-bold">{order.carrier}</p>
            <p className="text-xs text-white/60">Código: <span className="font-mono text-white/80">{order.trackingCode}</span></p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-white/50">Previsão</p>
          <p className="text-sm font-bold text-white">{formatDatePt(order.estimatedDelivery)}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/60">{doneCount} de {order.timeline.length} etapas concluídas · {pct}%</p>
      </div>

      {/* Steps */}
      <ol className="mt-6 space-y-4">
        {order.timeline.map((ev, i) => {
          const isNext = !ev.done && order.timeline.slice(0, i).every((e) => e.done);
          return (
            <li key={i} className="relative flex gap-4 pl-1">
              <div className="flex flex-col items-center">
                <span
                  className={
                    "grid h-8 w-8 place-items-center rounded-full ring-1 " +
                    (ev.done
                      ? "bg-emerald-500 text-black ring-emerald-300"
                      : isNext
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40 animate-pulse"
                        : "bg-white/5 text-white/40 ring-white/15")
                  }
                >
                  {ev.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </span>
                {i < order.timeline.length - 1 && (
                  <span className={"my-1 h-8 w-px " + (ev.done ? "bg-emerald-400/50" : "bg-white/10")} />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={"font-bold " + (ev.done ? "text-white" : "text-white/60")}>{ev.title}</p>
                  {ev.date && <p className="text-xs text-white/50">{formatDatePt(ev.date, true)}</p>}
                </div>
                {ev.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                    <MapPin className="h-3 w-3" /> {ev.location}
                  </p>
                )}
                {ev.description && <p className="mt-1 text-sm text-white/70">{ev.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Package className="h-4 w-4" /> Objeto: {order.items.map((i) => i.name).join(", ")}
        </div>
        <a
          href="https://wa.me/5521967862834"
          target="_blank" rel="noreferrer"
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
        >
          Precisa de ajuda com a entrega?
        </a>
      </div>
    </div>
  );
}
