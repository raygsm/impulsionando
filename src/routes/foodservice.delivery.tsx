import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Bike, Store, MapPin, Clock, CheckCircle2, ChefHat, Package, Route as RouteIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { FOOD_MARCA } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery e Retirada — Casa Impulsiona" },
      { name: "description", content: "Delivery próprio no raio de 6 km com rastreamento ao vivo, frete grátis acima de R$ 89 e retirada expressa no balcão em 20 minutos." },
      { property: "og:title", content: "Delivery próprio Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/delivery" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/delivery" }],
  }),
  component: DeliveryPage,
});

const ETAPAS = [
  { icon: CheckCircle2, t: "Pedido recebido", d: "Confirmado", at: "19:04" },
  { icon: ChefHat, t: "Na cozinha", d: "Preparando", at: "19:08" },
  { icon: Package, t: "Pronto para retirada", d: "Aguardando motoboy", at: "19:26" },
  { icon: RouteIcon, t: "A caminho", d: "Motoboy Alex · Honda CG 160", at: "19:30" },
  { icon: MapPin, t: "Entregue", d: "Previsão 19:44", at: "" },
];

const BAIRROS = [
  { nome: "Barra da Tijuca", tempo: "35-45 min", taxa: "R$ 9,90", grafis: true },
  { nome: "Recreio", tempo: "45-55 min", taxa: "R$ 14,90" },
  { nome: "Jacarepaguá", tempo: "45-60 min", taxa: "R$ 12,90" },
  { nome: "Itanhangá", tempo: "40-50 min", taxa: "R$ 11,90" },
  { nome: "Joá / São Conrado", tempo: "40-50 min", taxa: "R$ 15,90" },
  { nome: "Vargem Grande / Pequena", tempo: "50-70 min", taxa: "R$ 18,90" },
];

function DeliveryPage() {
  const [modo, setModo] = useState<"delivery" | "retirada">("delivery");
  const cepId = useId();

  return (
    <>
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Delivery próprio</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Peça e receba em 40 minutos.</h1>
          <p className="mt-3 text-white/85 max-w-2xl">
            Entregadores da casa (motos e bicicletas), rastreamento ao vivo, frete grátis acima de R$ 89
            e taxa dinâmica por bairro. Sem apps terceiros, sem intermediários.
          </p>

          <div className="mt-8 inline-flex rounded-md bg-white/10 p-1">
            <button type="button" onClick={() => setModo("delivery")}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded text-sm font-semibold ${modo === "delivery" ? "bg-[color:var(--fs-amber)] text-white" : "text-white/80"}`}>
              <Bike className="h-4 w-4" /> Delivery
            </button>
            <button type="button" onClick={() => setModo("retirada")}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded text-sm font-semibold ${modo === "retirada" ? "bg-[color:var(--fs-amber)] text-white" : "text-white/80"}`}>
              <Store className="h-4 w-4" /> Retirada no balcão
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        {/* Formulário CEP + rastreamento */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <h2 className="font-serif text-xl font-bold">
              {modo === "delivery" ? "Consulte a taxa para seu endereço" : "Retirar no balcão"}
            </h2>
            <p className="text-sm text-black/60 mt-1">
              {modo === "delivery"
                ? `Atendemos em raio de ${FOOD_MARCA.raioEntrega}. Digite seu CEP para consultar taxa e tempo estimado.`
                : `Retire seu pedido em ${FOOD_MARCA.endereco}. Ganhe 5% OFF em retiradas no balcão.`}
            </p>
            {modo === "delivery" && (
              <form className="mt-4 flex flex-wrap gap-3" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor={cepId} className="sr-only">CEP</label>
                <input id={cepId} type="text" inputMode="numeric" placeholder="00000-000"
                  className="flex-1 min-w-[180px] rounded-md border border-black/10 px-4 py-2.5 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                <button type="submit" className="bg-[color:var(--fs-amber)] text-white px-5 py-2.5 rounded-md font-semibold hover:opacity-90">
                  Consultar taxa
                </button>
              </form>
            )}
            {modo === "retirada" && (
              <div className="mt-4 rounded-md bg-[color:var(--fs-cream)] p-4 text-sm">
                <div className="font-semibold">Endereço para retirada</div>
                <div className="text-black/70 mt-1">{FOOD_MARCA.endereco}</div>
                <div className="text-xs text-black/60 mt-2">Balcão retirada: entrada lateral · das 12h às 23h</div>
              </div>
            )}
          </div>

          {/* Rastreamento */}
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold">Rastreie seu pedido</h2>
                <p className="text-sm text-black/60">Exemplo de pedido #2418 · previsão 19:44</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-3 py-1">A caminho</span>
            </div>
            <ol className="mt-6 space-y-4">
              {ETAPAS.map((e, i) => {
                const done = i < 3;
                const now = i === 3;
                return (
                  <li key={e.t} className="flex gap-3">
                    <div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : now ? "bg-[color:var(--fs-amber)] text-white" : "bg-black/5 text-black/40"}`}>
                      <e.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${done || now ? "" : "text-black/40"}`}>{e.t}</span>
                        {e.at && <span className="text-xs text-black/50">{e.at}</span>}
                      </div>
                      <div className="text-sm text-black/60">{e.d}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 rounded-xl bg-[color:var(--fs-cream)] p-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[color:var(--fs-brick)] text-white grid place-items-center font-bold">AS</div>
                <div>
                  <div className="font-semibold">Alex Santos · Motoboy</div>
                  <div className="text-xs text-black/60">Honda CG 160 · placa ABC-1D23 · 4.9 ★</div>
                </div>
                <a href={FOOD_MARCA.whatsapp} target="_blank" rel="noopener" className="ml-auto text-xs font-semibold rounded-md border border-black/10 px-3 py-1.5 hover:bg-white">
                  Falar
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bairros */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <h3 className="font-serif font-bold">Bairros atendidos</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {BAIRROS.map((b) => (
                <li key={b.nome} className="flex items-center justify-between gap-2 py-1.5 border-b border-black/5 last:border-0">
                  <div>
                    <div className="font-semibold">{b.nome}</div>
                    <div className="text-xs text-black/50 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {b.tempo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[color:var(--fs-brick)] text-sm">{b.taxa}</div>
                    {b.grafis && <div className="text-[10px] text-emerald-700 font-bold">Grátis acima R$ 89</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[color:var(--fs-cream)] border border-[color:var(--fs-amber)]/30 p-6">
            <ShieldCheck className="h-6 w-6 text-[color:var(--fs-brick)]" />
            <h3 className="font-serif font-bold mt-2">Frota própria, sem app terceiro</h3>
            <p className="text-sm text-black/70 mt-2">
              Nossos motoboys e ciclistas são da casa. Rastreamento nativo, previsão dinâmica
              e comunicação direta via WhatsApp. Você não paga taxa de plataforma.
            </p>
          </div>
        </aside>
      </section>

      <section className="bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="font-serif text-2xl font-bold">Pronto para pedir?</h2>
          <p className="text-sm text-black/60 mt-2">Cardápio completo com fotos, adicionais, promoções e combos.</p>
          <Link to="/foodservice/cardapio" className="mt-4 inline-flex items-center gap-2 bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90">
            Ver cardápio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
