import { createFileRoute, Link } from "@tanstack/react-router";
import { UtensilsCrossed, Clock, MapPin, Truck, Store, CalendarDays, ShieldCheck, Sparkles, Star, ArrowRight, Flame, Leaf } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { marocasCategorias, marocasItens } from "@/components/marocas/foodMenu";
import { formatBRL } from "@/components/marocas/useMarocasCart";

const CANONICAL = "/marocas";

export const Route = createFileRoute("/marocas")({
  head: () => ({
    meta: [
      { title: "Marocas — Cardápio, delivery e reservas" },
      { name: "description", content: "Peça pelo cardápio digital, reserve mesa ou receba em casa. Marocas é o cliente de referência do ecossistema Impulsionando para bares, restaurantes, cafeterias, hamburguerias, pizzarias e delivery." },
      { property: "og:title", content: "Marocas — Cardápio, delivery e reservas" },
      { property: "og:description", content: "Cozinha da casa. Delivery próprio. Reservas em 2 cliques." },
      { property: "og:type", content: "restaurant.restaurant" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "Marocas",
          servesCuisine: ["Brasileira", "Contemporânea"],
          priceRange: "$$",
          acceptsReservations: true,
          hasMenu: { "@type": "Menu", url: "/marocas/cardapio" },
        }),
      },
    ],
  }),
  component: MarocasHome,
});

const HERO_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80";

function MarocasHome() {
  const destaques = marocasItens.filter((i) => i.tags?.includes("mais-pedido")).slice(0, 4);
  const novidades = marocasItens.filter((i) => i.tags?.includes("novo")).slice(0, 3);

  return (
    <MarocasShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_IMG} alt="Ambiente Marocas" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" /> Cozinha da casa · Rio de Janeiro
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3 leading-tight">
            Peça agora. Ou reserve mesa.<br />A Marocas cuida do resto.
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Cardápio digital, delivery próprio, retirada em 15 min e reservas em 2 cliques. Preparado para comandas por pulseira numerada.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/marocas/cardapio" className="rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition inline-flex items-center gap-2">
              Ver cardápio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/marocas/reservas" className="rounded-lg bg-white/10 backdrop-blur border border-white/30 px-6 py-3 font-semibold hover:bg-white/20 transition inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Reservar mesa
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Delivery próprio Zona Sul</span>
            <span className="flex items-center gap-1.5"><Store className="h-4 w-4" /> Retirada em 15 min</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Aberto até 23h</span>
          </div>
        </div>
      </section>

      {/* MODOS */}
      <section className="container mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-4">
        {[
          { icon: <Truck className="h-6 w-6" />, t: "Delivery", d: "Entrega própria. Taxa por bairro, sem intermediário.", to: "/marocas/cardapio" },
          { icon: <Store className="h-6 w-6" />, t: "Retirada", d: "Pronto em 15 min. Aviso quando estiver na bandeja.", to: "/marocas/cardapio" },
          { icon: <CalendarDays className="h-6 w-6" />, t: "Reserva de mesa", d: "Confirmação em 2 cliques. Sem taxa de reserva.", to: "/marocas/reservas" },
        ].map((m) => (
          <Link key={m.t} to={m.to} className="rounded-2xl border p-5 hover:border-primary hover:shadow-md transition bg-card">
            <div className="text-primary">{m.icon}</div>
            <div className="font-semibold mt-3">{m.t}</div>
            <div className="text-sm text-muted-foreground mt-1">{m.d}</div>
          </Link>
        ))}
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 md:px-6 py-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-bold">Explore o cardápio</h2>
          <Link to="/marocas/cardapio" className="text-sm font-semibold text-primary hover:underline">
            Ver tudo →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6">
          {marocasCategorias.map((c) => (
            <Link
              key={c.id}
              to="/marocas/cardapio"
              search={{ cat: c.id } as any}
              className="rounded-xl border p-4 text-center hover:border-primary hover:bg-primary/5 transition"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="font-semibold mt-2 text-sm">{c.nome}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* MAIS PEDIDOS */}
      <section className="container mx-auto px-4 md:px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" /> Mais pedidos
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {destaques.map((item) => (
            <Link
              key={item.slug}
              to="/marocas/cardapio/$slug"
              params={{ slug: item.slug }}
              className="group rounded-2xl border overflow-hidden bg-card hover:shadow-md transition"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={item.imagem} alt={item.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="p-4">
                <div className="font-semibold">{item.nome}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.descricao}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold">{formatBRL(item.precoBase)}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.tempoPreparoMin} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NOVIDADES */}
      {novidades.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Novidades da temporada
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {novidades.map((item) => (
                <Link
                  key={item.slug}
                  to="/marocas/cardapio/$slug"
                  params={{ slug: item.slug }}
                  className="group rounded-2xl border overflow-hidden bg-card hover:shadow-md transition flex gap-3"
                >
                  <div className="w-32 aspect-square shrink-0 overflow-hidden bg-muted">
                    <img src={item.imagem} alt={item.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-3 flex-1 min-w-0">
                    <div className="text-[10px] font-semibold uppercase text-primary tracking-wider">Novo</div>
                    <div className="font-semibold text-sm">{item.nome}</div>
                    <div className="mt-2 font-bold text-sm">{formatBRL(item.precoBase)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONFIANÇA */}
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { i: <ShieldCheck className="h-5 w-5" />, t: "Pagamento seguro", d: "PIX, cartão e pagar na retirada." },
            { i: <Truck className="h-5 w-5" />, t: "Entrega própria", d: "Sem intermediário. Rastreio em tempo real." },
            { i: <Leaf className="h-5 w-5" />, t: "Ingredientes frescos", d: "Feiras locais e produtores da região." },
            { i: <Star className="h-5 w-5" />, t: "Feito por gente da casa", d: "Cozinha própria. Sem terceirização." },
          ].map((b) => (
            <div key={b.t} className="rounded-xl border p-4">
              <div className="text-primary">{b.i}</div>
              <div className="font-semibold mt-2">{b.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ENDEREÇO / HORÁRIO */}
      <section className="container mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-2xl border p-6 grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" /> <span className="text-xs font-semibold uppercase tracking-wider">Endereço</span>
            </div>
            <p className="mt-2 font-semibold">Rua Exemplo, 123 · Zona Sul · Rio de Janeiro</p>
            <p className="text-sm text-muted-foreground mt-1">Delivery próprio nos bairros vizinhos.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" /> <span className="text-xs font-semibold uppercase tracking-wider">Horário</span>
            </div>
            <ul className="mt-2 text-sm space-y-1">
              <li className="flex justify-between"><span>Ter–Qui</span><span className="font-medium">18h–23h</span></li>
              <li className="flex justify-between"><span>Sex–Sáb</span><span className="font-medium">12h–00h</span></li>
              <li className="flex justify-between"><span>Domingo</span><span className="font-medium">12h–22h</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Segunda</span><span>Fechado</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* PLATAFORMA IMPULSIONANDO */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-[2fr_1fr] gap-8 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Você também opera um bar, restaurante ou dark kitchen?</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              A Marocas roda sobre a plataforma Impulsionando de food service.
            </h2>
            <p className="mt-3 opacity-90">
              Cardápio digital, delivery próprio, reservas, comandas por pulseira e dashboard consolidado — tudo em um só lugar.
              Sem taxa por pedido, sem intermediário.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/marocas/planos" className="rounded-lg bg-background text-foreground px-6 py-3 font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
              Ver planos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
