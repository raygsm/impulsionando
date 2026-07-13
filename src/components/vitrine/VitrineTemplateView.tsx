/**
 * Renderiza um template de vitrine (front-end demo) a partir de dados
 * declarativos. Um único componente serve todos os macro-nichos.
 */
import { Link } from "@tanstack/react-router";
import type { VitrineTemplate } from "@/data/vitrine-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight, MapPin, Mail, MessageCircle, Sparkles, Quote, ExternalLink,
} from "lucide-react";

export function VitrineTemplateView({ t }: { t: VitrineTemplate }) {
  const Icon = t.icon;
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Micro top bar de contexto */}
      <div className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold text-white shadow-sm shrink-0"
              style={{ background: t.palette.accent }}
              aria-hidden
            >
              {t.brand.initials}
            </span>
            <div className="min-w-0">
              <div className="font-semibold truncate">{t.brand.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t.brand.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px]">
              <Icon className="h-3 w-3 mr-1" /> {t.label}
            </Badge>
            <Button asChild size="sm" variant="ghost">
              <Link to="/templates">
                <ArrowRight className="h-4 w-4 rotate-180" /> Vitrine
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={t.hero.image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${t.palette.heroGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-32 lg:py-40 text-white">
          <Badge
            variant="outline"
            className="border-white/40 bg-white/10 text-white backdrop-blur mb-4"
          >
            <Sparkles className="h-3 w-3 mr-1" /> {t.hero.eyebrow}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight max-w-3xl leading-tight">
            {t.hero.title}
          </h1>
          <p className="mt-5 text-lg text-white/85 max-w-2xl">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={t.hero.primary.href}
              className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:brightness-110"
              style={{ background: t.palette.accent }}
            >
              {t.hero.primary.label} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={t.hero.secondary.href}
              className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              {t.hero.secondary.label}
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {t.features.map((f) => (
            <Card key={f.title} className="p-6 border-border/70 hover:border-primary/40 transition">
              <div
                className="h-10 w-10 rounded-lg mb-4 grid place-items-center text-white"
                style={{ background: t.palette.accent }}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="cardapio" className="bg-muted/30 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Destaques</div>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                O melhor da nossa curadoria
              </h2>
            </div>
            <a
              href="#todos"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: t.palette.accent }}
            >
              Ver tudo <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.showcase.map((s) => (
              <article
                key={s.title}
                className="group overflow-hidden rounded-xl border border-border/70 bg-card hover:shadow-lg transition"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{s.title}</h3>
                    {s.meta && (
                      <span
                        className="text-xs font-semibold shrink-0"
                        style={{ color: t.palette.accent }}
                      >
                        {s.meta}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <Quote
          className="mx-auto h-10 w-10 mb-4"
          style={{ color: t.palette.accent }}
          aria-hidden
        />
        <blockquote className="font-serif text-2xl sm:text-3xl leading-relaxed">
          "{t.testimonial.quote}"
        </blockquote>
        <div className="mt-6 text-sm text-muted-foreground">
          <strong className="text-foreground">{t.testimonial.author}</strong> · {t.testimonial.role}
        </div>
      </section>

      {/* CTA + CONTATO */}
      <section
        id="agendar"
        className="relative overflow-hidden text-white"
        style={{ background: t.palette.accent }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Pronto para começar?
            </h2>
            <p className="mt-3 text-white/90 max-w-xl">
              Este é um exemplo de front-end que a Impulsionando entrega. Fale com o time e
              adaptamos para a sua marca — imagens, textos e integrações.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/quero-comecar">
                  Quero um site assim <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20">
                <Link to="/templates">Ver outros templates</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
              <MessageCircle className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-white/70 text-[11px] uppercase tracking-wider">WhatsApp</div>
                <div className="font-semibold">{t.contact.whatsapp}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
              <Mail className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-white/70 text-[11px] uppercase tracking-wider">E-mail</div>
                <div className="font-semibold">{t.contact.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
              <MapPin className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-white/70 text-[11px] uppercase tracking-wider">Endereço</div>
                <div className="font-semibold">{t.contact.address}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé de contexto */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Template <strong className="text-foreground">{t.templateName}</strong> · demonstração
            pública da Impulsionando.
          </div>
          <div className="flex items-center gap-4">
            {t.liveUrl && (
              <Link to={t.liveUrl} className="inline-flex items-center gap-1 hover:text-foreground">
                Versão navegável <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            <Link to="/templates" className="hover:text-foreground">Vitrine completa</Link>
            <Link to="/quero-comecar" className="hover:text-foreground">Contratar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
