import { createFileRoute, Link } from "@tanstack/react-router";
import { Waves, ArrowRight, Heart, Leaf, Users, Award } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_BRAND,
  MAROCAS_HISTORIA,
  MAROCAS_IMAGENS,
} from "@/components/marocas/marocasContent";

const CANONICAL = "https://impulsionando.com.br/marocas/sobre";

export const Route = createFileRoute("/marocas/sobre")({
  head: () => ({
    meta: [
      { title: "Nossa história — Marocas Copacabana" },
      {
        name: "description",
        content:
          "Desde 2012 a Marocas é cozinha da casa em Copacabana. Um balcão de bolinhos que virou restaurante, delivery próprio e referência de food service.",
      },
      { property: "og:title", content: "Nossa história — Marocas" },
      {
        property: "og:description",
        content:
          "Como uma casa de bolinhos na Barata Ribeiro virou uma das cozinhas mais queridas de Copacabana.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.chef },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Nossa história" },
      ]}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.calcadao}
            alt="Calçadão de Copacabana"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 inline-flex items-center gap-2">
            <Waves className="h-3.5 w-3.5" /> Copacabana · Desde {MAROCAS_BRAND.fundacao}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-[1.05]">
            Uma cozinha que nasceu na Barata Ribeiro.
          </h1>
          <p className="mt-6 text-lg text-white/85">
            {MAROCAS_BRAND.descricaoCurta}
          </p>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <p className="font-serif text-2xl md:text-3xl leading-relaxed text-foreground/90 text-center">
          &ldquo;A gente sempre quis fazer o Rio que a gente ama caber num
          prato. <span className="text-primary italic">O bolinho da vó, a
          fermentação natural da pizza, o chopp no ponto certo.</span> Servir
          Copacabana é servir o mundo — e a gente leva isso a sério há mais de
          uma década.&rdquo;
        </p>
        <p className="text-center text-sm text-muted-foreground mt-6 uppercase tracking-widest">
          — Time Marocas
        </p>
      </section>

      {/* TIMELINE */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Linha do tempo
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
              12 anos servindo Copacabana
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />
            <ol className="space-y-10">
              {MAROCAS_HISTORIA.map((h, i) => (
                <li
                  key={h.ano}
                  className={`relative grid md:grid-cols-2 gap-6 items-center ${i % 2 === 0 ? "" : "md:[direction:rtl]"}`}
                >
                  <div className={`pl-12 md:pl-0 ${i % 2 === 0 ? "md:pr-10 md:text-right" : "md:pl-10 md:[direction:ltr]"}`}>
                    <div className="text-4xl md:text-5xl font-serif font-bold text-primary">
                      {h.ano}
                    </div>
                    <h3 className="font-serif text-xl font-bold mt-2">
                      {h.titulo}
                    </h3>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {h.texto}
                    </p>
                  </div>
                  <div className={`hidden md:block ${i % 2 === 0 ? "md:pl-10" : "md:pr-10 md:[direction:ltr]"}`}>
                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 border" />
                  </div>
                  <span className="absolute left-4 md:left-1/2 top-4 w-4 h-4 rounded-full bg-primary ring-4 ring-background md:-translate-x-1/2" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            O que nos guia
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
            Cozinha honesta, gente da casa
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              i: <Heart className="h-5 w-5" />,
              t: "Do bairro",
              d: "Fornecedores da Zona Sul, feirantes da região, ingrediente que a gente conhece.",
            },
            {
              i: <Leaf className="h-5 w-5" />,
              t: "Sem terceirizar",
              d: "Cozinha própria, entrega própria. O que sai é feito por gente da casa.",
            },
            {
              i: <Users className="h-5 w-5" />,
              t: "Equipe fixa",
              d: "Rotatividade abaixo da média do setor. Muita gente com a gente há 5+ anos.",
            },
            {
              i: <Award className="h-5 w-5" />,
              t: "Sem intermediário",
              d: "Delivery próprio, sem apps de terceiro. Você paga menos, a gente ganha mais.",
            },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border p-5 bg-card">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                {v.i}
              </div>
              <div className="font-serif font-bold mt-3">{v.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{v.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-[2fr_1fr] gap-6 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Conhece a gente melhor à mesa.
            </h2>
            <p className="mt-3 opacity-90">
              Reserve uma mesa, peça delivery ou dê um oi pelo WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to="/marocas/reservas"
              className="rounded-full bg-background text-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Reservar mesa
            </Link>
            <Link
              to="/marocas/cardapio"
              className="rounded-full border-2 border-primary-foreground/30 px-6 py-3 font-semibold hover:bg-primary-foreground/10 transition inline-flex items-center gap-2"
            >
              Ver cardápio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
