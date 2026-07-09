import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Flame, MessageCircle, ShieldCheck, Star, Timer, TrendingDown, Zap } from "lucide-react";
import { productBySlug } from "@/data/colors-products";
import { colorsEvents, ensureGaInstalled } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";
import AntiFakePopup from "@/components/colors/AntiFakePopup";
import ComprarOriginalFab from "@/components/colors/ComprarOriginalFab";

const LazyVideo = lazy(() => import("@/components/colors/VideoShowcase"));
const LazyJornada = lazy(() => import("@/components/colors/JornadaTransformacao"));
const LazyCheckoutPreview = lazy(() => import("@/components/colors/CheckoutTransparentePreview"));

function SgbSectionSkeleton() {
  return <div className="mx-auto my-12 h-40 max-w-4xl animate-pulse rounded-3xl bg-white/5" />;
}

/**
 * /colors/super-green-black — LANDING DE VENDA AGRESSIVA (FRONT-END).
 * Funil: hero → prova social → benefícios → como funciona → oferta → FAQ → CTA final.
 * Objetivo único: vender. Links mantêm plataformas oficiais.
 */
export const Route = createFileRoute("/colors/super-green-black")({
  head: () => ({
    meta: [
      { title: "Super Green Black — Suplemento premium | Colors Saúde" },
      { name: "description", content: "Super Green Black: suplemento alimentar premium da linha Green. Fórmula com ativos naturais para apoiar rotina de bem-estar. Compre pelos canais oficiais Colors Saúde." },
      { name: "keywords", content: "super green black, suplemento colors saúde, linha green, bem-estar" },
      { property: "og:title", content: "Super Green Black — Colors Saúde" },
      { property: "og:description", content: "Suplemento alimentar premium da linha Green. Comprado apenas pelos canais oficiais Colors Saúde." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://colors.impulsionando.com.br/colors/super-green-black" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Super Green Black — Colors Saúde" },
      { name: "twitter:description", content: "Suplemento alimentar premium da linha Green." },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/colors/super-green-black" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Super Green Black",
        brand: { "@type": "Brand", name: "Green" },
        description: "Suplemento alimentar premium da linha Green — Colors Saúde.",
      }),
    }],
  }),
  component: SgbLanding,
});

const PRODUCT = productBySlug("super-green-black")!;

function SgbLanding() {
  useEffect(() => { ensureGaInstalled(); }, []);
  useColorsUtmHydration("super_green_black", { content: "sgb_landing" });

  return (
    <div className="min-h-screen bg-[#050a08] text-white antialiased">
      <UrgencyBar />
      <StickyCTA />
      <SgbHero />
      <SocialProofBar />
      <Suspense fallback={<SgbSectionSkeleton />}>
        <LazyVideo
          eyebrow="Assista antes de decidir"
          title="Veja o Super Green Black em ação."
          description="Apresentação oficial da fórmula, ingredientes premium e depoimentos reais. Vídeo em breve — enquanto isso, confira os benefícios e a oferta abaixo."
        />
      </Suspense>
      <ProblemSection />
      <BenefitsSection />
      <Suspense fallback={<SgbSectionSkeleton />}><LazyJornada /></Suspense>
      <HowItWorksSection />
      <OfferSection />
      <ComparisonSection />
      <TestimonialsSection />
      <Suspense fallback={<SgbSectionSkeleton />}><LazyCheckoutPreview /></Suspense>
      <FaqSection />
      <FinalCTA />
      <ComprarOriginalFab source="pdp_sgb" />
      <AntiFakePopup />
    </div>
  );
}

/* ---------- Sticky elements ---------- */

function UrgencyBar() {
  const [left, setLeft] = useState(() => 3600 * 3 + 47 * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-center text-sm font-bold text-white shadow-lg">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 px-4 py-2">
        <Flame className="h-4 w-4 animate-pulse" aria-hidden />
        <span>OFERTA RELÂMPAGO · Frete grátis termina em</span>
        <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono tabular-nums">{h}:{m}:{s}</span>
      </div>
    </div>
  );
}

function StickyCTA() {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 rounded-full border border-emerald-400/40 bg-black/80 px-2 py-2 shadow-2xl backdrop-blur md:flex md:items-center md:gap-3">
      <span className="pl-3 text-sm font-semibold text-white">Comece hoje sua transformação →</span>
      <a
        href={PRODUCT.links[0].href}
        target="_blank"
        rel="noreferrer"
        onClick={() => colorsEvents.checkoutClick(PRODUCT.name, PRODUCT.links[0].label, PRODUCT.links[0].href)}
        className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
      >
        QUERO COMPRAR AGORA
      </a>
    </div>
  );
}

/* ---------- Sections ---------- */

function SgbHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(16,185,129,0.5),transparent_50%),radial-gradient(900px_circle_at_100%_100%,rgba(34,197,94,0.35),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,8,1))]" />
      </div>
      <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <Star className="h-3.5 w-3.5 fill-emerald-300" aria-hidden /> Mais vendido da linha Green
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] sm:text-7xl">
            Super Green Black.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              O suplemento premium
            </span>{" "}
            da linha Green.
          </h1>
          <p className="mt-6 text-lg text-white/80 sm:text-xl">
            Fórmula da Colors Saúde para apoiar sua rotina de bem-estar, com
            ativos naturais selecionados. Um dos produtos mais procurados da
            nossa comunidade.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Fórmula com ativos naturais selecionados",
              "Cápsulas de fácil ingestão",
              "Suplemento alimentar — sem exigência de receita",
              "Compra apenas por canais oficiais Colors Saúde",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={PRODUCT.links[0].href}
              target="_blank"
              rel="noreferrer"
              onClick={() => colorsEvents.checkoutClick(PRODUCT.name, "hero_" + PRODUCT.links[0].label, PRODUCT.links[0].href)}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-8 py-4 text-lg font-black text-black shadow-2xl shadow-emerald-500/50 transition hover:scale-[1.02]"
            >
              Comprar no canal oficial
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
            <a href="#oferta" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-4 font-semibold hover:bg-white/10">
              Ver oferta completa
            </a>
          </div>

          <p className="mt-4 text-xs text-white/50">✓ Compra 100% segura · ✓ Entrega Colors Log · ✓ Suporte SAC humano</p>
        </div>

        <div className="relative">
          {/* Aura / glow */}
          <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-emerald-500/50 via-lime-400/25 to-transparent blur-3xl" aria-hidden />
          {/* Cartão do produto — pote renderizado em CSS */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-950 via-black to-emerald-950/60 p-6 shadow-[0_40px_120px_-20px_rgba(16,185,129,0.55)] sm:p-8">
            {/* Selos flutuantes — apenas atributos verificáveis (sem % de desconto sem base real) */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">Original Colors</span>
              <span className="rounded-full border border-emerald-400/40 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200 shadow-lg backdrop-blur">Linha Green</span>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
              <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">🇧🇷 Fórmula BR</span>
              <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur">Colors Log</span>
            </div>

            {/* Pote em CSS puro (sem asset externo, imutável no build) */}
            <div className="relative mx-auto flex aspect-square max-w-[380px] items-end justify-center pt-6">
              {/* Sombra no chão */}
              <div className="absolute bottom-2 left-1/2 h-6 w-56 -translate-x-1/2 rounded-full bg-black/70 blur-xl" aria-hidden />
              {/* Corpo do pote */}
              <div className="relative flex h-[78%] w-[64%] flex-col overflow-hidden rounded-b-[36px] rounded-t-[28px] bg-gradient-to-br from-neutral-800 via-black to-neutral-900 shadow-[inset_0_0_60px_rgba(16,185,129,0.35),0_30px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                {/* Reflexo lateral */}
                <div className="pointer-events-none absolute inset-y-6 left-3 w-3 rounded-full bg-white/10 blur-[2px]" aria-hidden />
                {/* Rótulo */}
                <div className="mx-4 mt-16 flex-1 rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-500/25 via-black/60 to-black/80 p-4 text-center backdrop-blur">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Colors Saúde</div>
                  <div className="mt-2 bg-gradient-to-b from-emerald-300 to-lime-300 bg-clip-text text-3xl font-black leading-none text-transparent drop-shadow sm:text-4xl">
                    SUPER<br />GREEN<br />BLACK
                  </div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/70">
                    Fórmula termogênica premium
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1 text-[9px] font-bold text-emerald-200">
                    <span className="rounded-full bg-emerald-500/25 px-2 py-0.5">60 cápsulas</span>
                    <span className="rounded-full bg-emerald-500/25 px-2 py-0.5">30 dias</span>
                  </div>
                </div>
                {/* Base metálica */}
                <div className="h-4 bg-gradient-to-b from-neutral-700 via-neutral-900 to-black" />
              </div>
              {/* Tampa */}
              <div className="absolute left-1/2 top-2 h-6 w-[68%] -translate-x-1/2 rounded-t-[24px] rounded-b-[6px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_6px_16px_rgba(16,185,129,0.6)] ring-1 ring-emerald-900" aria-hidden />
              {/* Ingredientes flutuantes */}
              <span className="absolute left-2 top-1/3 hidden rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur sm:inline">🌿 Chá verde</span>
              <span className="absolute right-2 top-1/2 hidden rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-bold text-orange-200 backdrop-blur sm:inline">🌶️ Pimenta</span>
              <span className="absolute right-4 top-[75%] hidden rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-bold text-yellow-200 backdrop-blur sm:inline">⚡ Cafeína</span>
            </div>

            {/* Rodapé do card — avaliação + urgência */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-1 text-yellow-400" aria-label="5 estrelas">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-yellow-400" />))}
                </div>
                <div className="mt-1 text-xs font-semibold text-white/80">4.9 · 25.000+ avaliações</div>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Canal oficial</div>
                <div className="mt-1 text-xs font-semibold text-white/90">Compre apenas pelas plataformas parceiras listadas abaixo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <div className="border-y border-white/10 bg-white/[0.02]">
      <div className="container mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4">
        {[
          { n: "Milhares", l: "Clientes atendidos" },
          { n: "4,9/5", l: "Avaliação nos canais oficiais" },
          { n: "Green", l: "Linha premium Colors" },
          { n: "100%", l: "Ativos naturais selecionados" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{s.n}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Por que Super Green Black?</p>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Rotina saudável precisa de aliados de qualidade.</h2>
        <p className="mt-6 text-lg text-white/70">
          Uma boa rotina de bem-estar combina alimentação, hidratação, sono e movimento.
          O Super Green Black entra nesse conjunto como um <strong className="text-white">suplemento alimentar premium</strong>,
          formulado para acompanhar quem quer manter constância no dia a dia.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: TrendingDown, t: "Constância", d: "Formato em cápsulas facilita manter a rotina de uso ao longo dos dias." },
            { icon: Zap, t: "Ativos naturais", d: "Combinação de ativos naturais selecionados pela linha Green da Colors Saúde." },
            { icon: Timer, t: "Origem confiável", d: "Produto original, comprado apenas por canais oficiais Colors Saúde." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
              <Icon className="h-8 w-8 text-emerald-400" aria-hidden />
              <p className="mt-4 font-bold">{t}</p>
              <p className="mt-2 text-sm text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="border-y border-white/10 bg-gradient-to-b from-emerald-950/30 to-transparent py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Características</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">O que você encontra no Super Green Black.</h2>
          <p className="mt-4 text-lg text-white/70">
            Fórmula da linha Green pensada para quem busca um suplemento premium
            e original, com origem rastreável e distribuição pelos canais
            oficiais da Colors Saúde.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT.benefits.map((b) => (
            <div key={b} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-transparent p-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden />
              <p className="mt-4 text-lg font-bold">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "01", t: "Compre pelo canal oficial", d: "Escolha uma das plataformas oficiais parceiras. Compra em ambiente seguro (PCI-DSS)." },
    { n: "02", t: "Receba em casa", d: "Colors Log despacha em até 3 dias úteis, com rastreamento e embalagem discreta." },
    { n: "03", t: "Siga a posologia", d: "Use conforme orientações no rótulo. Combine com uma rotina saudável de alimentação e sono." },
    { n: "04", t: "Fale com o SAC", d: "Nosso suporte humano no WhatsApp acompanha dúvidas de pedido e pós-venda." },
  ];
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Como funciona</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">4 passos até o seu pedido.</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-4xl font-black text-emerald-400">{s.n}</div>
              <p className="mt-3 text-lg font-bold">{s.t}</p>
              <p className="mt-2 text-sm text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferSection() {
  return (
    <section id="oferta" className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_50%,rgba(16,185,129,0.25),transparent_60%)]" />
      <div className="container relative mx-auto max-w-4xl px-4">
        <div className="rounded-[2rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-950/80 via-black to-emerald-950/60 p-8 text-center sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
            <Flame className="h-3.5 w-3.5 animate-pulse" /> Oferta por tempo limitado
          </span>
          <h2 className="mt-6 text-4xl font-black sm:text-6xl">
            Comece <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">hoje</span> sua transformação.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Compra 100% segura pelos canais oficiais. Frete grátis para todo o Brasil.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {PRODUCT.links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => colorsEvents.checkoutClick(PRODUCT.name, "oferta_" + l.label, l.href)}
                className={
                  "group flex flex-col items-center gap-2 rounded-2xl px-6 py-6 font-black transition hover:scale-[1.03] " +
                  (i === 0
                    ? "bg-gradient-to-br from-emerald-400 to-lime-400 text-black shadow-2xl shadow-emerald-500/50"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10")
                }
              >
                {i === 0 && <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">Recomendado</span>}
                <span className="text-lg">Comprar em</span>
                <span className="text-2xl">{l.label}</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>

          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 text-left text-sm text-white/70 sm:grid-cols-2">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Produto 100% original</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Compra segura</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Entrega Colors Log</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> SAC humano no WhatsApp</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ["Ativos naturais selecionados", true, false],
    ["Fórmula premium da linha Green", true, false],
    ["Suplemento alimentar (sem exigência de receita)", true, true],
    ["Suporte SAC no WhatsApp", true, false],
    ["Entrega Colors Log com rastreio", true, false],
    ["Compra apenas por canais oficiais", true, false],
  ] as const;
  return (
    <section className="border-y border-white/10 py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Por que Super Green Black?</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Compare e decida.</h2>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-white/70">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">Característica</th>
                <th className="px-4 py-4 text-center font-black text-emerald-300">Super Green Black</th>
                <th className="px-4 py-4 text-center font-semibold">Outros suplementos genéricos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label as string} className="border-t border-white/5">
                  <td className="px-4 py-3">{label}</td>
                  <td className="px-4 py-3 text-center">{a ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" /> : "—"}</td>
                  <td className="px-4 py-3 text-center text-white/60">{b ? <CheckCircle2 className="mx-auto h-5 w-5" /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  // Sem inventar depoimentos reais. Apresentamos temas recorrentes que a
  // comunidade Colors nos traz, atribuídos genericamente à "linha Green".
  const items = [
    {
      theme: "Bem-estar na rotina",
      text: "Um dos comentários mais recorrentes é a sensação de bem-estar ao integrar o Super Green Black a uma rotina saudável de alimentação e hidratação.",
    },
    {
      theme: "Consistência de uso",
      text: "Clientes contam que o formato em cápsulas facilita manter a constância — algo essencial em qualquer estratégia de bem-estar.",
    },
    {
      theme: "Confiança na origem",
      text: "A garantia de produto original, comprado direto pelos canais oficiais Colors, aparece com frequência entre os motivos de recompra.",
    },
  ];
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Como a comunidade fala do Super Green Black</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Temas que ouvimos com mais frequência.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Não publicamos depoimentos individuais sem consentimento. As avaliações
            reais ficam nas plataformas oficiais de venda listadas na oferta.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((d) => (
            <figure key={d.theme} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex gap-1 text-yellow-400" aria-label="Avaliação positiva">
                {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-yellow-400" />))}
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-300">
                {d.theme}
              </p>
              <blockquote className="mt-2 text-white/85">{d.text}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const qas = [
    { q: "Quando começo a perceber diferença?", a: "Cada organismo responde no seu tempo. O uso contínuo, combinado a uma rotina saudável de alimentação, hidratação e sono, tende a favorecer melhores resultados. Não prometemos prazos fixos." },
    { q: "Precisa de receita médica?", a: "Não. Super Green Black é um suplemento alimentar com ativos naturais e não exige prescrição. Em caso de dúvida, converse com um profissional de saúde." },
    { q: "Tem contraindicação?", a: "Gestantes, lactantes, menores de 18 anos e pessoas em uso contínuo de medicamentos devem consultar um profissional de saúde antes de iniciar o uso." },
    { q: "Como é a entrega?", a: "Feita pela Colors Log. Despacho em até 3 dias úteis; entrega entre 3 e 10 dias úteis conforme CEP." },
    { q: "Comprar em marketplaces é seguro?", a: "Não. Colors Saúde não vende em Mercado Livre ou similares. Compre apenas pelos canais oficiais listados nesta página." },
    { q: "Posso pagar em quantas vezes?", a: "As plataformas oficiais aceitam cartão parcelado, Pix, boleto e outras formas. Consulte as condições no checkout de cada canal." },
  ];
  return (
    <section className="border-t border-white/10 py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">FAQ</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Tudo o que você precisa saber.</h2>
        </div>
        <div className="mt-10 space-y-3">
          {qas.map((qa) => (
            <details key={qa.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.06]">
              <summary className="cursor-pointer list-none font-semibold text-white marker:hidden">
                <span className="mr-3 text-emerald-400">›</span>{qa.q}
              </summary>
              <p className="mt-3 text-sm text-white/70">{qa.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-lime-500" />
      <div className="container relative mx-auto max-w-4xl px-4 text-center text-black">
        <h2 className="text-5xl font-black leading-tight sm:text-6xl">A sua nova versão começa hoje.</h2>
        <p className="mt-6 text-xl font-medium">Não espere mais uma semana passar. Escolha a plataforma oficial e comece agora.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {PRODUCT.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => colorsEvents.checkoutClick(PRODUCT.name, "final_" + l.label, l.href)}
              className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-black text-white shadow-2xl transition hover:scale-[1.03] hover:bg-black/90"
            >
              Comprar em {l.label} <ArrowRight className="h-5 w-5" />
            </a>
          ))}
        </div>
        <p className="mt-6 text-sm text-black/70">
          ← <Link to="/colors" className="underline">Voltar ao Colors Saúde</Link>
        </p>
      </div>
    </section>
  );
}

function FloatingWhats() {
  return (
    <a
      href="https://wa.me/5521967862834"
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={() => colorsEvents.whatsappClick("sgb_fab")}
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  );
}
