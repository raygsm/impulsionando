import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import {
  MOTHER_MODULES,
  MOTHER_MODULE_CATEGORIES,
} from "@/data/motherModules";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20conhecer%20os%20m%C3%B3dulos%20da%20Impulsionando.";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos-Mãe — ERP, CRM, Saúde, Eventos, Delivery e mais | Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Catálogo de 14 módulos-mãe: ERP, CRM, Automação, Agenda, Commerce, PDV, Estoque, Saúde, Eventos, Delivery, BI, White Label, Fidelização e Área do Cliente.",
      },
      { property: "og:title", content: "Módulos-Mãe — Impulsionando Tecnologia" },
      {
        property: "og:description",
        content: "14 módulos-mãe que reúnem todos os submódulos, recursos e funcionalidades da plataforma.",
      },
      { property: "og:url", content: "https://sistemas.impulsionando.com.br/modulos" },
    ],
    links: [{ rel: "canonical", href: "https://sistemas.impulsionando.com.br/modulos" }],
  }),
  component: ModulosPage,
});

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ModulosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> 14 módulos-mãe
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Não vendemos recursos soltos.<br />
              Vendemos módulos-mãe que conversam.
            </h1>
            <p className="text-lg text-white/85 max-w-2xl leading-relaxed">
              Cada módulo-mãe reúne dezenas de submódulos, recursos e funcionalidades.
              Você contrata por bloco, escala quando precisar e tudo permanece integrado.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento" search={{ origem: "modulos" }}>
                  Montar meu sistema <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Tirar dúvidas
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK NAV */}
      <section className="border-b border-border bg-card sticky top-16 z-30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto">
          {MOTHER_MODULE_CATEGORIES.map((c) => (
            <a
              key={c}
              href={`#${slug(c)}`}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary hover:text-primary transition-colors"
            >
              {c}
            </a>
          ))}
        </div>
      </section>

      {/* MODULES BY CATEGORY */}
      {MOTHER_MODULE_CATEGORIES.map((cat) => {
        const items = MOTHER_MODULES.filter((m) => m.category === cat);
        if (!items.length) return null;
        return (
          <section
            key={cat}
            id={slug(cat)}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-32"
          >
            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-primary font-semibold">
                {cat}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                Módulos-mãe — {cat}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {items.map((m) => {
                const Icon = m.icon;
                const visibleSubs = m.submodules.slice(0, 12);
                const remaining = m.submodules.length - visibleSubs.length;
                return (
                  <Card key={m.slug} className="p-6 hover:shadow-elegant transition-shadow flex flex-col">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold tracking-tight text-lg">{m.fullName}</div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {m.tagline}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
                      {m.pitch}
                    </p>

                    <div className="mt-5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                        Submódulos e recursos inclusos
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {visibleSubs.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px]"
                          >
                            {s}
                          </span>
                        ))}
                        {remaining > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                            + {remaining} recursos
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Ideal para
                      </span>
                      {m.exampleNiches.map((n) => (
                        <span
                          key={n}
                          className="px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground/80 text-[11px]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>

                    <Button asChild size="sm" variant="outline" className="mt-5 w-full gap-2">
                      <Link
                        to="/orcamento"
                        search={{ origem: `modulos:${m.slug}` }}
                      >
                        Quero este módulo-mãe <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* PLAN MAPPING */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Como os módulos-mãe entram nos planos
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Você não compra recursos soltos. Compra blocos comerciais inteiros.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { t: "Essencial", q: "1 módulo-mãe ativo", d: "Até 3 usuários. Comece pelo bloco que mais dói." },
              { t: "Integrado", q: "2 módulos-mãe ativos", d: "Até 5 usuários. Dois blocos trabalhando juntos." },
              { t: "Avançado", q: "3 módulos-mãe ativos", d: "Até 10 usuários. Operação digital de ponta a ponta." },
              { t: "Sob Medida", q: "Múltiplos módulos-mãe", d: "Usuários sob demanda + White Label." },
            ].map((p) => (
              <Card key={p.t} className="p-6">
                <div className="text-xs uppercase tracking-wider text-primary font-semibold">
                  {p.t}
                </div>
                <div className="text-lg font-semibold tracking-tight mt-1">{p.q}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/planos">Ver planos e preços</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-10 lg:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Não sabe quais módulos-mãe contratar? Nosso briefing decide por você.
            </h2>
            <p className="text-white/85 leading-relaxed">
              Em menos de 1 minuto recomendamos os módulos-mãe certos e o plano ideal para a sua operação.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento" search={{ origem: "modulos:cta" }}>
                  Fazer briefing agora <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/planos">Ver planos e preços</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <CheckCircle2 className="hidden" />
      <PublicFooter />
    </div>
  );
}
