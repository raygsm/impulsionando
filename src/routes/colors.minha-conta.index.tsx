import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingBag, Truck, RefreshCcw, ArrowRight, ShieldAlert } from "lucide-react";
import { AccountPageHeader, OrderStatusBadge } from "@/components/colors/account/AccountShell";
import { COLORS_MOCK_ORDERS, COLORS_MOCK_USER, formatBRL, formatDatePt } from "@/data/colors-mock-account";

export const Route = createFileRoute("/colors/minha-conta/")({
  head: () => ({
    meta: [
      { title: "Painel — Minha conta Colors Saúde" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountIndex,
});

function AccountIndex() {
  const active = COLORS_MOCK_ORDERS.find((o) => o.status !== "delivered" && o.status !== "cancelled");
  const total = COLORS_MOCK_ORDERS.length;

  return (
    <>
      <AccountPageHeader
        title={`Olá, ${COLORS_MOCK_USER.firstName}!`}
        description="Aqui você acompanha pedidos, rastreios e recompra em 1 clique."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={ShoppingBag} label="Pedidos totais" value={String(total)} />
        <Kpi icon={Truck} label="Em andamento" value={active ? "1" : "0"} accent={!!active} />
        <Kpi icon={RefreshCcw} label="Recompra sugerida" value="Em 12 dias" />
      </div>

      {/* Pedido em andamento */}
      {active && (
        <section className="mt-6 rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-lime-500/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Pedido em andamento</p>
              <h2 className="mt-1 text-xl font-bold">{active.number}</h2>
              <p className="text-xs text-white/60">Feito em {formatDatePt(active.createdAt)}</p>
            </div>
            <OrderStatusBadge status={active.status} />
          </div>
          <p className="mt-4 text-sm text-white/70">
            <span className="font-semibold text-white">{active.items[0].name}</span>
            {" · "}<span className="text-white/60">{active.carrier} · previsão {formatDatePt(active.estimatedDelivery)}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/colors/minha-conta/pedidos/$id" params={{ id: active.id }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400"
            >
              Ver rastreio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/colors/rastreio/$codigo" params={{ codigo: active.trackingCode }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Consulta rápida
            </Link>
          </div>
        </section>
      )}

      {/* Últimos pedidos */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">Últimos pedidos</h2>
          <Link to="/colors/minha-conta/pedidos" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">Ver todos →</Link>
        </div>
        <div className="grid gap-3">
          {COLORS_MOCK_ORDERS.slice(0, 3).map((o) => (
            <Link
              key={o.id} to="/colors/minha-conta/pedidos/$id" params={{ id: o.id }}
              className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-emerald-300">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{o.number} · {o.items[0].name}</p>
                  <p className="text-xs text-white/50">{formatDatePt(o.createdAt)} · {o.carrier}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={o.status} />
                <span className="text-sm font-bold">{formatBRL(o.totalCents)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Aviso oficial */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <p className="text-sm text-amber-100/90">
          Compre sempre pelos <strong>canais oficiais da Colors Saúde</strong>. Não vendemos em marketplaces genéricos.
        </p>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-4 " + (accent ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]")}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60"><Icon className="h-4 w-4 text-emerald-400" /> {label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
