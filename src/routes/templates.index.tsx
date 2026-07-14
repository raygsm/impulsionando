/**
 * /templates — Feira de empresas fictícias da Impulsionando.
 * Cada card é uma empresa completa e navegável.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { ArrowRight, Sparkles, Store } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listFictionalBrands } from "@/data/fictional-brands/registry";

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Feira de Empresas Fictícias — Impulsionando" },
      { name: "description", content: "Explore empresas fictícias completas construídas com a plataforma Impulsionando. Cada marca tem site, catálogo, contato e painel administrativo navegáveis." },
      { property: "og:title", content: "Feira de Empresas Fictícias — Impulsionando" },
      { property: "og:description", content: "Não são templates: são empresas inteiras. Navegue como cliente e como dono." },
      { property: "og:url", content: "https://impulsionando.com.br/templates" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/templates" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Feira de Empresas", path: "/templates" },
      ]),
    ],
  }),
  component: FictionalBrandsHub,
});

function FictionalBrandsHub() {
  const brands = listFictionalBrands();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <Badge variant="outline" className="gap-1 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Feira de empresas · Impulsionando
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            Não são templates. São empresas.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Cada marca abaixo é uma empresa fictícia construída de ponta a ponta com a Impulsionando —
            site, catálogo, contato e painel administrativo. Entre como cliente. Entre como dono.
            Depois imagine a sua.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/onboarding-site">Quero um site assim <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/demo/templates">Ver demos por plano</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {brands.map((b) => (
              <Link
                key={b.slug}
                to="/templates/$brand"
                params={{ brand: b.slug }}
                className="group rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl hover:border-primary/40 transition-all"
                aria-label={`Entrar no site da ${b.companyName}`}
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden"
                  style={{ background: b.hero.imageGradient }}
                >
                  <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 80% at 80% 20%, rgba(255,255,255,.35), transparent 60%)" }} />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-lg shadow-lg"
                      style={{ background: b.palette.primary, color: b.palette.primaryFg }}
                      dangerouslySetInnerHTML={{ __html: b.logo.mark }}
                    />
                    <span className="text-white/95 text-sm font-semibold tracking-wide">{b.logo.wordmark}</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-white/20 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-white font-semibold">
                      {b.sectorLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                    <span className="text-6xl absolute right-4 bottom-4 opacity-60 drop-shadow-xl" aria-hidden>
                      {b.hero.imageEmoji}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight max-w-md drop-shadow-lg">
                      {b.companyName}
                    </h2>
                    <p className="mt-1 text-sm opacity-90 max-w-md">{b.tagline}</p>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Store className="h-3.5 w-3.5" /> {b.catalog.items.length} itens
                    </span>
                    <span>{b.domainFake}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2"
                    style={{ color: b.palette.primary }}
                  >
                    Entrar no site <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border bg-card p-8 sm:p-10 flex flex-wrap items-center gap-6 justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold">Sua empresa merece estar aqui.</h2>
              <p className="mt-2 text-muted-foreground">
                Em até 14 dias, a Impulsionando entrega para você um site com a mesma profundidade das empresas ao lado — com seu conteúdo, sua marca e seu painel operacional.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/onboarding-site">Iniciar meu rascunho <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
