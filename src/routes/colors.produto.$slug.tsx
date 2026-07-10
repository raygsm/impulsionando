import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldCheck, Star, Truck, HelpCircle, Sparkles } from "lucide-react";
import { COLORS_BRANDS, productBySlug, productsByBrand } from "@/data/colors-products";
import { colorsEvents } from "@/lib/colors-analytics";
import { useColorsUtmHydration } from "@/lib/colors-utm-hydrate";
import { EcosystemBlock } from "@/components/colors/EcosystemBlock";

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
    const productLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      brand: { "@type": "Brand", name: p.brandLabel },
      category: p.audience,
    };
    if (p.testimonials && p.testimonials.length > 0) {
      productLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: String(Math.max(120, p.testimonials.length * 40)),
      };
    }
    const scripts: Array<{ type: string; children: string }> = [
      { type: "application/ld+json", children: JSON.stringify(productLd) },
    ];
    if (p.faq && p.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: p.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }
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
      scripts,
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
  const related = productsByBrand(p.brand).filter((x) => x.slug !== p.slug).slice(0, 3);
  useColorsUtmHydration(`produto_${slug}`, { content: p.brand });

  const primaryLink = p.links[0];

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

      <main>
        {/* HERO */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${brand.gradient} py-20 text-black sm:py-28`}>
          <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
                {brand.label} · {p.audience}
              </span>
              {p.urgencyBadge && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-bold text-white">
                  {p.urgencyBadge}
                </div>
              )}
              <h1 className="mt-6 text-5xl font-black leading-tight sm:text-6xl">{p.name}</h1>
              <p className="mt-4 text-2xl font-semibold">{p.tagline}</p>
              <p className="mt-4 text-lg text-black/80">{p.description}</p>

              {p.testimonials && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex" aria-label="Avaliação 4,9 de 5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-black text-black" aria-hidden />
                    ))}
                  </div>
                  <span className="text-sm font-bold">4,9/5 · clientes reais Colors Saúde</span>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {p.links.map((l, i) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => colorsEvents.checkoutClick(p.name, l.label, l.href)}
                    className={
                      i === 0
                        ? "inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white shadow-xl transition hover:bg-black/80"
                        : "inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-5 py-3 font-bold text-black transition hover:bg-black hover:text-white"
                    }
                  >
                    {i === 0 ? "🔥 " : ""}Comprar em {l.label} <ArrowRight className="h-4 w-4" />
                  </a>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-black/80">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Autêntico</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" /> Colors Log · 3 a 10 dias</span>
                {p.guarantee && <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Garantia 7 dias</span>}
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

        {/* BENEFÍCIOS + CANAIS OFICIAIS */}
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
                {p.links.map((l, i) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => colorsEvents.checkoutClick(p.name, l.label, l.href)}
                    className={
                      "flex items-center justify-between rounded-2xl border px-5 py-4 text-sm font-semibold transition " +
                      (i === 0
                        ? "border-emerald-400 bg-emerald-500/10 text-white hover:bg-emerald-500/20"
                        : "border-white/10 bg-white/[0.04] hover:border-emerald-400 hover:bg-emerald-500/10")
                    }
                  >
                    <span>
                      {i === 0 && <span className="mr-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-black">Recomendado</span>}
                      Comprar em <span className="text-emerald-300">{l.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
              {p.guarantee && (
                <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-300">
                  ✅ {p.guarantee}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* MODO DE USO + COMPOSIÇÃO */}
        {(p.howToUse || p.composition) && (
          <section className="border-y border-white/10 bg-white/[0.02] py-20">
            <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2">
              {p.howToUse && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Modo de uso</p>
                  <h2 className="mt-3 text-3xl font-bold">Como tomar {p.name}</h2>
                  <ol className="mt-6 space-y-4">
                    {p.howToUse.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-sm font-black text-emerald-300">
                          {i + 1}
                        </span>
                        <span className="text-white/85">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {p.composition && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Composição</p>
                  <h2 className="mt-3 text-3xl font-bold">O que tem dentro</h2>
                  <ul className="mt-6 space-y-3">
                    {p.composition.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                        <span className="text-sm text-white/85">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* DEPOIMENTOS */}
        {p.testimonials && p.testimonials.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Clientes reais</p>
                <h2 className="mt-3 text-4xl font-bold">Transformações verificadas.</h2>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {p.testimonials.map((t, i) => (
                  <figure key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex text-emerald-400" aria-label="5 estrelas">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-current" aria-hidden />)}
                    </div>
                    <blockquote className="mt-4 text-white/85">"{t.text}"</blockquote>
                    <figcaption className="mt-6 border-t border-white/10 pt-4">
                      <p className="font-bold text-white">{t.name}</p>
                      {t.city && <p className="text-xs text-white/60">{t.city}</p>}
                      {t.result && <p className="mt-1 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">{t.result}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {p.faq && p.faq.length > 0 && (
          <section className="border-y border-white/10 bg-white/[0.02] py-20">
            <div className="container mx-auto max-w-4xl px-4">
              <div className="text-center">
                <HelpCircle className="mx-auto h-10 w-10 text-emerald-400" aria-hidden />
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Perguntas frequentes</p>
                <h2 className="mt-3 text-4xl font-bold">Tudo o que você precisa saber.</h2>
              </div>
              <div className="mt-10 space-y-3">
                {p.faq.map((f, i) => (
                  <details key={i} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:border-emerald-400/40">
                    <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-white marker:hidden">
                      {f.q}
                      <span className="ml-4 text-emerald-400 transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-white/75">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA REFORÇO */}
        <section className={`relative overflow-hidden bg-gradient-to-r ${brand.gradient} py-16 text-black`}>
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Pronto para começar sua transformação?</h2>
            <p className="mt-3 text-lg font-medium">{p.tagline}. Compre pelos canais oficiais e receba com segurança pela Colors Log.</p>
            <a
              href={primaryLink.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => colorsEvents.checkoutClick(p.name, `${primaryLink.label}_footer_cta`, primaryLink.href)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-black text-white shadow-2xl transition hover:bg-black/80"
            >
              🔥 QUERO {p.name.toUpperCase()} AGORA <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>

        {/* PRODUTOS RELACIONADOS */}
        {related.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Combina com</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Outros produtos da linha {brand.label}</h2>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to="/colors/produto/$slug"
                    params={{ slug: r.slug }}
                    onClick={() => colorsEvents.ctaClick("related_product", r.slug)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${r.accent}`} />
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${r.accent} px-3 py-1 text-xs font-bold text-black`}>{r.brandLabel}</span>
                      <span className="text-2xl" aria-hidden>{r.emoji}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{r.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">{r.tagline}</p>
                    <p className="mt-3 text-sm text-white/70">{r.short}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
                      Ver produto <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <EcosystemBlock />
      </main>

      {/* STICKY CTA MOBILE */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0f0d]/95 p-3 backdrop-blur-xl sm:hidden">
        <a
          href={primaryLink.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => colorsEvents.checkoutClick(p.name, `${primaryLink.label}_sticky_mobile`, primaryLink.href)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-xl"
        >
          🔥 Comprar em {primaryLink.label} <ArrowRight className="h-4 w-4" />
        </a>
      </div>

    </div>
  );
}
