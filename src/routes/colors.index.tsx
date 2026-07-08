import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Sparkles, Heart, MessageCircle, CheckCircle2, Phone } from "lucide-react";
import { COLORS_PRODUCTS, COLORS_BRANDS, type ColorsBrand } from "@/data/colors-products";
import { colorsEvents, ensureGaInstalled } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";

/**
 * colors.impulsionando.com.br — Landing FRONT-END.
 * Referência: https://grupocolors.com.br/colors-saude/ e colorssaude.com.br
 */

const LazyContato = lazy(() => import("@/components/colors/ContatoSection"));
const LazyEbooks = lazy(() => import("@/components/colors/EbooksSection"));
const LazyDepoimentos = lazy(() => import("@/components/colors/DepoimentosSection"));

export const Route = createFileRoute("/colors/")({
  head: () => ({
    meta: [
      { title: "Colors Saúde — Diversidade transformando vidas com qualidade premium" },
      { name: "description", content: "Colors Saúde: emagrecimento, libido, sono, virilidade masculina e saúde infantil. Submarcas Green, Blue e Yellow com canais oficiais de compra." },
      { name: "keywords", content: "colors saúde, super green black, mesa no pau, bam bam bam, emagrecimento, suplemento, sono, saúde infantil" },
      { property: "og:title", content: "Colors Saúde — Qualidade Premium em Saúde e Bem-Estar" },
      { property: "og:description", content: "Green (mulheres), Blue (homens) e Yellow (infantil). Produtos oficiais, entrega Colors Log e atendimento humano." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://colors.impulsionando.com.br/" },
      { property: "og:site_name", content: "Colors Saúde" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Colors Saúde — Qualidade Premium" },
      { name: "twitter:description", content: "Green, Blue, Yellow. Produtos oficiais Colors Saúde." },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Colors Saúde",
        url: "https://colors.impulsionando.com.br/",
        description: "Diversidade transformando vidas com qualidade premium.",
        sameAs: [
          "https://www.instagram.com/colorssaude/",
          "https://www.youtube.com/@colorssaude",
          "https://www.tiktok.com/@colorssaude",
        ],
      }),
    }],
  }),
  component: ColorsSaudePage,
});

const BRAND_FILTERS = ["Todos", "Green", "Blue", "Yellow", "Colors"] as const;
type BrandFilter = (typeof BRAND_FILTERS)[number];

function ColorsSaudePage() {
  const [filter, setFilter] = useState<BrandFilter>("Todos");
  useColorsUtmHydration("colors_home");


  useEffect(() => {
    ensureGaInstalled();
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--brand-primary");
    root.style.setProperty("--brand-primary", "142 71% 45%");
    return () => {
      if (prev) root.style.setProperty("--brand-primary", prev);
      else root.style.removeProperty("--brand-primary");
    };
  }, []);

  const visible = COLORS_PRODUCTS.filter((p) =>
    filter === "Todos" ? true : p.brandLabel === filter,
  );

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white antialiased">
      <TopBar />
      <Hero />
      <TrustStrip />
      <QuemSomos />
      <SubmarcasGrid />

      <section id="produtos" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="container relative mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Nossos Produtos</p>
            <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Linha completa. Qualidade premium.</h2>
            <p className="mt-4 text-lg text-white/70">
              Produtos oficiais das submarcas Green, Blue, Yellow e Colors. Compre apenas pelos canais autorizados.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filtrar por marca">
            {BRAND_FILTERS.map((b) => (
              <button
                key={b}
                role="tab"
                aria-selected={filter === b}
                onClick={() => setFilter(b)}
                className={
                  "rounded-full border px-5 py-2 text-sm font-medium transition " +
                  (filter === b
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : "border-white/15 text-white/70 hover:border-white/30 hover:text-white")
                }
              >
                {b}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <article key={p.slug} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.accent}`} />
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${p.accent} px-3 py-1 text-xs font-bold text-black`}>
                    {p.brandLabel}
                  </span>
                  <span className="text-2xl" aria-hidden>{p.emoji}</span>
                </div>
                <h3 className="mt-4 text-2xl font-bold leading-tight">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold text-emerald-300">{p.tagline}</p>
                <p className="mt-3 text-sm text-white/70">{p.short}</p>
                <div className="mt-auto pt-5">
                  <Link
                    to="/colors/produto/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => colorsEvents.ctaClick("ver_detalhes", p.slug)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Ver detalhes e comprar <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Canais oficiais</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => colorsEvents.checkoutClick(p.name, l.label, l.href)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton />}><LazyDepoimentos /></Suspense>
      <Logistica />
      <Suspense fallback={<SectionSkeleton />}><LazyEbooks /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><LazyContato /></Suspense>
      <SiteFooter />
      <FloatingWhats />
    </div>
  );
}

