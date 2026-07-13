/**
 * /vitrine — Hub de templates (front-end) por macro-nicho.
 *
 * Cada card é um exemplo do que a Impulsionando entrega para aquele
 * segmento. Clientes novos podem começar por um template e apenas
 * ajustar imagens e conteúdos.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { VITRINE_TEMPLATES } from "@/data/vitrine-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/vitrine/")({
  head: () => ({
    meta: [
      { title: "Vitrine de Templates — Impulsionando" },
      { name: "description", content: "Templates de front-end por macro-nicho: exemplos reais do que a Impulsionando entrega em Saúde, Alimentação, Imobiliário, Serviços, Educação, Eventos, Varejo e Fornecedores B2B." },
      { property: "og:title", content: "Vitrine de Templates por Nicho — Impulsionando" },
      { property: "og:description", content: "Sites prontos por macro-nicho para inspirar sua próxima marca." },
      { property: "og:url", content: "https://impulsionando.com.br/vitrine" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/vitrine" }],
  }),
  component: VitrineHub,
});

function VitrineHub() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-8">
          <Badge variant="outline" className="mb-3 gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Vitrine · Templates por macro-nicho
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            Um exemplo de front-end para cada segmento
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Explore templates navegáveis. São exemplos do que entregamos —
            você contrata, troca imagens e conteúdos, e o site já nasce com a
            operação Impulsionando por trás.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VITRINE_TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <article
                  key={t.macro}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/40 transition"
                >
                  <Link
                    to="/vitrine/$macro"
                    params={{ macro: t.macro }}
                    className="block"
                    aria-label={`Abrir template ${t.templateName}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={t.hero.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-90">
                          <span
                            className="grid h-6 w-6 place-items-center rounded"
                            style={{ background: t.palette.accent }}
                            aria-hidden
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {t.label}
                        </div>
                        <h2 className="mt-2 font-serif text-xl font-semibold leading-tight">
                          {t.templateName}
                        </h2>
                      </div>
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {t.hero.subtitle}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button asChild size="sm" className="gap-1">
                        <Link to="/vitrine/$macro" params={{ macro: t.macro }}>
                          Ver template <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {t.liveUrl && (
                        <Button asChild size="sm" variant="outline" className="gap-1">
                          <Link to={t.liveUrl}>
                            Versão real <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
