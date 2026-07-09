import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Search, ArrowRight } from "lucide-react";
import { AccountPageHeader, OrderStatusBadge } from "@/components/colors/account/AccountShell";
import { COLORS_MOCK_ORDERS, formatBRL, formatDatePt } from "@/data/colors-mock-account";

export const Route = createFileRoute("/colors/minha-conta/pedidos")({
  head: () => ({ meta: [{ title: "Meus pedidos — Colors Saúde" }, { name: "robots", content: "noindex" }] }),
  component: PedidosPage,
});

function PedidosPage() {
  const [q, setQ] = useState("");
  const list = COLORS_MOCK_ORDERS.filter((o) => {
    const t = (o.number + " " + o.items.map((i) => i.name).join(" ") + " " + o.trackingCode).toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <>
      <AccountPageHeader
        title="Meus pedidos" icon={Package}
        description="Histórico completo, rastreios e opção de recompra em 1 clique."
      />

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
        <Search className="h-4 w-4 text-white/50" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, produto ou código de rastreio"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>

      <div className="grid gap-3">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/60">
            Nenhum pedido encontrado para <strong className="text-white">"{q}"</strong>.
          </div>
        )}
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-white/50">{formatDatePt(o.createdAt)}</p>
                <h3 className="mt-1 truncate font-bold">{o.number}</h3>
                <p className="mt-1 text-sm text-white/70">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-white/50">{o.carrier} · <span className="font-mono">{o.trackingCode}</span></p>
              </div>
              <div className="text-right">
                <OrderStatusBadge status={o.status} />
                <p className="mt-2 text-lg font-black">{formatBRL(o.totalCents)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/colors/minha-conta/pedidos/$id" params={{ id: o.id }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
              >
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/colors/rastreio/$codigo" params={{ codigo: o.trackingCode }}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                Rastreio rápido
              </Link>
              <Link
                to="/colors/produto/$slug" params={{ slug: o.items[0].slug }}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                Recomprar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
