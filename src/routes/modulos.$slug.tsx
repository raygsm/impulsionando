import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { MODULE_DETAILS } from "@/components/marketing/moduleDetails";

const WHATSAPP_BASE =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20contratar%20o%20m%C3%B3dulo%20";

export const Route = createFileRoute("/modulos/$slug")({
  loader: ({ params }) => {
    const mod = MODULE_DETAILS.find((m) => m.id === params.slug);
    if (!mod) throw notFound();
    return { mod };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.mod;
    const title = m
      ? `${m.title} — Impulsionando Tecnologia`
      : "Módulo — Impulsionando";
    const description = m?.hook ?? "Soluções modulares Impulsionando.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ModulePage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Módulo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O módulo que você procura não existe ou foi renomeado.
          </p>
          <Button asChild>
            <Link to="/modulos">Ver todos os módulos</Link>
          </Button>
        </div>
      </div>
      <PublicFooter />
    </div>
  ),
});

function ModulePage() {
  const { mod } = Route.useLoaderData();
  const Icon = mod.icon;
  const waUrl =
    WHATSAPP_BASE + encodeURIComponent(mod.title) + "%20da%20Impulsionando.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link
            to="/modulos"
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Todos os módulos
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
                {mod.badge.label}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                {mod.title}
              </h1>
            </div>
          </div>
          <p className="text-lg text-white/85 max-w-3xl leading-relaxed">
            {mod.hook}
          </p>
          <div className="flex flex-wrap gap-3 pt-6">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-white text-primary hover:bg-white/90"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                {mod.ctaLabel ?? "Contratar agora no WhatsApp"}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/orcamento">
                Montar orçamento <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            {mod.demoRoute && (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="gap-2 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={mod.demoRoute}>
                  Ver na demo <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12 pb-32">
        {/* Para quem */}
        <Card className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Target className="w-4 h-4 text-primary" /> Para quem é
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            {mod.forWho}
          </p>
        </Card>

        {/* Benefícios */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-primary" /> O que você ganha
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {mod.benefits.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 p-4 rounded-lg border bg-card"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Jornada */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-primary" /> Como funciona na prática
          </h2>
          <ol className="space-y-4">
            {mod.howItWorks.map((s, i) => (
              <li
                key={s.step}
                className="flex gap-4 p-5 rounded-lg border bg-card"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{s.step}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {s.detail}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Exemplos */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 text-primary" /> Exemplos reais
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {mod.examples.map((e) => (
              <div
                key={e}
                className="text-sm leading-relaxed p-4 rounded-lg bg-muted/40 border"
              >
                {e}
              </div>
            ))}
          </div>
        </section>

        {/* Recursos + Integrações */}
        <section className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Recursos incluídos</h3>
            <div className="flex flex-wrap gap-1.5">
              {mod.features.map((f) => (
                <Badge key={f} variant="secondary" className="text-[11px]">
                  {f}
                </Badge>
              ))}
            </div>
          </Card>
          {mod.integrations && mod.integrations.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Integrações</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mod.integrations.join(" · ")}
              </p>
            </Card>
          )}
        </section>

        {/* Impacto */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" /> Impacto esperado
          </h2>
          <ul className="space-y-2.5">
            {mod.impact.map((i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span className="text-sm leading-relaxed">{i}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Próximos módulos */}
        <section>
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Combine com outros módulos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULE_DETAILS.filter((m) => m.id !== mod.id)
              .slice(0, 6)
              .map((m) => {
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
                      <div className="font-medium text-sm truncate">
                        {m.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {m.desc}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
          </div>
        </section>
      </div>

      {/* STICKY CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="hidden sm:block flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{mod.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              Resposta em até 1 dia útil. Sem cadastro obrigatório.
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link to="/orcamento">Orçamento</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="gap-2 flex-1 sm:flex-initial bg-gradient-primary"
          >
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="truncate">
                {mod.ctaLabel ?? "Contratar no WhatsApp"}
              </span>
            </a>
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
