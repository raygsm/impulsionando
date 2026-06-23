import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Sparkles, ArrowRight, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Impulsionando Tecnologia" },
      { name: "description", content: "Quem somos, missão, visão e valores da Impulsionando Tecnologia. Sistemas inteligentes para empresas que querem crescer com controle." },
      { property: "og:title", content: "Sobre — Impulsionando Tecnologia" },
      { property: "og:description", content: "A Impulsionando Tecnologia transforma estratégia em operação real através de sistemas, automação e integrações." },
      { property: "og:url", content: "https://impulsionando.com.br/sobre" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/sobre" }],
  }),
  component: SobrePage,
});

const WHATSAPP_URL = "https://wa.me/5521993075000";

function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Quem somos
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Tecnologia que transforma operação em resultado
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A <strong>Impulsionando Tecnologia</strong> é a divisão de sistemas, automação e
              integrações do ecossistema Impulsionando. Construímos plataformas modulares que
              organizam o dia a dia da empresa — da agenda ao caixa, do CRM ao dashboard — para
              que gestores possam decidir com clareza e crescer com controle.
            </p>
            <p className="text-base text-accent font-semibold">O limite é onde você quiser chegar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold">Missão</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Entregar sistemas inteligentes que simplifiquem a gestão, automatizem rotinas e
                gerem dados confiáveis para decisões mais rápidas e precisas.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold">Visão</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ser a plataforma de tecnologia de referência para pequenas e médias empresas
                brasileiras que querem profissionalizar a operação sem perder agilidade.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold">Valores</h2>
              <ul className="text-sm text-muted-foreground space-y-1 leading-relaxed">
                <li>• Clareza antes de complexidade</li>
                <li>• Dado confiável acima de achismo</li>
                <li>• Atendimento humano e direto</li>
                <li>• Tecnologia a serviço do negócio</li>
              </ul>
            </Card>
          </div>

          <Card className="p-8 space-y-4 bg-card/50">
            <h2 className="text-2xl font-bold">O que fazemos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Desenvolvemos sistemas modulares para agenda online, CRM, vendas, financeiro,
              estoque, BI e automação no WhatsApp. Cada empresa escolhe os módulos que precisa
              e cresce contratando novos módulos sob demanda — sem refazer integração, sem
              perder histórico, sem trocar de plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A Impulsionando Tecnologia é parte do grupo <strong>Impulsionando Brasil</strong>,
              que atua também em marketing, estratégia, tráfego pago, social media e funis de
              conversão. Se você precisa de estratégia de marketing, acesse a Impulsionando
              Brasil. Se você precisa do sistema que sustenta a operação, está no lugar certo.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="bg-gradient-primary shadow-elegant">
                <Link to="/orcamento">Quero criar meu sistema <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/modulos">Ver módulos</Link>
              </Button>
              <Button asChild className="btn-whatsapp">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
