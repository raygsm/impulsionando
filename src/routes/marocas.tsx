import { createFileRoute, Link } from "@tanstack/react-router";
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Truck,
  Store,
  CalendarDays,
  ShieldCheck,
  Star,
  ArrowRight,
  Flame,
  Leaf,
  Sparkles,
  Instagram,
  Waves,
  Sun,
} from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  marocasCategorias,
  marocasItens,
} from "@/components/marocas/foodMenu";
import { formatBRL } from "@/components/marocas/useMarocasCart";
import {
  MAROCAS_BRAND,
  MAROCAS_CONTATO,
  MAROCAS_HORARIOS,
  MAROCAS_IMAGENS,
  MAROCAS_IMPRENSA,
  MAROCAS_PROVA_SOCIAL,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas";

export const Route = createFileRoute("/marocas")({
  head: () => ({
    meta: [
      {
        title:
          "Marocas — Cozinha da casa em Copacabana · Delivery, reservas e eventos",
      },
      {
        name: "description",
        content:
          "Cozinha da casa no coração de Copacabana. Delivery próprio na Zona Sul, reservas em 2 cliques, eventos privados e comandas por pulseira numerada no salão. Desde 2012.",
      },
      {
        property: "og:title",
        content: "Marocas · Copacabana · Cardápio, delivery e reservas",
      },
      {
        property: "og:description",
        content:
          "Copacabana à mesa, o Rio no prato. Delivery próprio, reservas em 2 cliques e salão até 00h nos fins de semana.",
      },
      { property: "og:type", content: "restaurant.restaurant" },
      { property: "og:url", content: "https://impulsionando.com.br/marocas" },
      { property: "og:image", content: MAROCAS_IMAGENS.heroSalao },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: MAROCAS_IMAGENS.heroSalao },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/marocas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "Marocas",
          image: MAROCAS_IMAGENS.heroSalao,
          servesCuisine: ["Brasileira", "Contemporânea", "Carioca"],
          priceRange: "$$",
          acceptsReservations: true,
          telephone: MAROCAS_CONTATO.telefone,
          address: {
            "@type": "PostalAddress",
            streetAddress: MAROCAS_CONTATO.enderecoLinha1,
            addressLocality: "Copacabana",
            addressRegion: "RJ",
            postalCode: MAROCAS_CONTATO.cep,
            addressCountry: "BR",
          },
          hasMenu: { "@type": "Menu", url: "/marocas/cardapio" },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Tuesday", "Wednesday", "Thursday"],
              opens: "18:00",
              closes: "23:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Friday", "Saturday"],
              opens: "12:00",
              closes: "00:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: "Sunday",
              opens: "12:00",
              closes: "22:00",
            },
          ],
        }),
      },
    ],
  }),
  component: MarocasHome,
});

