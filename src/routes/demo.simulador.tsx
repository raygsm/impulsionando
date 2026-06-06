import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador de ROI e economia de tempo — Demo Impulsionando" },
      {
        name: "description",
        content:
          "Simule o ROI e a economia de horas operacionais de cada módulo da Impulsionando: CRM, WhatsApp, Afiliados, Checkout, Eventos e Agenda.",
      },
      { property: "og:title", content: "Simulador de ROI — Impulsionando" },
      {
        property: "og:description",
        content: "Quanto seu negócio ganha por mês com automação? Simule por módulo.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/simulador" }],
  }),
  component: DemoSimulador,
});

function DemoSimulador() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="bg-gradient-primary mb-3">
            <Sparkles className="w-3 h-3 mr-1" /> Recurso surpresa demo
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simulador de ROI & economia de tempo
          </h1>
          <p className="mt-3 text-muted-foreground">
            Mexa os sliders e veja em tempo real o ganho mensal estimado e as horas
            economizadas por módulo. Use como guia de conversa comercial.
          </p>
        </div>

        <RoiSimulator />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-gradient-primary">
            <Link to="/demo/modulos">Ver vitrine de módulos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/orcamento" search={{ origem: "demo:simulador" } as never}>
              Pedir orçamento <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
