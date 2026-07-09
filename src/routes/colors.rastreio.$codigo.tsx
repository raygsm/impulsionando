import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PackageX } from "lucide-react";
import { findOrderByTracking } from "@/data/colors-mock-account";
import TrackingTimeline from "@/components/colors/account/TrackingTimeline";

export const Route = createFileRoute("/colors/rastreio/$codigo")({
  head: ({ params }) => ({
    meta: [
      { title: `Rastreio ${params.codigo} — Colors Saúde` },
      { name: "description", content: "Acompanhe seu pedido Colors Saúde em tempo real (Correios/Melhor Envio)." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const o = findOrderByTracking(params.codigo);
    // Mesmo sem match retornamos o code — a UI mostra estado "não encontrado".
    return { order: o ?? null, code: params.codigo };
  },
  component: RastreioResultPage,
});

function RastreioResultPage() {
  const { order, code } = Route.useLoaderData() as { order: ReturnType<typeof findOrderByTracking> | null; code: string };
  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <header className="border-b border-white/10 bg-[#050a08]/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/colors" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
            <span className="text-lg font-black tracking-tight">colors<span className="text-emerald-400">.</span></span>
          </Link>
          <Link to="/colors/rastreio" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Nova busca
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Rastreio Colors</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Código <span className="font-mono text-emerald-300">{code}</span>
        </h1>

        {order ? (
          <div className="mt-6 space-y-6">
            <TrackingTimeline order={order} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
              Este pedido está associado a <strong className="text-white">{order.number}</strong>.{" "}
              <Link to="/colors/minha-conta/pedidos/$id" params={{ id: order.id }} className="font-semibold text-emerald-300 hover:text-emerald-200">
                Ver detalhes na minha conta →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-white/60">
              <PackageX className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Não encontramos esse código.</h2>
            <p className="mt-2 text-sm text-white/60">
              Verifique se digitou corretamente. Códigos Correios costumam ter 13 caracteres (ex.: <span className="font-mono">OT987654321BR</span>).
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/colors/rastreio" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400">
                Tentar outro código
              </Link>
              <a href="https://wa.me/5521967862834" target="_blank" rel="noreferrer"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
