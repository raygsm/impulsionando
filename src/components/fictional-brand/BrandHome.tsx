import { Sparkles, Shield, Clock, Heart, Zap, TrendingUp, Star, ArrowRight, Quote } from "lucide-react";
import { useBrand } from "./BrandThemeProvider";
import { BrandLinkTo } from "./BrandLinkTo";

const ICONS = { sparkle: Sparkles, shield: Shield, clock: Clock, heart: Heart, bolt: Zap, trend: TrendingUp } as const;

export function BrandHome() {
  const b = useBrand();
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: b.hero.imageGradient }} aria-hidden />
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(60% 80% at 80% 20%, rgba(255,255,255,.35), transparent 60%)" }} aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-10 lg:grid-cols-[1.15fr_.85fr] items-center">
          <div style={{ color: b.palette.primaryFg }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(255,255,255,.14)", backdropFilter: "blur(6px)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: b.palette.accent }} />
              {b.hero.eyebrow}
            </div>
            <h1
              className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: b.typography.heading }}
            >
              {b.hero.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg max-w-xl opacity-90">{b.hero.subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BrandLinkTo
                target={b.hero.primaryCta.to as "contato" | "catalogo"}
                slug={b.slug}
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
                style={{ background: b.palette.accent, color: b.palette.ink }}
              >
                {b.hero.primaryCta.label} <ArrowRight className="h-4 w-4" />
              </BrandLinkTo>
              {b.hero.secondaryCta && (
                <BrandLinkTo
                  target={b.hero.secondaryCta.to as "contato" | "catalogo"}
                  slug={b.slug}
                  className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold border"
                  style={{ borderColor: "rgba(255,255,255,.5)", color: b.palette.primaryFg }}
                >
                  {b.hero.secondaryCta.label}
                </BrandLinkTo>
              )}
            </div>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
              {b.hero.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs uppercase tracking-wider opacity-70">{s.label}</dt>
                  <dd className="text-2xl font-bold" style={{ fontFamily: b.typography.heading, color: b.palette.accent }}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div
              className="aspect-[4/5] rounded-3xl border shadow-2xl overflow-hidden grid place-items-center"
              style={{
                background: b.hero.imageGradient,
                borderColor: "rgba(255,255,255,.2)",
              }}
            >
              <span className="text-[140px] drop-shadow-2xl" aria-hidden>{b.hero.imageEmoji}</span>
            </div>
            <div
              className="absolute -bottom-6 -left-6 rounded-2xl border shadow-xl p-4 hidden sm:block"
              style={{ background: b.palette.surface, borderColor: `${b.palette.ink}12`, color: b.palette.ink }}
            >
              <div className="flex items-center gap-1 text-xs" style={{ color: b.palette.accent }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="mt-1 text-sm font-semibold max-w-[220px]">{b.testimonials[0]?.quote}</p>
              <p className="text-xs opacity-70 mt-1">— {b.testimonials[0]?.author}</p>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {b.highlights.map((h) => {
            const Icon = ICONS[h.icon];
            return (
              <div
                key={h.title}
                className="rounded-2xl p-5 border"
                style={{ background: "#fff", borderColor: `${b.palette.ink}12` }}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: `${b.palette.primary}15`, color: b.palette.primary }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
                  {h.title}
                </h3>
                <p className="mt-1.5 text-sm" style={{ color: b.palette.muted }}>{h.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATALOG PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: b.palette.muted }}>
              {b.catalog.label}
            </div>
            <h2 className="mt-1 text-3xl font-bold" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
              Destaques do momento
            </h2>
          </div>
          <BrandLinkTo
            target="catalogo"
            slug={b.slug}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: b.palette.primary }}
          >
            Ver tudo <ArrowRight className="h-4 w-4" />
          </BrandLinkTo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {b.catalog.items.slice(0, 6).map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border overflow-hidden group"
              style={{ background: "#fff", borderColor: `${b.palette.ink}10` }}
            >
              <div
                className="aspect-[4/3] grid place-items-center relative overflow-hidden"
                style={{ background: item.imageGradient }}
              >
                <span className="text-6xl transition-transform group-hover:scale-110" aria-hidden>{item.emoji}</span>
                {item.highlight && (
                  <span
                    className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
                    style={{ background: b.palette.accent, color: b.palette.ink }}
                  >
                    {item.highlight}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: b.palette.muted }}>
                  {b.catalog.categories.find((c) => c.id === item.category)?.label ?? item.category}
                </div>
                <h3 className="mt-1 font-semibold" style={{ color: b.palette.ink, fontFamily: b.typography.heading }}>
                  {item.name}
                </h3>
                <p className="mt-1 text-sm line-clamp-2" style={{ color: b.palette.muted }}>{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold" style={{ color: b.palette.primary }}>{item.priceLabel}</span>
                  <BrandLinkTo
                    target="catalogo"
                    slug={b.slug}
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: b.palette.primary }}
                  >
                    Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                  </BrandLinkTo>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: `${b.palette.primary}08` }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
            Quem já vive isso
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {b.testimonials.map((t) => (
              <blockquote
                key={t.author}
                className="rounded-2xl p-6 border"
                style={{ background: "#fff", borderColor: `${b.palette.ink}12` }}
              >
                <Quote className="h-6 w-6" style={{ color: b.palette.accent }} />
                <p className="mt-3 text-sm leading-relaxed" style={{ color: b.palette.ink }}>“{t.quote}”</p>
                <footer className="mt-4 text-xs" style={{ color: b.palette.muted }}>
                  <strong style={{ color: b.palette.ink }}>{t.author}</strong> · {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div
          className="rounded-3xl px-8 py-14 text-center relative overflow-hidden"
          style={{ background: b.hero.imageGradient, color: b.palette.primaryFg }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: b.typography.heading }}>
            Pronto para começar com a {b.companyName}?
          </h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">{b.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <BrandLinkTo
              target="contato"
              slug={b.slug}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold"
              style={{ background: b.palette.accent, color: b.palette.ink }}
            >
              Fale agora <ArrowRight className="h-4 w-4" />
            </BrandLinkTo>
            <BrandLinkTo
              target="catalogo"
              slug={b.slug}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold border"
              style={{ borderColor: "rgba(255,255,255,.5)", color: b.palette.primaryFg }}
            >
              Ver {b.catalog.label.toLowerCase()}
            </BrandLinkTo>
          </div>
        </div>
      </section>
    </div>
  );
}
