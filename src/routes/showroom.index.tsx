import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { ArrowRight, Sparkles, PlayCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/showroom/")({
  head: () => ({
    meta: [
      { title: "Showrooms por nicho — Demonstrações navegáveis | Impulsionando" },
      {
        name: "description",
        content:
          "Hub central de showrooms premium da Impulsionando. Explore demonstrações navegáveis por nicho: clínicas, fitness, eventos, imobiliária, restaurantes e mais.",
      },
      { property: "og:title", content: "Showrooms Impulsionando — Demos por nicho" },
      {
        property: "og:description",
        content: "Demonstrações navegáveis, sem cadastro, do ecossistema Impulsionando por segmento.",
      },
    ],
  }),
  component: ShowroomHub,
});

const PREMIUM_AVAILABLE: Record<string, string> = {
  fitness: "/showroom/fitness",
  eventos: "/showroom/eventos",
  clinicas: "/showroom/clinicas",
};

function ShowroomHub() {
  const niches = NICHO_DETAILS.filter((n) => n.slug !== "white-label");

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" /> Showrooms navegáveis
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Veja a plataforma funcionando no seu segmento
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Demonstrações premium, sem cadastro, com dados realistas — agenda, CRM, pagamentos,
              WhatsApp, dashboards e tudo o que sua operação precisa.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/showroom/fitness">
                  <PlayCircle className="mr-2 h-4 w-4" /> Começar pelo Fitness
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/dashboards">Dashboards</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/relatorios">Relatórios</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/integracoes">Integrações</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/automacoes">Automações</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/whatsapp">WhatsApp</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/caixa-unificada">Caixa Unificada</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/agenda">Agenda</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/financeiro">Financeiro</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/crm">CRM</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/pdv">PDV</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/estoque">Estoque</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/marketing">Marketing</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/solucoes">Ver todos os nichos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de nichos */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Escolha um showroom</h2>
            <p className="mt-1 text-muted-foreground">
              Cada showroom simula uma operação real, com dados, telas e fluxos do nicho.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => {
            const Icon = n.icon;
            const liveHref = PREMIUM_AVAILABLE[n.slug];
            const fallback = `/demo/nicho/${n.slug}`;
            const available = Boolean(liveHref);
            return (
              <Card
                key={n.slug}
                className="group flex flex-col p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  {available ? (
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" /> Premium
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> Em breve
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold leading-tight">{n.shortLabel}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {n.cardDesc}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={available ? liveHref! : fallback}>
                      {available ? "Abrir showroom" : "Ver prévia"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Não encontrou seu segmento?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Configuramos a plataforma para qualquer operação de serviços, comércio ou comunidade.
            Fale conosco e receba uma demonstração feita para o seu negócio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
