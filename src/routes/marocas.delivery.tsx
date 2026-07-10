import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Truck, Clock, ArrowRight, MapPin } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_BAIRROS_DELIVERY,
  MAROCAS_IMAGENS,
} from "@/components/marocas/marocasContent";
import { formatBRL } from "@/components/marocas/useMarocasCart";

const CANONICAL = "https://impulsionando.com.br/marocas/delivery";

export const Route = createFileRoute("/marocas/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery próprio na Zona Sul — Marocas Copacabana" },
      {
        name: "description",
        content:
          "Delivery próprio da Marocas em Copacabana, Leme, Ipanema, Leblon, Botafogo, Flamengo, Lagoa e adjacências. Sem intermediário, taxa fixa por bairro.",
      },
      { property: "og:title", content: "Delivery próprio na Zona Sul — Marocas" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.praia },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const [busca, setBusca] = useState("");

  const bairros = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t
      ? MAROCAS_BAIRROS_DELIVERY.filter((b) =>
          b.nome.toLowerCase().includes(t),
        )
      : MAROCAS_BAIRROS_DELIVERY;
  }, [busca]);

  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Delivery" },
      ]}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.praia}
            alt="Copacabana vista da orla"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-24 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 inline-flex items-center gap-2">
            <Truck className="h-3.5 w-3.5" /> Entrega própria · Zona Sul
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-[1.05]">
            Do nosso salão para a sua sala, sem intermediário.
          </h1>
          <p className="mt-5 text-lg text-white/85">
            Motos da casa entregam em Copacabana, Leme, Ipanema, Leblon,
            Botafogo, Flamengo, Lagoa, Jardim Botânico e adjacências. Sem taxas
            de app, sem surpresas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/marocas/cardapio"
              className="rounded-full bg-primary text-primary-foreground px-8 py-4 font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
            >
              Pedir agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PROMESSA */}
      <section className="container mx-auto px-4 md:px-6 py-14 grid md:grid-cols-3 gap-4">
        {[
          {
            t: "Sem intermediário",
            d: "Você paga direto pra casa. Sem taxa de app, sem sobrepreço no cardápio.",
          },
          {
            t: "Rastreio real",
            d: "Você vê a moto saindo do salão e chegando na sua porta.",
          },
          {
            t: "Pagamento como quiser",
            d: "PIX (aprovação em segundos), cartão online ou na entrega.",
          },
        ].map((p) => (
          <div key={p.t} className="rounded-2xl border p-5 bg-card">
            <div className="font-serif font-bold text-lg">{p.t}</div>
            <p className="text-sm text-muted-foreground mt-2">{p.d}</p>
          </div>
        ))}
      </section>

      {/* BAIRROS */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Área de entrega
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">
                Onde entregamos
              </h2>
              <p className="text-muted-foreground mt-2">
                {MAROCAS_BAIRROS_DELIVERY.length} bairros da Zona Sul. Copacabana
                é grátis.
              </p>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar bairro..."
                inputMode="search"
                className="w-full sm:w-72 rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Buscar bairro"
              />
            </div>
          </div>

          {bairros.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="font-semibold">Ainda não entregamos aí</p>
              <p className="text-sm text-muted-foreground mt-1">
                Consulte pelo WhatsApp — dependendo da distância podemos abrir
                exceção para eventos.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {bairros.map((b) => (
                <li
                  key={b.nome}
                  className={`rounded-2xl border p-4 bg-card ${b.destaque ? "border-primary shadow-md" : ""}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin
                      className={`h-4 w-4 ${b.destaque ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {b.nome}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {b.prazo}
                    </span>
                    <span
                      className={`font-bold ${b.taxa === 0 ? "text-emerald-600" : ""}`}
                    >
                      {b.taxa === 0 ? "Grátis" : formatBRL(b.taxa)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Pedido mínimo R$ 40. Fora do horário, você pode agendar pelo
            WhatsApp da casa.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">
            Bora comer?
          </h2>
          <p className="mt-2 opacity-90">
            Cardápio aberto agora. Pedido em 2 minutos.
          </p>
          <div className="mt-6">
            <Link
              to="/marocas/cardapio"
              className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Ver cardápio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
