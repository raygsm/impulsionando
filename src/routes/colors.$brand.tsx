import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { COLORS_BRANDS, productsByBrand, type ColorsBrand } from "@/data/colors-products";
import { colorsEvents } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";
import { EcosystemBlock } from "@/components/colors/EcosystemBlock";


const VALID: ColorsBrand[] = ["green", "blue", "yellow", "colors"];

export const Route = createFileRoute("/colors/$brand")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.brand as ColorsBrand)) throw notFound();
  },
  head: ({ params }) => {
    const brand = params.brand as ColorsBrand;
    const meta = COLORS_BRANDS[brand];
    if (!meta) return { meta: [{ title: "Colors Saúde" }] };
    const title = `Linha ${meta.label} — Colors Saúde`;
    const desc = `${meta.description} Produtos oficiais da linha ${meta.label} com canais autorizados de compra.`;
    const url = `https://colors.impulsionando.com.br/colors/${brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BrandPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-black text-white">
      <div className="text-center">
        <p className="text-lg">Linha não encontrada.</p>
        <Link to="/colors" className="mt-4 inline-block text-emerald-400 hover:underline">Voltar ao Colors Saúde</Link>
      </div>
    </div>
  ),
});

function BrandPage() {
  const { brand } = Route.useParams();
  const b = brand as ColorsBrand;
  const meta = COLORS_BRANDS[b];
  const products = productsByBrand(b);
  useColorsUtmHydration(`linha_${b}`, { content: b });

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f0d]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/colors" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
            <span className="text-lg font-black">colors<span className="text-emerald-400">.</span></span>
          </Link>
          <Link to="/colors" className="text-sm text-white/70 hover:text-white">← Todas as marcas</Link>
        </div>
      </header>

      <main>
        {/* HERO DE MARCA */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${meta.gradient} py-24 text-black sm:py-32`}>
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/30 blur-3xl" aria-hidden />
          <div className="container relative mx-auto max-w-7xl px-4">
            <p className="text-sm font-bold uppercase tracking-[0.3em]">{meta.audience}</p>
            <h1 className="mt-4 text-6xl font-black leading-none sm:text-8xl">{meta.label}</h1>
            <p className="mt-6 max-w-2xl text-lg font-medium sm:text-xl">{meta.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-5 py-2 text-sm font-bold text-white backdrop-blur">
                {products.length} {products.length === 1 ? "produto" : "produtos"} nesta linha
              </div>
              <a
                href="#produtos"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black/80"
              >
                Ver produtos <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-black/80">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Produtos autênticos</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" /> Colors Log · 3 a 10 dias</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Fórmulas premium</span>
            </div>
          </div>
        </section>

        {/* PRODUTOS DA LINHA */}
        <section id="produtos" className="py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Catálogo {meta.label}</p>
              <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Escolha o produto certo pra você.</h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article key={p.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20">
                  <div className={`h-1 -mx-6 -mt-6 mb-6 bg-gradient-to-r ${p.accent}`} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">{p.audience}</span>
                    <span className="text-2xl" aria-hidden>{p.emoji}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-emerald-300">{p.tagline}</p>
                  <p className="mt-3 text-sm text-white/70">{p.short}</p>
                  <Link
                    to="/colors/produto/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => colorsEvents.ctaClick(`brand_${b}_detail`, p.slug)}
                    className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Ver detalhes e comprar <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
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
                </article>
              ))}
            </div>
          </div>
        </section>

        <EcosystemBlock />
      </main>


      <a
        href="https://wa.me/5521967862834"
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        onClick={() => colorsEvents.whatsappClick(`brand_${b}`)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
}