function MarocasHome() {
  const destaques = marocasItens
    .filter((i) => i.tags?.includes("mais-pedido"))
    .slice(0, 4);
  const novidades = marocasItens
    .filter((i) => i.tags?.includes("novo"))
    .slice(0, 3);
  const galeria = marocasItens.slice(0, 6);

  return (
    <MarocasShell transparentHeader>
      {/* ============ HERO CINEMÁTICO — Copacabana ============ */}
      <section className="relative overflow-hidden min-h-[92dvh] flex items-end">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.heroCopacabana}
            alt="Copacabana à noite vista do calçadão"
            className="h-full w-full object-cover scale-105 animate-[fade-in_1.2s_ease-out]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 md:px-6 pt-32 pb-16 md:pb-24 text-white max-w-4xl">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/90 border border-amber-300/30 rounded-full px-3 py-1 backdrop-blur-sm">
            <Sun className="h-3.5 w-3.5" />
            Copacabana · Rio de Janeiro · Desde {MAROCAS_BRAND.fundacao}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mt-6 leading-[0.95] tracking-tight">
            Copacabana à mesa,
            <br />
            <span className="italic text-amber-300">o Rio</span> no prato.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
            Cozinha da casa no bairro mais cosmopolita do Brasil. Peça delivery,
            reserve mesa ou celebre com a gente — do bolinho de bacalhau da vó
            ao chopp gelado no calçadão.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/marocas/cardapio"
              className="group rounded-full bg-primary text-primary-foreground px-8 py-4 font-semibold hover:opacity-90 transition inline-flex items-center gap-2 shadow-2xl shadow-primary/30 hover-scale"
            >
              Pedir agora
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/marocas/reservas"
              className="rounded-full bg-white/10 backdrop-blur-md border border-white/30 px-8 py-4 font-semibold hover:bg-white/20 transition inline-flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" /> Reservar mesa
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Delivery próprio Zona Sul
            </span>
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4" /> Retirada em 15 min
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Aberto até 00h sex/sáb
            </span>
          </div>
        </div>

        {/* Wave divider — calçadão de Copacabana */}
        <svg
          aria-hidden
          viewBox="0 0 1440 120"
          className="absolute bottom-0 left-0 right-0 w-full h-16 md:h-24 text-background"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,80 C240,120 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
          />
        </svg>
      </section>

      {/* ============ PROVA SOCIAL — MÉTRICAS ============ */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-4 md:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {MAROCAS_PROVA_SOCIAL.map((p) => (
            <div key={p.label} className="animate-fade-in">
              <div className="font-serif text-3xl md:text-4xl font-bold text-primary">
                {p.valor}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1 leading-snug">
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MODOS DE PEDIR ============ */}
      <section className="container mx-auto px-4 md:px-6 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Do jeito que você quiser
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
            Três formas de comer Marocas hoje
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: <Truck className="h-6 w-6" />,
              t: "Delivery próprio",
              d: "Motos da casa entregam em Copacabana, Leme, Ipanema, Leblon, Botafogo e adjacências.",
              badge: "20–45 min",
              to: "/marocas/delivery",
            },
            {
              icon: <Store className="h-6 w-6" />,
              t: "Retirada rápida",
              d: "Pronto em 15 minutos. Você recebe um aviso quando estiver na bandeja.",
              badge: "Sem taxa",
              to: "/marocas/cardapio",
            },
            {
              icon: <CalendarDays className="h-6 w-6" />,
              t: "Reserva no salão",
              d: "Confirmação em 2 cliques por WhatsApp. Sem taxa de reserva. Comandas por pulseira numerada.",
              badge: "2 cliques",
              to: "/marocas/reservas",
            },
          ].map((m) => (
            <Link
              key={m.t}
              to={m.to}
              className="group relative rounded-3xl border p-6 hover:border-primary hover:shadow-xl transition bg-card overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="grid place-items-center h-12 w-12 rounded-2xl bg-primary/10 text-primary">
                    {m.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-2 py-1">
                    {m.badge}
                  </span>
                </div>
                <div className="font-serif text-2xl font-bold mt-4">{m.t}</div>
                <div className="text-sm text-muted-foreground mt-2">{m.d}</div>
                <div className="flex items-center gap-1 text-sm text-primary font-semibold mt-4 group-hover:gap-2 transition-all">
                  Começar <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ HISTÓRIA / SOBRE — split imagem editorial ============ */}
      <section className="bg-[oklch(0.97_0.01_80)]">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src={MAROCAS_IMAGENS.chef}
              alt="Cozinha da Marocas em ação"
              className="w-full aspect-[4/5] object-cover rounded-3xl shadow-2xl"
              loading="lazy"
            />
            <div className="hidden md:block absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-5 rounded-2xl shadow-xl max-w-[220px]">
              <div className="font-serif text-4xl font-bold leading-none">
                12
              </div>
              <div className="text-xs uppercase tracking-widest opacity-90 mt-1">
                anos servindo Copacabana
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Waves className="h-3.5 w-3.5" /> Cozinha da casa
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mt-4 leading-tight">
              Feito por gente da casa, no bairro mais cosmopolita do Brasil.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
              Copacabana recebe o mundo todos os dias — turistas, moradores,
              trabalhadores da orla. A Marocas nasceu para receber esse mundo à
              mesa, com cozinha honesta e ingredientes que vêm dos produtores da
              nossa região.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Fermentação natural nas pizzas, blend próprio nos hambúrgueres,
              bolinho de bacalhau feito pela mesma família há três gerações.
              Sem terceirização, sem intermediário.
            </p>
            <Link
              to="/marocas/sobre"
              className="inline-flex items-center gap-2 mt-8 font-semibold text-primary hover:gap-3 transition-all"
            >
              Nossa história completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CATEGORIAS — grid editorial ============ */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Cardápio
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">
              Explore o menu
            </h2>
          </div>
          <Link
            to="/marocas/cardapio"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver cardápio completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {marocasCategorias.map((c) => (
            <Link
              key={c.id}
              to="/marocas/cardapio"
              search={{ cat: c.id } as any}
              className="group rounded-2xl border p-5 text-center hover:border-primary hover:bg-primary/5 transition hover-scale bg-card"
            >
              <div className="text-4xl">{c.emoji}</div>
              <div className="font-semibold mt-3 text-sm">{c.nome}</div>
              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 hidden md:block">
                {c.descricao}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ MAIS PEDIDOS — chef's picks ============ */}
      <section className="bg-[oklch(0.14_0.02_240)] text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between gap-3 flex-wrap mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                Chef's picks
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
                <Flame className="h-8 w-8 text-amber-300" /> Os mais pedidos da
                casa
              </h2>
            </div>
            <Link
              to="/marocas/cardapio"
              className="text-sm font-semibold text-amber-300 hover:underline"
            >
              Ver tudo →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destaques.map((item, idx) => (
              <Link
                key={item.slug}
                to="/marocas/cardapio/$slug"
                params={{ slug: item.slug }}
                className="group rounded-3xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 hover:border-primary/50 transition"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                    Top {idx + 1}
                  </span>
                </div>
                <div className="p-5">
                  <div className="font-serif font-bold text-lg">
                    {item.nome}
                  </div>
                  <p className="text-xs text-white/70 line-clamp-2 mt-1.5">
                    {item.descricao}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-amber-300">
                      {formatBRL(item.precoBase)}
                    </span>
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.tempoPreparoMin} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALERIA — visual sensorial ============ */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Instagram · @{MAROCAS_CONTATO.instagram}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
            Um dia na Marocas
          </h2>
          <p className="text-muted-foreground mt-3">
            Do fim de tarde no calçadão à cozinha em ritmo de sexta-feira à
            noite.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {galeria.map((item, idx) => (
            <Link
              key={item.slug}
              to="/marocas/cardapio/$slug"
              params={{ slug: item.slug }}
              className={`relative overflow-hidden rounded-2xl group ${idx === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
            >
              <img
                src={item.imagem}
                alt={item.nome}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-3">
                <span className="text-white text-xs font-semibold">
                  {item.nome}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href={MAROCAS_CONTATO.instagramUrl + MAROCAS_CONTATO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 font-semibold hover:bg-muted transition"
          >
            <Instagram className="h-4 w-4" /> Seguir @
            {MAROCAS_CONTATO.instagram}
          </a>
        </div>
      </section>

      {/* ============ NOVIDADES ============ */}
      {novidades.length > 0 && (
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between gap-3 flex-wrap mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Temporada
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
                  <Sparkles className="h-7 w-7 text-primary" /> Novidades da
                  casa
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {novidades.map((item) => (
                <Link
                  key={item.slug}
                  to="/marocas/cardapio/$slug"
                  params={{ slug: item.slug }}
                  className="group rounded-3xl border overflow-hidden bg-card hover:shadow-xl transition flex gap-4"
                >
                  <div className="w-40 aspect-square shrink-0 overflow-hidden bg-muted">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-[10px] font-bold uppercase text-primary tracking-widest">
                      Novo
                    </div>
                    <div className="font-serif font-bold text-lg mt-1">
                      {item.nome}
                    </div>
                    <div className="mt-2 font-bold">
                      {formatBRL(item.precoBase)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ EVENTOS — CTA editorial ============ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.eventos}
            alt="Salão da Marocas preparado para evento privado"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Eventos privados em Copacabana
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mt-4">
            De aniversários íntimos a mini weddings à beira-mar.
          </h2>
          <p className="mt-4 text-white/85 text-lg">
            Reserve o salão inteiro, uma área privativa ou leve o chef até você.
            Menu personalizado, sem taxa de rolha, com toda a energia do bairro
            mais famoso do Brasil.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/marocas/eventos"
              className="rounded-full bg-primary text-primary-foreground px-8 py-4 font-semibold hover:opacity-90 transition inline-flex items-center gap-2 shadow-2xl shadow-primary/30"
            >
              Planejar meu evento <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={marocasWhatsAppUrl(
                "Olá, Marocas! Gostaria de conversar sobre um evento privado.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 backdrop-blur-md border border-white/30 px-8 py-4 font-semibold hover:bg-white/20 transition"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ============ IMPRENSA — logo strip genérico ============ */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-5">
            Vistos e comentados em
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {MAROCAS_IMPRENSA.map((v) => (
              <span
                key={v}
                className="font-serif italic text-lg md:text-xl text-foreground/60"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONFIANÇA ============ */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              i: <ShieldCheck className="h-5 w-5" />,
              t: "Pagamento seguro",
              d: "PIX, cartão e pagar na retirada. Sem armazenar dados de cartão.",
            },
            {
              i: <Truck className="h-5 w-5" />,
              t: "Entrega própria",
              d: "Motos da casa, rastreio em tempo real, sem intermediário.",
            },
            {
              i: <Leaf className="h-5 w-5" />,
              t: "Ingredientes frescos",
              d: "Feiras da Zona Sul e produtores da região.",
            },
            {
              i: <Star className="h-5 w-5" />,
              t: "Gente da casa",
              d: "Cozinha e salão próprios. Sem terceirização.",
            },
          ].map((b) => (
            <div
              key={b.t}
              className="rounded-2xl border p-5 hover:border-primary transition"
            >
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                {b.i}
              </div>
              <div className="font-semibold mt-3">{b.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ENDEREÇO / HORÁRIO ============ */}
      <section className="container mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-3xl border p-8 md:p-10 grid md:grid-cols-3 gap-8 bg-card">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Endereço
              </span>
            </div>
            <p className="mt-3 font-serif text-2xl font-bold leading-tight">
              {MAROCAS_CONTATO.enderecoLinha1}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {MAROCAS_CONTATO.enderecoLinha2}
            </p>
            <a
              href={MAROCAS_CONTATO.mapaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:underline mt-3 inline-block"
            >
              Ver no mapa →
            </a>
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Horário
              </span>
            </div>
            <ul className="mt-3 text-sm space-y-1.5">
              {MAROCAS_HORARIOS.map((h) => (
                <li
                  key={h.dia}
                  className={`flex justify-between ${h.fechado ? "text-muted-foreground" : ""}`}
                >
                  <span>{h.dia}</span>
                  <span className="font-medium">{h.horario}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Fale agora
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Reservas, eventos e SAC direto pelo WhatsApp da casa.
            </p>
            <a
              href={marocasWhatsAppUrl(
                "Olá! Vim do site da Marocas e gostaria de falar com vocês.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              WhatsApp {MAROCAS_CONTATO.whatsappHumanizado}
            </a>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-[2fr_1fr] gap-8 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-80">
              Copacabana à mesa
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
              Cardápio aberto agora. Pedido em 2 minutos.
            </h2>
            <p className="mt-3 opacity-90 max-w-xl">
              PIX ou cartão, delivery próprio ou retirada. Reservas sem taxa
              para o mesmo dia.
            </p>
          </div>
          <div className="flex flex-wrap md:justify-end gap-3">
            <Link
              to="/marocas/cardapio"
              className="rounded-full bg-background text-foreground px-6 py-3 font-semibold inline-flex items-center gap-2 hover:opacity-90 transition"
            >
              Ver cardápio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/marocas/reservas"
              className="rounded-full border-2 border-primary-foreground/30 px-6 py-3 font-semibold hover:bg-primary-foreground/10 transition"
            >
              Reservar mesa
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
