import { createFileRoute } from "@tanstack/react-router";
import { MarketingLeadDialog } from "@/components/marketing/ImpulsionandoBrasilFAB";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Palette, Megaphone, Target, Users, Briefcase, ArrowRight, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Impulsionando Brasil — Marketing, Marca e Estratégia" },
      { name: "description", content: "Braço parceiro de marketing da Impulsionando Tecnologia: identidade visual, social media, tráfego pago, lançamentos e assessoria híbrida." },
      { property: "og:title", content: "Impulsionando Brasil — Marketing que escala" },
      { property: "og:description", content: "Marketing sem estrutura não escala. Estrutura sem marketing não cresce." },
    ],
  }),
  component: MarketingPage,
});

const SERVICES = [
  { icon: Briefcase, label: "Gestão de marketing", interest: "Gestão de marketing" },
  { icon: Palette, label: "Identidade visual & design", interest: "Identidade visual" },
  { icon: Megaphone, label: "Social media", interest: "Social media" },
  { icon: Target, label: "Tráfego pago", interest: "Tráfego pago" },
  { icon: Sparkles, label: "Lançamentos digitais", interest: "Lançamento digital" },
  { icon: Users, label: "Assessoria híbrida", interest: "Assessoria híbrida" },
];

const CTAS = [
  "Quero estruturar meu marketing",
  "Quero falar com a Impulsionando Brasil",
  "Preciso de identidade visual ou design",
  "Quero tráfego pago",
  "Quero social media",
  "Quero assessoria de marketing",
];

function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 text-primary" />
            Braço parceiro da Impulsionando Tecnologia
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Impulsionando <span className="text-primary">Brasil</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Marketing sem estrutura não escala. Estrutura sem marketing não cresce.
          </p>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            A Impulsionando Brasil organiza processos, sistemas, atendimento, comercial e marketing para
            transformar empresas em operações previsíveis, estruturadas e escaláveis.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MarketingLeadDialog
              defaultInterest="Quero estruturar meu marketing"
              trigger={
                <Button size="lg" className="gap-2">
                  Quero estruturar meu marketing <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
            <MarketingLeadDialog
              defaultInterest="Falar com a Impulsionando Brasil"
              trigger={
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Falar agora
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold">O que fazemos</h2>
        <p className="mt-2 text-muted-foreground">
          Atuação integrada entre marketing, gestão, atendimento, comercial, processos e tecnologia.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((s) => (
            <MarketingLeadDialog
              key={s.label}
              defaultInterest={s.interest}
              trigger={
                <Card className="p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition group">
                  <s.icon className="h-6 w-6 text-primary mb-3" />
                  <div className="font-medium">{s.label}</div>
                  <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    Quero saber mais <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              }
            />
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">Marketing + Operação, no mesmo time</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm md:text-base text-muted-foreground leading-relaxed">
            <p>
              Enquanto a <strong className="text-foreground">Impulsionando Tecnologia</strong> entrega o
              sistema operacional do seu negócio — CRM, agenda, financeiro, atendimento, automações — a
              <strong className="text-foreground"> Impulsionando Brasil</strong> cuida da marca, da
              comunicação e da geração de demanda que abastece esse sistema.
            </p>
            <p>
              É marketing pensado para empresa estruturada: tráfego conectado ao CRM, identidade visual
              alinhada ao produto, social media com calendário e processo, e assessoria que entende
              comercial, atendimento e operação.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold">Por onde começar</h2>
        <p className="mt-2 text-muted-foreground">Clique no que faz sentido pra você agora.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CTAS.map((label) => (
            <MarketingLeadDialog
              key={label}
              defaultInterest={label}
              trigger={
                <Button variant="outline" size="lg" className="justify-between w-full h-auto py-4 text-left">
                  <span className="font-medium">{label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>
              }
            />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-foreground">Impulsionando Brasil</div>
            <div>Braço parceiro de marketing da Impulsionando Tecnologia.</div>
          </div>
          <MarketingLeadDialog
            defaultInterest="Footer institucional"
            trigger={<Button size="sm">Falar com o time</Button>}
          />
        </div>
      </footer>
    </div>
  );
}
