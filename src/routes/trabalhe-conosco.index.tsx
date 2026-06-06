import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Stethoscope, UtensilsCrossed, Building2, Hotel, Scissors, Factory, GraduationCap, Briefcase, ArrowRight, ShoppingCart } from "lucide-react";

export const NICHOS_TALENTOS = [
  { slug: "fitness", label: "Fitness — Academia, CrossFit, Funcional, Personal", icon: Dumbbell, ativo: true },
  { slug: "academias", label: "Academias de Ginástica — Musculação, Cross, Funcional, Pilates, Lutas", icon: Dumbbell, ativo: true },
  { slug: "supermercados", label: "Supermercados — Atacarejo, Vizinhança, Hortifruti, Conveniência", icon: ShoppingCart, ativo: true },
  { slug: "saude", label: "Saúde — Clínicas, Consultórios", icon: Stethoscope, ativo: false },
  { slug: "gastronomia", label: "Gastronomia — Restaurantes, Bares, Cervejarias", icon: UtensilsCrossed, ativo: false },
  { slug: "hospitalidade", label: "Hospitalidade — Hotéis, Airbnb, Eventos", icon: Hotel, ativo: false },
  { slug: "beleza", label: "Beleza — Salões, Barbearias, Estética", icon: Scissors, ativo: false },
  { slug: "industria", label: "Indústria & Distribuição", icon: Factory, ativo: false },
  { slug: "educacao", label: "Educação & Franquias", icon: GraduationCap, ativo: false },
  { slug: "servicos", label: "Prestadores de Serviço", icon: Briefcase, ativo: false },
  { slug: "corporativo", label: "Corporativo Impulsionando (vagas internas)", icon: Building2, ativo: true },
] as const;

export type NichoSlug = (typeof NICHOS_TALENTOS)[number]["slug"];

export const Route = createFileRoute("/trabalhe-conosco/")({
  head: () => ({
    meta: [
      { title: "Trabalhe conosco — Banco de Talentos | Impulsionando Tecnologia" },
      { name: "description", content: "Banco de talentos universal: candidate-se para vagas em Fitness, Saúde, Gastronomia, Hospitalidade, Beleza, Indústria, Educação, Serviços ou no time Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/trabalhe-conosco" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/trabalhe-conosco" }],
  }),
  component: TrabalheConosco,
});

function TrabalheConosco() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <section className="border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Badge variant="outline" className="mb-4">Banco de Talentos</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Trabalhe conosco — escolha o seu nicho.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Cadastre seu currículo uma vez e fique disponível para todas as oportunidades do ecossistema:
            unidades parceiras, franquias e o próprio time Impulsionando.
          </p>
        </div>
      </section>

      <section className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NICHOS_TALENTOS.map((n) => {
            const Icon = n.icon;
            return (
              <Card key={n.slug} className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold leading-tight">{n.label}</h3>
                </div>
                <div className="mt-auto pt-2">
                  {n.ativo ? (
                    <Button asChild className="w-full gap-2">
                      <Link to="/trabalhe-conosco/$nicho" params={{ nicho: n.slug }}>
                        Candidatar-se <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>Em breve</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
