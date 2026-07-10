import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { WhatsAppBlock } from "./WhatsAppBlock";
import { MODULE_DETAILS } from "./moduleDetails";
import { ctaWaUrl, type NichoDetail } from "./nichoDetails";
import { NICHO_EXTRAS } from "./nichoExtras";
import { AGENDA_BASE, NICHO_AGENDA } from "./nichoAgenda";
import { NICHE_MODULE_SLUGS } from "@/data/nicheRecommendations";


interface Props {
  nicho: NichoDetail;
}

export function NichoPage({ nicho }: Props) {
  const Icon = nicho.icon;
  const wa = ctaWaUrl(nicho.ctaPrimary.whatsappMsg);
  const recommendedModules = MODULE_DETAILS.filter((m) => nicho.modules.includes(m.id));

  // Evita loop: se o CTA secundário aponta para /demo/escolher-nicho e este nicho já tem
  // planos mapeados, envia direto para o cadastro pré-preenchido no plano Full.
  const hasPlans = Boolean(NICHE_MODULE_SLUGS[nicho.slug]);
  const secondaryIsPicker = nicho.ctaSecondary.href === "/demo/escolher-nicho";
  const SecondaryCta = ({ children, className }: { children: React.ReactNode; className?: string }) =>
    secondaryIsPicker && hasPlans ? (
      <Link
        to="/demo/cadastro"
        search={{ niche: nicho.slug, plan: "full" as const }}
        className={className}
      >
        {children}
      </Link>
    ) : (
      <Link to={nicho.ctaSecondary.href} className={className}>
        {children}
      </Link>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link
            to="/nichos"
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Todos os nichos
          </Link>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge
                variant="outline"
                className="text-[10px] border-white/30 text-white bg-white/10 mb-2"
              >
                {nicho.shortLabel}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                {nicho.title}
              </h1>
            </div>
          </div>
          <p className="text-lg text-white/85 max-w-3xl leading-relaxed">{nicho.subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-6">
            <Button asChild size="lg" className="gap-2 shadow-lg bg-white text-primary hover:bg-white/90">
              <Link to="/orcamento">
                {nicho.ctaPrimary.label} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <SecondaryCta>
                {nicho.ctaSecondary.label} <ArrowRight className="w-4 h-4" />
              </SecondaryCta>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="gap-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Tirar dúvida no WhatsApp">
                <MessageCircle className="w-4 h-4" /> Tirar dúvida
              </a>
            </Button>
            {nicho.slug === "eventos" && (
              <Button
                asChild
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Link to="/demo/nicho/$slug" params={{ slug: "eventos" }}>
                  Abrir demo deste nicho <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="gap-2 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/orcamento">Solicitar proposta</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-14 pb-32">
        {/* DORES */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5 mb-1">
                Diagnóstico
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dores reais do seu nicho hoje</h2>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nicho.pains.map((p, i) => (
              <li
                key={p}
                className="group relative overflow-hidden rounded-xl border border-destructive/20 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-destructive/40"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-destructive/60 via-destructive to-destructive/40" />
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-destructive/70 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90">{p}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* PERDAS SILENCIOSAS */}
        <section className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-destructive/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "hsl(var(--destructive))",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive text-destructive-foreground shadow-md">
                <TrendingDown className="w-5 h-5" />
              </span>
              <div>
                <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-background mb-1">
                  Custo invisível
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Perdas silenciosas que ninguém calcula
                </h2>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {nicho.silentLosses.map((l) => (
                <li
                  key={l}
                  className="flex items-start gap-3 rounded-lg bg-background/70 backdrop-blur p-4 border border-destructive/15"
                >
                  <TrendingDown className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* COMO A PLATAFORMA RESOLVE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
              <Lightbulb className="w-5 h-5" />
            </span>
            <div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 mb-1">
                Solução
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Como a Impulsionando resolve</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nicho.solution.map((s, i) => (
              <div
                key={s}
                className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/40"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-primary opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
                <div className="relative flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-semibold text-muted-foreground tabular-nums mb-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="text-sm leading-relaxed text-foreground/90">{s}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* AGENDA ONLINE POR NICHO */}
        {(() => {
          const ab = NICHO_AGENDA[nicho.slug];
          if (!ab) return null;
          return (
            <section className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
              <Badge variant="outline" className="mb-3 text-[10px] border-primary/40 text-primary">
                Agenda online
              </Badge>
              <h2 className="text-xl font-bold tracking-tight mb-3">{ab.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-4">{AGENDA_BASE}</p>
              <p className="text-sm leading-relaxed mb-4">{ab.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {ab.highlights.map((h) => (
                  <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {h}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="btn-whatsapp gap-2">
                  <a href={ctaWaUrl(ab.cta)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4" />
                    {ab.cta}
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/demo/agenda"
                    search={{ nicho: nicho.slug }}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        // garante reseed da DEMO para o nicho atual
                        window.localStorage.removeItem("imp.demo.mock.agenda");
                      }
                    }}
                  >
                    Ver módulo de agenda
                  </Link>
                </Button>
              </div>

            </section>
          );
        })()}


        {/* JORNADA PRÁTICA */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 mb-1">
                Passo a passo
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Jornada prática</h2>
            </div>
          </div>
          <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-primary/40 before:via-primary/20 before:to-transparent">
            {nicho.journey.map((s, i) => (
              <li
                key={s.step}
                className="group relative flex gap-4 rounded-xl border bg-card p-5 pl-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/40"
              >
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold shadow-md ring-4 ring-background">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/70 tabular-nums">
                      Etapa {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="font-semibold text-foreground">{s.step}</div>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed mt-1.5">{s.detail}</div>
                </div>
                <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground/40 self-center shrink-0 transition-all group-hover:text-primary group-hover:translate-x-1" />
              </li>
            ))}
          </ol>
        </section>


        {/* BLOCO EXTRA (ex.: reserva paga em bares) */}
        {nicho.extraBlock && (
          <section className="rounded-xl border bg-muted/30 p-6">
            <h2 className="text-xl font-bold tracking-tight mb-4">{nicho.extraBlock.title}</h2>
            <ol className="space-y-2">
              {nicho.extraBlock.lines.map((l, i) => (
                <li key={l} className="flex gap-3 text-sm leading-relaxed">
                  <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* EXEMPLOS LOGÍSTICOS / FORMULÁRIO / DASHBOARD POR NICHO */}
        {(() => {
          const extra = NICHO_EXTRAS[nicho.slug];
          if (!extra) return null;
          return (
            <>
              {extra.logisticsExamples && extra.logisticsExamples.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <Badge variant="outline" className="text-[10px] border-accent/40 text-accent bg-accent/5 mb-1">
                        Operação na prática
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Como a operação funciona, na prática
                      </h2>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {extra.logisticsExamples.map((g, gi) => (
                      <Card
                        key={g.title}
                        className="group relative overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/40"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
                        <div className="flex items-center gap-3 mb-4">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground text-xs font-bold shadow-sm">
                            {String(gi + 1).padStart(2, "0")}
                          </span>
                          <h3 className="font-semibold text-base">{g.title}</h3>
                        </div>
                        <ul className="space-y-2.5 text-sm leading-relaxed">
                          {g.items.map((it) => (
                            <li key={it} className="flex gap-2.5 items-start">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                              <span className="text-foreground/90">{it}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {(extra.formExample || extra.dashboardExample) && (
                <section className="grid md:grid-cols-2 gap-4">
                  {extra.formExample && (
                    <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-card to-primary/5">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-background">
                            Formulário
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                          <Lightbulb className="w-4 h-4 text-primary" /> {extra.formExample.title}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {extra.formExample.fields.map((f) => (
                            <li
                              key={f}
                              className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 backdrop-blur px-3 py-2"
                            >
                              <span className="h-2 w-2 rounded-sm bg-primary/60" />
                              <span className="text-foreground/90">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}
                  {extra.dashboardExample && (
                    <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-card to-accent/5">
                      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] border-accent/40 text-accent bg-background">
                            Dashboard
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                          <Target className="w-4 h-4 text-accent" /> {extra.dashboardExample.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {extra.dashboardExample.cards.map((c, ci) => (
                            <div
                              key={c}
                              className="group relative rounded-lg border bg-background/70 backdrop-blur px-3 py-3 text-xs font-medium overflow-hidden hover:border-primary/40 transition-colors"
                            >
                              <div className="absolute top-1 right-1.5 text-[9px] font-mono text-muted-foreground/50 tabular-nums">
                                {String(ci + 1).padStart(2, "0")}
                              </div>
                              <div className="h-1 w-6 rounded-full bg-gradient-primary mb-1.5" />
                              <div className="text-foreground/90 leading-tight">{c}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </section>
              )}


              {extra.closingPitch && (
                <section className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                  <p className="text-base leading-relaxed text-foreground/90">{extra.closingPitch}</p>
                </section>
              )}
            </>
          );
        })()}

        {/* WHATSAPP */}
        <section>
          <WhatsAppBlock />
        </section>


        {/* MÓDULOS RECOMENDADOS */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Módulos recomendados para este nicho</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedModules.map((m) => {
              const MIcon = m.icon;
              return (
                <Link
                  key={m.id}
                  to="/modulos/$slug"
                  params={{ slug: m.id }}
                  className="p-4 rounded-lg border bg-card hover:shadow-elegant transition-shadow flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <MIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{m.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-background mb-1">
                  Resultados
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Ganhos diretos para o seu negócio
                </h2>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nicho.benefits.map((b, i) => (
                <li
                  key={b}
                  className="group relative overflow-hidden rounded-xl border bg-background/70 backdrop-blur p-4 transition-all hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/50"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:ring-primary/40 transition-all">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-semibold tabular-nums text-primary/70 mb-0.5">
                        +{String(i + 1).padStart(2, "0")}
                      </div>
                      <span className="text-sm font-medium leading-snug text-foreground">{b}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>


        {/* CTA FINAL EM CARD */}
        <Card className="p-8 lg:p-10 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
              Pronto para parar de perder oportunidade?
            </h2>
            <p className="text-white/85 leading-relaxed">
              Teste a demonstração agora, peça um orçamento sob medida ou fale com um consultor que entende
              o seu nicho.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="lg" className="gap-2 shadow-lg bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento">
                  {nicho.ctaPrimary.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <SecondaryCta>{nicho.ctaSecondary.label}</SecondaryCta>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/contato">Falar com consultor</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="gap-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Tirar dúvida no WhatsApp">
                  <MessageCircle className="w-4 h-4" /> Dúvida no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* STICKY CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="hidden sm:block flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{nicho.shortLabel}</div>
            <div className="text-xs text-muted-foreground truncate">
              Resposta em até 1 dia útil. Sem cadastro obrigatório.
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link to={nicho.ctaSecondary.href}>{nicho.demoRoute ? "Ver demo" : "Saiba mais"}</Link>
          </Button>
          <Button asChild size="lg" className="gap-2 flex-1 sm:flex-initial">
            <Link to="/orcamento">
              <span className="truncate">{nicho.ctaPrimary.label}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
