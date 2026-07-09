import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Copy, FileText, MapPin, Package, ShieldCheck, MessageCircle } from "lucide-react";
import { AccountPageHeader, OrderStatusBadge } from "@/components/colors/account/AccountShell";
import TrackingTimeline from "@/components/colors/account/TrackingTimeline";
import { COLORS_MOCK_ORDERS, formatBRL, formatDatePt, type ColorsOrder } from "@/data/colors-mock-account";

export const Route = createFileRoute("/colors/minha-conta/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Pedido — Colors Saúde" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }): ColorsOrder => {
    const o = COLORS_MOCK_ORDERS.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return o;
  },
  notFoundComponent: NotFoundOrder,
  component: PedidoDetalhe,
});

function NotFoundOrder() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
      <p className="text-sm text-white/70">Pedido não encontrado.</p>
      <Link to="/colors/minha-conta/pedidos" className="mt-3 inline-block text-sm font-semibold text-emerald-300 hover:text-emerald-200">
        ← Voltar para meus pedidos
      </Link>
    </div>
  );
}

function PedidoDetalhe() {
  const o = Route.useLoaderData() as ColorsOrder;
  const subtotal = o.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  return (
    <>
      <div className="mb-2">
        <Link to="/colors/minha-conta/pedidos" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Todos os pedidos
        </Link>
      </div>

      <AccountPageHeader
        title={`Pedido ${o.number}`}
        description={`Feito em ${formatDatePt(o.createdAt, true)}`}
        action={<OrderStatusBadge status={o.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="space-y-6">
          <TrackingTimeline order={o} />

          {/* Itens */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/70">
              <Package className="h-4 w-4 text-emerald-400" /> Itens do pedido
            </h2>
            <ul className="divide-y divide-white/5">
              {o.items.map((i) => (
                <li key={i.slug} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{i.name}</p>
                    <p className="text-xs text-white/50">{i.brandLabel} · {i.variant} · Qtd {i.qty}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatBRL(i.priceCents * i.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm">
              <Row k="Subtotal" v={formatBRL(subtotal)} />
              <Row k="Frete" v={o.shippingCents === 0 ? "Grátis" : formatBRL(o.shippingCents)} accent={o.shippingCents === 0} />
              <Row k="Total" v={formatBRL(o.totalCents)} strong />
              <Row k="Forma de pagamento" v={payMethodLabel(o.paymentMethod)} muted />
            </div>
          </section>
        </div>

        {/* Coluna lateral */}
        <aside className="space-y-4">
          <SideCard title="Endereço de entrega" icon={MapPin}>
            <p className="font-bold text-white">{o.address.street}, {o.address.number}{o.address.complement ? ` · ${o.address.complement}` : ""}</p>
            <p>{o.address.district} · {o.address.city}/{o.address.state}</p>
            <p>CEP {o.address.zip}</p>
          </SideCard>

          <SideCard title="Código de rastreio" icon={ShieldCheck}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-white">{o.trackingCode}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(o.trackingCode)}
                className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Copiar código"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-white/50">Transportadora: {o.carrier}</p>
          </SideCard>

          <SideCard title="Nota fiscal" icon={FileText}>
            <p>Disponível assim que o pedido for postado.</p>
            <button disabled className="mt-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/40">
              Em breve
            </button>
          </SideCard>

          <a href="https://wa.me/5521967862834" target="_blank" rel="noreferrer"
            className="block rounded-2xl border border-emerald-500/30 bg-[#25D366]/15 p-4 text-center transition hover:bg-[#25D366]/25">
            <MessageCircle className="mx-auto h-5 w-5 text-emerald-300" />
            <p className="mt-2 text-sm font-bold text-white">Falar com suporte Colors</p>
            <p className="text-xs text-white/60">Atendimento humano no WhatsApp</p>
          </a>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v, strong, muted, accent }: { k: string; v: string; strong?: boolean; muted?: boolean; accent?: boolean }) {
  return (
    <div className={"flex justify-between " + (strong ? "text-base font-black text-white pt-2" : "") + (muted ? " text-white/50" : "")}>
      <span>{k}</span>
      <span className={accent ? "font-bold text-emerald-300" : ""}>{v}</span>
    </div>
  );
}
function SideCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
        <Icon className="h-3.5 w-3.5 text-emerald-400" /> {title}
      </h3>
      <div className="space-y-1 text-sm text-white/70">{children}</div>
    </section>
  );
}
function payMethodLabel(m: "pix" | "credit_card" | "boleto") {
  return { pix: "Pix", credit_card: "Cartão de crédito", boleto: "Boleto" }[m];
}