function SectionSkeleton() {
  return <div className="mx-auto my-12 h-40 max-w-4xl animate-pulse rounded-3xl bg-white/5" />;
}

/* -------------------------- UI -------------------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f0d]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
          <span className="text-lg font-black tracking-tight">colors<span className="text-emerald-400">.</span></span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
          <a href="#quem-somos" className="hover:text-white">Quem somos</a>
          <Link to="/colors/super-green-black" className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300 hover:bg-emerald-500/30">🔥 Super Green Black</Link>
          <Link to="/colors/$brand" params={{ brand: "green" }} className="hover:text-white">Green</Link>
          <Link to="/colors/$brand" params={{ brand: "blue" }} className="hover:text-white">Blue</Link>
          <Link to="/colors/$brand" params={{ brand: "yellow" }} className="hover:text-white">Yellow</Link>
          <a
            href="https://rastreamento.correios.com.br/app/index.php"
            target="_blank"
            rel="noreferrer"
            onClick={() => colorsEvents.ctaClick("menu_rastreios", "correios")}
            className="hover:text-white"
          >
            Rastreios
          </a>
          <a href="#contato" className="hover:text-white">Contato</a>
        </nav>
        <a
          href="https://wa.me/5521967862834"
          target="_blank"
          rel="noreferrer"
          onClick={() => colorsEvents.whatsappClick("topbar")}
          className="hidden rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 sm:inline-flex"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_0%,rgba(16,185,129,0.35),transparent_60%),radial-gradient(800px_circle_at_80%_20%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(700px_circle_at_50%_100%,rgba(234,179,8,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,15,13,1))]" />
      </div>

      <div className="container relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
          Diversidade · Qualidade Premium
        </span>
        <h1 className="mt-6 max-w-4xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-black leading-[1.05] text-transparent sm:text-7xl">
          Colors Saúde <span className="text-emerald-400">transforma vidas</span> com produtos que funcionam.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
          Emagrecimento, libido, sono, virilidade masculina e saúde infantil. Uma família de marcas para cada momento da sua vida.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/colors/super-green-black"
            onClick={() => colorsEvents.ctaClick("hero_sgb", "/colors/super-green-black")}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 font-semibold text-black shadow-2xl shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            🔥 Conhecer Super Green Black <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#produtos"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Ver catálogo
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { n: "45k+", l: "Afiliados" },
            { n: "25k+", l: "Vendas / ano" },
            { n: "8", l: "Produtos premium" },
            { n: "100%", l: "Canais oficiais" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-black text-white sm:text-4xl">{s.n}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, label: "Produtos autênticos" },
    { icon: Truck, label: "Colors Log · entrega rápida" },
    { icon: Heart, label: "Feito com cuidado" },
    { icon: CheckCircle2, label: "Canais oficiais" },
  ];
  return (
    <div className="border-y border-white/10 bg-white/[0.02]">
      <div className="container mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-3 text-sm text-white/70">
            <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuemSomos() {
  return (
    <section id="quem-somos" className="py-24">
      <div className="container mx-auto grid max-w-7xl gap-16 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Quem somos</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Nascemos para ser referência em saúde e bem-estar.</h2>
          <div className="mt-6 space-y-4 text-white/70">
            <p>
              Em 2019 a marca <strong className="text-white">Green</strong> estreou com o Super Green — mais de 25.000 vendas no primeiro ano e uma rede de 45.000 afiliados.
            </p>
            <p>
              Em 2022, a Green passou a integrar a <strong className="text-white">Colors Saúde</strong> com as submarcas <span className="font-semibold text-emerald-400">Green</span> (feminino), <span className="font-semibold text-blue-400">Blue</span> (masculino) e <span className="font-semibold text-yellow-400">Yellow</span> (infantil).
            </p>
            <p>
              Compre sempre pelos <strong className="text-white">canais oficiais</strong>. Não vendemos em marketplaces como Mercado Livre.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(COLORS_BRANDS) as ColorsBrand[]).map((k) => {
            const b = COLORS_BRANDS[k];
            return (
              <Link key={k} to="/colors/$brand" params={{ brand: k }} className={`group rounded-2xl bg-gradient-to-br ${b.gradient} p-5 text-black shadow-xl transition hover:-translate-y-1`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{b.audience}</p>
                <p className="mt-2 text-2xl font-black">{b.label}</p>
                <p className="mt-2 line-clamp-3 text-sm opacity-80">{b.description}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold">Explorar <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SubmarcasGrid() {
  return (
    <section id="submarcas" className="relative py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Submarcas</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Uma família para cada público.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(["green", "blue", "yellow"] as ColorsBrand[]).map((k) => {
            const b = COLORS_BRANDS[k];
            return (
              <Link key={k} to="/colors/$brand" params={{ brand: k }} className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.gradient} p-8 text-black shadow-2xl transition hover:-translate-y-1`}>
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                <h3 className="text-4xl font-black">{b.label}</h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider opacity-80">{b.audience}</p>
                <p className="mt-4 text-black/80">{b.description}</p>
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold">Ver produtos <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Logistica() {
  return (
    <section id="logistica" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
      <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-white/5 to-emerald-600/20 p-10">
          <Truck className="h-12 w-12 text-emerald-400" aria-hidden />
          <h3 className="mt-6 text-3xl font-bold">Colors Log</h3>
          <p className="mt-3 text-white/70">
            Nossa logística própria garante que seu pedido chegue rápido e em segurança. Despacho em até 3 dias úteis, entrega entre 3 e 10 dias úteis conforme CEP.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Rastreamento por e-mail</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Suporte pelo WhatsApp</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Embalagem discreta</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Prazos & Entrega</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Segurança do pedido à porta.</h2>
          <p className="mt-4 text-lg text-white/70">Toda a operação logística da Colors Saúde é feita pela Colors Log.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[{n:"3 dias úteis",l:"Despacho"},{n:"3 a 10 dias",l:"Entrega"},{n:"24/7",l:"WhatsApp"},{n:"100%",l:"Rastreado"}].map((s)=>(
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-2xl font-black text-emerald-400">{s.n}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
              <span className="text-lg font-black">colors<span className="text-emerald-400">.</span></span>
            </div>
            <p className="mt-4 text-sm text-white/60">Diversidade transformando vidas com qualidade premium. Green · Blue · Yellow.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Marcas</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/colors/$brand" params={{ brand: "green" }}>Green</Link></li>
              <li><Link className="hover:text-white" to="/colors/$brand" params={{ brand: "blue" }}>Blue</Link></li>
              <li><Link className="hover:text-white" to="/colors/$brand" params={{ brand: "yellow" }}>Yellow</Link></li>
              <li><Link className="hover:text-white" to="/colors/$brand" params={{ brand: "colors" }}>Colors</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Institucional</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><a href="#quem-somos" className="hover:text-white">Quem somos</a></li>
              <li><a href="#produtos" className="hover:text-white">Produtos</a></li>
              <li><a href="#logistica" className="hover:text-white">Colors Log</a></li>
              <li><a href="#contato" className="hover:text-white">Contato</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Atendimento</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-400" /> 21 96786-2834</li>
              <li>
                <a href="https://wa.me/5521967862834" target="_blank" rel="noreferrer" onClick={()=>colorsEvents.whatsappClick("footer")} className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle className="h-4 w-4 text-emerald-400" /> WhatsApp SAC
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © 2020–{new Date().getFullYear()} Colors Saúde · CNPJ 40.314.815/0001-60 · Submarcas: Green, Blue e Yellow · www.colorssaude.com.br
        </div>
      </div>
    </footer>
  );
}

function FloatingWhats() {
  return (
    <a
      href="https://wa.me/5521967862834"
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={() => colorsEvents.whatsappClick("fab")}
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  );
}
