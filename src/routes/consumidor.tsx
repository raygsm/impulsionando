import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gift, Ticket, Sparkles, Users, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/consumidor")({
  head: () => ({
    meta: [
      { title: "Consumidor — Benefícios, fidelidade e experiências | Impulsionando" },
      { name: "description", content: "Acesse benefícios, programas de fidelidade, cupons, eventos e experiências oferecidos pelas empresas participantes da rede Impulsionando." },
      { property: "og:title", content: "Área do Consumidor — Impulsionando" },
      { property: "og:description", content: "Benefícios, fidelidade e experiências de empresas participantes." },
      { property: "og:url", content: "https://impulsionando.com.br/consumidor" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/consumidor" }],
  }),
  component: ConsumidorPage,
});

const SECTIONS = [
  {
    icon: Gift,
    title: "Benefícios",
    desc: "Descontos, cashback e vantagens exclusivas das empresas parceiras — direto na sua área pessoal.",
  },
  {
    icon: Users,
    title: "Fidelidade e Parceiros",
    desc: "Programas de pontos, clube de vantagens e rede de parceiros conectados à plataforma.",
  },
  {
    icon: Ticket,
    title: "Eventos e Experiências",
    desc: "Compra de ingressos, check-in digital, transferência de titularidade e experiências oferecidas pelas empresas participantes.",
  },
];

function ConsumidorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Consumidor
            </Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Acesse benefícios das empresas participantes
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              Fidelidade, descontos, eventos, agendas, pedidos e indicações em um só lugar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                <Link to="/vitrine">
                  Explorar parceiros <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
                <Link to="/clube">
                  <LogIn className="w-4 h-4" /> Acessar minha área
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SEÇÕES */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 sm:p-7 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Sua área pessoal te espera
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Acesse benefícios, histórico de pedidos, agendamentos, cupons e parceiros das empresas que você já se relaciona.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
                <Link to="/auth">
                  Quero acessar benefícios <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
