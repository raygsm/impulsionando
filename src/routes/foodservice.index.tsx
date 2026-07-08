import { createFileRoute, Link } from "@tanstack/react-router";
import { UtensilsCrossed, Bike, Calendar, Gift, Star, Clock, MapPin, ChefHat, Wine, Sparkles, ArrowRight, Flame, Heart, ShieldCheck } from "lucide-react";
import { FOOD_MARCA, FOOD_CATEGORIAS, FOOD_PRODUTOS, FOOD_PROMOCOES, formatBRL } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/")({
  head: () => ({
    meta: [
      { title: "Casa Impulsiona — Bar, cozinha e delivery na Barra da Tijuca" },
      { name: "description", content: "Hambúrgueres artesanais, pizzas napolitanas, drinks autorais e cervejas artesanais. Salão, delivery e retirada com cardápio digital e fidelidade Impulsionando." },
      { property: "og:title", content: "Casa Impulsiona — Bar, cozinha e delivery" },
      { property: "og:description", content: "Do happy hour ao jantar. Peça no salão, delivery ou retirada." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: FOOD_MARCA.nome,
        servesCuisine: ["Contemporânea", "Hambúrguer", "Pizza Napolitana"],
        priceRange: "$$",
        address: { "@type": "PostalAddress", streetAddress: FOOD_MARCA.endereco },
        telephone: FOOD_MARCA.telefone,
        openingHours: ["Mo-Th 12:00-00:00", "Fr-Sa 12:00-02:00", "Su 12:00-23:00"],
        acceptsReservations: true,
      }),
    }],
  }),
  component: FoodHome,
});

