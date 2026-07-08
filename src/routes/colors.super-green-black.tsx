import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Flame, MessageCircle, ShieldCheck, Star, Timer, TrendingDown, Zap } from "lucide-react";
import { productBySlug } from "@/data/colors-products";
import { colorsEvents, ensureGaInstalled } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";

/**
 * /colors/super-green-black — LANDING DE VENDA AGRESSIVA (FRONT-END).
 * Funil: hero → prova social → benefícios → como funciona → oferta → FAQ → CTA final.
 * Objetivo único: vender. Links mantêm plataformas oficiais.
 */
export const Route = createFileRoute("/colors/super-green-black")({
  head: () => ({
    meta: [
      { title: "Super Green Black — Emagreça em 3 dias | Colors Saúde" },
      { name: "description", content: "Super Green Black: queima de gordura acelerada, redução de apetite e mais energia. Resultados nos primeiros 3 dias. Compre pelos canais oficiais Colors Saúde." },
      { name: "keywords", content: "super green black, emagrecedor, colors saúde, queima de gordura, emagrecer" },
      { property: "og:title", content: "Super Green Black — O campeão do emagrecimento" },
      { property: "og:description", content: "Resultados nos primeiros 3 dias. Fórmula premium Colors Saúde." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://colors.impulsionando.com.br/colors/super-green-black" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Super Green Black — Emagreça em 3 dias" },
      { name: "twitter:description", content: "Queima de gordura acelerada com fórmula premium." },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/colors/super-green-black" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Super Green Black",
        brand: { "@type": "Brand", name: "Green" },
        description: "Emagrecedor premium com ativos naturais. Resultados nos primeiros 3 dias.",
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "25000" },
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
      <ProblemSection />
      <BenefitsSection />
      <HowItWorksSection />
      <OfferSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCTA />
      <FloatingWhats />
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
            <Star className="h-3.5 w-3.5 fill-emerald-300" aria-hidden /> Mais vendido · 25.000+ transformações
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] sm:text-7xl">
            Emagreça <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">nos primeiros 3 dias</span> com o Super Green Black.
          </h1>
          <p className="mt-6 text-lg text-white/80 sm:text-xl">
            A fórmula premium que virou fenômeno nacional. Queima de gordura acelerada, controle total do apetite e energia de sobra pra viver de novo.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Queima gordura desde o 1º dia",
              "Reduz apetite e compulsão por doce",
              "Mais energia pra treinar, trabalhar e viver",
              "Ativos naturais · sem receita médica",
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
              🔥 QUERO EMAGRECER AGORA
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
            {/* Selos flutuantes */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">Top #1</span>
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">-40% hoje</span>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
              <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">🇧🇷 Fórmula BR</span>
              <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur">Frete grátis</span>
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
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Estoque limitado</div>
                <div className="mt-1 text-xs font-semibold text-white/90">Últimas 128 unidades desta remessa</div>
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
          { n: "25.000+", l: "Clientes transformados" },
          { n: "4.9/5", l: "Avaliação média" },
          { n: "3 dias", l: "Primeiros resultados" },
          { n: "100%", l: "Ativos naturais" },
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Cansada de tentar?</p>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Você já tentou de tudo — e a balança não desce.</h2>
        <p className="mt-6 text-lg text-white/70">
          Dietas restritivas, treinos exaustivos, promessas mirabolantes. Nada funciona porque nada ataca o problema real: <strong className="text-white">metabolismo lento e compulsão alimentar</strong>.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: TrendingDown, t: "Metabolismo travado", d: "Você come pouco e mesmo assim não emagrece." },
            { icon: Zap, t: "Falta de energia", d: "Cansaço o dia inteiro, sem disposição pra nada." },
            { icon: Timer, t: "Resultado que não vem", d: "Semanas e semanas sem ver diferença no espelho." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
              <Icon className="h-8 w-8 text-red-400" aria-hidden />
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">A solução</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Super Green Black ataca a raiz do problema.</h2>
          <p className="mt-4 text-lg text-white/70">Ativos premium selecionados para acelerar o metabolismo, controlar o apetite e liberar sua energia.</p>
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
    { n: "01", t: "Compre pelo canal oficial", d: "Escolha Maisfy, Monetizze ou Perfect Pay. Compra 100% segura." },
    { n: "02", t: "Receba em casa", d: "Colors Log entrega rápido, com rastreamento e embalagem discreta." },
    { n: "03", t: "Tome diariamente", d: "Siga a posologia. Resultados visíveis nos primeiros 3 dias." },
    { n: "04", t: "Emagreça de vez", d: "Corpo dos sonhos com fórmula que respeita o seu organismo." },
  ];
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Como funciona</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">4 passos pra sua transformação.</h2>
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
    ["Ativos naturais premium", true, false],
    ["Resultados em até 3 dias", true, false],
    ["Sem receita médica", true, true],
    ["Suporte via WhatsApp", true, false],
    ["Frete grátis", true, false],
    ["Fórmula testada por 25.000+ pessoas", true, false],
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
                <th className="px-4 py-4 text-center font-semibold">Outros</th>
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
  const items = [
    { name: "Camila R., 34", city: "São Paulo/SP", text: "Perdi 8kg em 60 dias. Voltei a usar as roupas que amava. Melhor decisão que já tomei." },
    { name: "Juliana M., 29", city: "Recife/PE", text: "Nos primeiros 3 dias já senti diferença. Depois de 1 mês, resultado impressionante." },
    { name: "Fernanda S., 42", city: "Belo Horizonte/MG", text: "Cortou minha compulsão por doce. Isso mudou tudo pra mim." },
  ];
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Quem já provou aprova</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">25.000+ transformações reais.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((d) => (
            <figure key={d.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex gap-1 text-yellow-400" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-yellow-400" />))}
              </div>
              <blockquote className="mt-4 text-white/85">"{d.text}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 font-bold text-black" aria-hidden>{d.name.charAt(0)}</div>
                <div>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-xs text-white/50">{d.city}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const qas = [
    { q: "Quando começo a ver resultado?", a: "Nos primeiros 3 dias você já sente diferença. Resultado consistente aparece em 30 dias de uso contínuo." },
    { q: "Precisa de receita médica?", a: "Não. Super Green Black é um suplemento com ativos naturais e não exige prescrição." },
    { q: "Tem contraindicação?", a: "Gestantes, lactantes, menores de 18 e pessoas em uso contínuo de medicamentos devem consultar um profissional antes." },
    { q: "Como é a entrega?", a: "Feita pela Colors Log. Despacho em até 3 dias úteis; entrega entre 3 e 10 dias úteis conforme CEP." },
    { q: "Comprar em marketplaces é seguro?", a: "Não. Colors Saúde não vende em Mercado Livre ou similares. Compre apenas pelos canais oficiais listados nesta página." },
    { q: "Posso pagar em quantas vezes?", a: "As plataformas oficiais aceitam cartão parcelado, Pix, boleto e outras formas." },
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
