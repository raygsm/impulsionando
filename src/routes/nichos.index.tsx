import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { WhatsAppBlock } from "@/components/marketing/WhatsAppBlock";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";

const WA_HOME =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20escolher%20o%20meu%20nicho%20e%20conhecer%20a%20Impulsionando.";

export const Route = createFileRoute("/nichos/")({
  head: () => ({
    meta: [
      { title: "Soluções por nicho — Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "Clínicas, bares e restaurantes, microcervejarias, fornecedores, serviços, e-commerce, fitness e White Label. Escolha seu nicho e veja como a plataforma resolve.",
      },
      { property: "og:title", content: "Soluções por nicho — Impulsionando Tecnologia" },
      {
        property: "og:description",
        content:
          "Cada nicho com suas dores, jornada prática, módulos recomendados e demonstração pronta.",
      },
    ],
  }),
  component: NichosIndex,
});

function NichosIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-4">
            <Target className="w-3.5 h-3.5" /> Soluções por nicho
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            Escolha o seu nicho. Veja a plataforma funcionando para a sua realidade.
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-3xl leading-relaxed">
            Cada nicho com dores próprias, jornada prática, módulos recomendados e demonstração pronta —
            sem promessa genérica.
          </p>
        </div>
      </section>

      {/* GRID DE NICHOS — agrupado por categoria-mãe (Saúde primeiro) */}
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        {(() => {
          const CATEGORIAS_NICHO: { label: string; description: string; slugs: string[] }[] = [
            {
              label: "Saúde, Bem-estar e Performance",
              description:
                "Clínicas, médicos, dentistas, fisioterapeutas, academias, boxes, personal trainers, pilates e yoga.",
              slugs: ["clinicas", "fitness"],
            },
            {
              label: "Alimentação, Bebidas e Experiências",
              description:
                "Bares, restaurantes, delivery, pizzarias, hamburguerias, microcervejarias, fornecedores e eventos.",
              slugs: ["bares-restaurantes", "microcervejarias", "fornecedores"],
            },
            {
              label: "Serviços, Educação e Atendimento",
              description:
                "Prestadores, consultorias, escolas, cursos, salões, barbearias, estéticas e atendimento recorrente.",
              slugs: ["servicos"],
            },
            {
              label: "Varejo, E-commerce e Produtos",
              description:
                "Lojas físicas, e-commerce, catálogos digitais, clube de vantagens e recompra.",
              slugs: ["ecommerce"],
            },
            {
              label: "White Label e Parceiros",
              description:
                "Agências, integradores, revendedores e consultorias que vendem tecnologia com marca própria.",
              slugs: ["white-label"],
            },
          ];

          return CATEGORIAS_NICHO.map((cat) => {
            const items = cat.slugs
              .map((s) => NICHO_DETAILS.find((n) => n.slug === s))
              .filter((n): n is (typeof NICHO_DETAILS)[number] => !!n);
            if (items.length === 0) return null;
            return (
              <div key={cat.label}>
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{cat.label}</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{cat.description}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Card key={n.slug} className="p-6 hover:shadow-elegant transition-shadow flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="font-semibold tracking-tight leading-tight">{n.shortLabel}</div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{n.cardDesc}</p>
                        <div className="mt-4 flex gap-2">
                          <Button asChild size="sm" className="flex-1 gap-1.5 bg-gradient-primary">
                            <Link to="/nichos/$slug" params={{ slug: n.slug }}>
                              Ver nicho <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                          {n.demoRoute && (
                            <Button asChild size="sm" variant="outline">
                              <Link to={n.demoRoute}>Demo</Link>
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        <div className="pt-4">
          <WhatsAppBlock />
        </div>


        <Card className="mt-10 p-8 lg:p-10 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
              Não encontrou seu nicho?
            </h2>
            <p className="text-white/85 leading-relaxed">
              A plataforma é modular. Fale com a gente que montamos a configuração ideal para o seu
              modelo de negócio.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <a href={WA_HOME} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/orcamento">Montar orçamento</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
