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


interface Props {
  nicho: NichoDetail;
}

export function NichoPage({ nicho }: Props) {
  const Icon = nicho.icon;
  const wa = ctaWaUrl(nicho.ctaPrimary.whatsappMsg);
  const recommendedModules = MODULE_DETAILS.filter((m) => nicho.modules.includes(m.id));

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
            <Button asChild size="lg" className="btn-whatsapp gap-2 shadow-lg">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                {nicho.ctaPrimary.label}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={nicho.ctaSecondary.href}>
                {nicho.ctaSecondary.label} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
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
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="text-2xl font-bold tracking-tight">Dores reais do seu nicho hoje</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {nicho.pains.map((p) => (
              <li key={p} className="flex items-start gap-2.5 p-4 rounded-lg border bg-card">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* PERDAS SILENCIOSAS */}
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-bold tracking-tight">Perdas silenciosas que ninguém calcula</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {nicho.silentLosses.map((l) => (
              <li key={l} className="flex items-start gap-2.5">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span className="text-sm leading-relaxed">{l}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* COMO A PLATAFORMA RESOLVE */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Como a Impulsionando resolve</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nicho.solution.map((s) => (
              <div key={s} className="flex items-start gap-2.5 p-4 rounded-lg border bg-card">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm leading-relaxed">{s}</span>
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
                  <Link to="/modulos/$slug" params={{ slug: "agenda" }}>
                    Ver módulo de agenda
                  </Link>
                </Button>
              </div>
            </section>
          );
        })()}


        {/* JORNADA PRÁTICA */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Jornada prática, passo a passo</h2>
          </div>
          <ol className="space-y-3">
            {nicho.journey.map((s, i) => (
              <li key={s.step} className="flex gap-4 p-5 rounded-lg border bg-card">
                <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{s.step}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed mt-1">{s.detail}</div>
                </div>
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
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Como a operação funciona, na prática</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {extra.logisticsExamples.map((g) => (
                      <Card key={g.title} className="p-6">
                        <h3 className="font-semibold mb-3">{g.title}</h3>
                        <ul className="space-y-2 text-sm leading-relaxed">
                          {g.items.map((it) => (
                            <li key={it} className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{it}</span>
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
                    <Card className="p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" /> {extra.formExample.title}
                      </h3>
                      <ul className="space-y-1.5 text-sm">
                        {extra.formExample.fields.map((f) => (
                          <li key={f} className="text-muted-foreground">• {f}</li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {extra.dashboardExample && (
                    <Card className="p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> {extra.dashboardExample.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {extra.dashboardExample.cards.map((c) => (
                          <div key={c} className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-medium">
                            {c}
                          </div>
                        ))}
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
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Ganhos diretos para o seu negócio</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {nicho.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span className="text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
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
              <Button asChild size="lg" className="btn-whatsapp gap-2 shadow-lg">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  {nicho.ctaPrimary.label}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={nicho.ctaSecondary.href}>{nicho.ctaSecondary.label}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/contato">Falar com consultor</Link>
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
          <Button asChild size="lg" className="gap-2 flex-1 sm:flex-initial btn-whatsapp">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="truncate">{nicho.ctaPrimary.label}</span>
            </a>
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
