import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { COLORS_BRANDS, productBySlug } from "@/data/colors-products";
import { colorsEvents } from "@/lib/colors-analytics";

export const Route = createFileRoute("/colors/produto/$slug")({
  beforeLoad: ({ params }) => {
    if (!productBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const p = productBySlug(params.slug);
    if (!p) return { meta: [{ title: "Produto — Colors Saúde" }] };
    const title = `${p.name} — ${p.brandLabel} · Colors Saúde`;
    const desc = `${p.tagline}. ${p.short}`;
    const url = `https://colors.impulsionando.com.br/colors/produto/${p.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          brand: { "@type": "Brand", name: p.brandLabel },
          category: p.audience,
        }),
      }],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-black text-white">
      <div className="text-center">
        <p className="text-lg">Produto não encontrado.</p>
        <Link to="/colors" className="mt-4 inline-block text-emerald-400 hover:underline">Voltar ao Colors Saúde</Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const p = productBySlug(slug)!;
  const brand = COLORS_BRANDS[p.brand];

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f0d]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/colors" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
            <span className="text-lg font-black">colors<span className="text-emerald-400">.</span></span>
          </Link>
          <Link to="/colors/$brand" params={{ brand: p.brand }} className="text-sm text-white/70 hover:text-white">← Linha {brand.label}</Link>
        </div>
      </header>

      <section className={`relative overflow-hidden bg-gradient-to-br ${brand.gradient} py-20 text-black sm:py-28`}>
        <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
              {brand.label} · {p.audience}
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight sm:text-6xl">{p.name}</h1>
            <p className="mt-4 text-2xl font-semibold">{p.tagline}</p>
            <p className="mt-4 text-lg text-black/80">{p.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {p.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => colorsEvents.checkoutClick(p.name, l.label, l.href)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white shadow-xl transition hover:bg-black/80"
                >
                  Comprar em {l.label} <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-white/30 blur-3xl" aria-hidden />
            <div className="relative grid aspect-square place-items-center rounded-3xl border border-black/10 bg-white/20 text-[220px] backdrop-blur">
              <span aria-hidden>{p.emoji}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Benefícios</p>
            <h2 className="mt-3 text-4xl font-bold">Por que usar {p.name}</h2>
            <ul className="mt-8 space-y-4">
              {p.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" aria-hidden />
                  <span className="text-white/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <ShieldCheck className="h-10 w-10 text-emerald-400" aria-hidden />
            <h3 className="mt-4 text-2xl font-bold">Compre pelos canais oficiais</h3>
            <p className="mt-3 text-white/70">
              Para garantir autenticidade, procedência e a melhor experiência, compre {p.name} apenas pelas plataformas listadas abaixo. Colors Saúde não vende em marketplaces.
            </p>
            <div className="mt-6 grid gap-3">
              {p.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => colorsEvents.checkoutClick(p.name, l.label, l.href)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold transition hover:border-emerald-400 hover:bg-emerald-500/10"
                >
                  <span>Comprar em <span className="text-emerald-300">{l.label}</span></span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <a
        href="https://wa.me/5521967862834"
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        onClick={() => colorsEvents.whatsappClick(`produto_${p.slug}`)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
}