function FoodHome() {
  const destaques = FOOD_PRODUTOS.filter((p) => p.destaque).slice(0, 6);
  const maisPedidos = FOOD_PRODUTOS.filter((p) => p.maisPedido).slice(0, 4);
  const promoDestaque = FOOD_PROMOCOES.filter((p) => p.destaque);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600')] bg-cover bg-center" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--fs-ink)]/95 via-[color:var(--fs-ink)]/80 to-[color:var(--fs-ink)]/40" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--fs-amber)]/20 border border-[color:var(--fs-amber)]/40 px-4 py-1.5 text-xs font-semibold text-[color:var(--fs-amber)] uppercase tracking-widest">
            <Flame className="h-3 w-3" /> Aberto agora · Delivery em 40 min
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-6 leading-tight max-w-3xl">
            Bar, cozinha e delivery — <span className="text-[color:var(--fs-amber)]">do happy hour ao jantar.</span>
          </h1>
          <p className="mt-6 text-lg text-white/85 max-w-2xl">
            Hambúrgueres artesanais, pizzas napolitanas de fermentação natural, cervejas rotativas e drinks autorais.
            Peça no salão, delivery ou retirada — sempre com fidelidade Impulsionando.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/foodservice/cardapio" className="inline-flex items-center gap-2 bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 transition">
              <UtensilsCrossed className="h-4 w-4" /> Ver cardápio completo
            </Link>
            <Link to="/foodservice/delivery" className="inline-flex items-center gap-2 bg-white text-[color:var(--fs-ink)] px-6 py-3 rounded-md font-semibold hover:bg-white/90 transition">
              <Bike className="h-4 w-4" /> Pedir delivery agora
            </Link>
            <Link to="/foodservice/reservas" className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-md font-semibold hover:bg-white/10 transition">
              <Calendar className="h-4 w-4" /> Reservar mesa
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/80">
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-[color:var(--fs-amber)]" /> 4.8 · 2.3k avaliações</span>
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> Delivery em 40 min</span>
            <span className="inline-flex items-center gap-2"><Bike className="h-4 w-4" /> Raio de {FOOD_MARCA.raioEntrega}</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Frete grátis acima de R$ 89</span>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { i: ChefHat, t: "Cozinha aberta 7 dias" },
            { i: Bike, t: "Delivery próprio, sem app terceiro" },
            { i: Heart, t: "Fidelidade + cashback Impulsionando" },
            { i: Wine, t: "Adega e carta autoral" },
          ].map((it) => (
            <div key={it.t} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[color:var(--fs-cream)] text-[color:var(--fs-brick)] grid place-items-center">
                <it.i className="h-5 w-5" />
              </div>
              <span className="font-medium">{it.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--fs-amber)]">Cardápio</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1">Explore por categoria</h2>
          </div>
          <Link to="/foodservice/cardapio" className="text-sm font-semibold text-[color:var(--fs-brick)] inline-flex items-center gap-1 hover:gap-2 transition-all">
            Ver todos os itens <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {FOOD_CATEGORIAS.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              to="/foodservice/cardapio"
              search={{ cat: c.slug } as any}
              className="group rounded-xl border border-black/5 bg-white p-5 hover:shadow-lg hover:border-[color:var(--fs-amber)]/40 transition"
            >
              <div className="text-2xl">{catEmoji(c.slug)}</div>
              <div className="font-serif font-bold mt-3 group-hover:text-[color:var(--fs-brick)]">{c.nome}</div>
              <div className="text-xs text-black/60 mt-1">{c.descricao}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--fs-amber)]">Assinatura da casa</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1">Os favoritos da Casa Impulsiona</h2>
            </div>
            <Link to="/foodservice/cardapio" className="text-sm font-semibold text-[color:var(--fs-brick)] inline-flex items-center gap-1">Ver mais <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {destaques.map((p) => (
              <Link
                key={p.slug}
                to="/foodservice/produto/$slug"
                params={{ slug: p.slug }}
                className="group rounded-xl overflow-hidden bg-[color:var(--fs-cream)] border border-black/5 hover:shadow-xl transition"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">
                    {p.maisPedido && <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> Mais pedido</span>}
                    {p.novo && <span>Novo</span>}
                    {p.dieta?.includes("vegetariano") && <span>Vegetariano</span>}
                  </div>
                  <div className="font-serif font-bold text-lg mt-1 group-hover:text-[color:var(--fs-brick)]">{p.nome}</div>
                  <p className="text-xs text-black/60 mt-1 line-clamp-2">{p.descricao}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-[color:var(--fs-brick)]">{formatBRL(p.preco)}</span>
                    <span className="text-xs text-black/50 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.tempoPreparo}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promoções */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--fs-amber)]">Ofertas</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1">Promoções ativas</h2>
          </div>
          <Link to="/foodservice/promocoes" className="text-sm font-semibold text-[color:var(--fs-brick)] inline-flex items-center gap-1">Todas as ofertas <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {promoDestaque.map((p) => (
            <div key={p.slug} className="rounded-xl border-2 border-dashed border-[color:var(--fs-amber)] bg-white p-6">
              <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--fs-amber)] font-bold">
                <Gift className="h-3 w-3" /> {p.tipo === "primeira-compra" ? "Primeira compra" : p.tipo === "happy-hour" ? "Happy hour" : "Oferta"}
              </div>
              <h3 className="font-serif font-bold text-xl mt-2">{p.titulo}</h3>
              <p className="text-sm text-black/70 mt-2">{p.chamada}</p>
              {p.codigo && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs">
                  <span className="text-black/60">Cupom:</span>
                  <code className="rounded bg-[color:var(--fs-cream)] px-2 py-1 font-mono font-bold text-[color:var(--fs-brick)]">{p.codigo}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Delivery / retirada / mesa */}
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
          {[
            { i: Bike, t: "Delivery próprio", d: "Sem app terceiro. Entregadores da casa, rastreamento ao vivo e frete grátis acima de R$ 89.", to: "/foodservice/delivery", cta: "Pedir delivery" },
            { i: MapPin, t: "Retirada no balcão", d: "Peça, pague online e retire pronto em 20 minutos. Cupom de 5% na retirada.", to: "/foodservice/delivery", cta: "Retirar no balcão" },
            { i: Calendar, t: "Reserva de mesa", d: "Salão para 180 pessoas, área externa e privês para grupos. Reserve sem taxa.", to: "/foodservice/reservas", cta: "Reservar mesa" },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white/5 p-6 border border-white/10">
              <c.i className="h-6 w-6 text-[color:var(--fs-amber)]" />
              <h3 className="font-serif font-bold text-xl mt-3">{c.t}</h3>
              <p className="text-sm text-white/70 mt-2">{c.d}</p>
              <Link to={c.to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--fs-amber)] hover:gap-2 transition-all">
                {c.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Mais pedidos */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--fs-amber)]">Mais pedidos</p>
        <h2 className="font-serif text-3xl font-bold mt-1">Os campeões do delivery</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {maisPedidos.map((p) => (
            <Link
              key={p.slug}
              to="/foodservice/produto/$slug"
              params={{ slug: p.slug }}
              className="group rounded-lg overflow-hidden bg-white border border-black/5 hover:shadow-lg transition"
            >
              <div className="aspect-square overflow-hidden">
                <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold line-clamp-2 group-hover:text-[color:var(--fs-brick)]">{p.nome}</div>
                <div className="text-sm font-bold text-[color:var(--fs-brick)] mt-1">{formatBRL(p.preco)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ecossistema */}
      <section className="bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="rounded-2xl bg-gradient-to-br from-[color:var(--fs-brick)] to-[color:var(--fs-ink)] text-white p-8 md:p-12">
            <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Ecossistema Impulsionando</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3 max-w-2xl">
              Muito além de um restaurante. Uma operação inteira gerenciada por um só Core.
            </h2>
            <p className="mt-4 text-white/80 max-w-2xl">
              Cardápio digital, comandas por QR code, cozinha, balcão, delivery próprio,
              rastreamento de motoboys, CRM de aniversariantes, cashback, fidelidade,
              automações WhatsApp e o agente <strong className="text-[color:var(--fs-amber)]">Impulsionito</strong>
              recomendando pratos por perfil, dieta e ocasião.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/foodservice/operacao" className="inline-flex items-center gap-2 bg-white text-[color:var(--fs-ink)] px-5 py-3 rounded-md font-semibold hover:bg-white/90">
                <Sparkles className="h-4 w-4" /> Ver operação (demo)
              </Link>
              <Link to="/foodservice/crm" className="inline-flex items-center gap-2 border border-white/40 px-5 py-3 rounded-md font-semibold hover:bg-white/10">
                CRM & Impulsionito
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function catEmoji(slug: string): string {
  const m: Record<string, string> = {
    entradas: "🥖", hamburgueres: "🍔", pizzas: "🍕", principais: "🍽️",
    saladas: "🥗", sobremesas: "🍰", cervejas: "🍺", drinks: "🍸",
    vinhos: "🍷", "nao-alcoolicos": "🧃", kids: "🧒",
  };
  return m[slug] ?? "🍴";
}
