import { Link } from "@tanstack/react-router";
import {
  MessageCircle, ArrowRight, Sparkles, Building2, Layers, UserRound, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20um%20especialista%20da%20Impulsionando.";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO — seletor de público */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-[11px] sm:text-xs">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Grupo Impulsionando · Tecnologia + Marketing</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Impulsionando Tecnologia
              </h1>
              <p className="text-base sm:text-lg text-white/85 leading-relaxed">
                Uma plataforma modular para vender, atender, automatizar, fidelizar e escalar negócios.
              </p>
            </div>

            <div className="mt-8 sm:mt-12 grid gap-5 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
              {/* EMPRESAS */}
              <Card className="group p-5 sm:p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">Empresas</div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Automatize sua operação
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                  Centralize vendas, atendimento, pagamentos, automação e relacionamento em uma única plataforma adaptável ao seu negócio.
                </p>
                <Button asChild className="mt-6 gap-2 bg-gradient-primary shadow-elegant w-full">
                  <Link to="/empresas">
                    <span className="truncate">Quero automatizar minha empresa</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </Button>
              </Card>

              {/* WHITE LABEL */}
              <Card className="group p-5 sm:p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all md:scale-[1.02] md:-translate-y-1 ring-1 ring-accent/40 sm:col-span-2 md:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent inline-flex items-center justify-center mb-4 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider text-accent mb-1">White Label</div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Lance sua plataforma
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                  Lance sua própria plataforma com sua marca, gestão completa e estrutura pronta para comercialização.
                </p>
                <Button asChild className="mt-6 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                  <Link to="/white-label">
                    <span className="truncate">Quero minha plataforma White Label</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </Button>
              </Card>

              {/* CONSUMIDOR */}
              <Card className="group p-5 sm:p-7 flex flex-col bg-white text-foreground hover:shadow-card-hover transition-all sm:col-span-2 md:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-muted text-foreground inline-flex items-center justify-center mb-4 shrink-0">
                  <UserRound className="w-6 h-6" />
                </div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">Consumidor</div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Acesse benefícios
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                  Acesse benefícios, fidelidade, parceiros e experiências oferecidas pelas empresas participantes.
                </p>
                <Button asChild variant="outline" className="mt-6 gap-2 w-full">
                  <Link to="/consumidor">
                    <span className="truncate">Quero acessar benefícios</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </Button>
              </Card>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                <Link to="/demo"><PlayCircle className="w-4 h-4" /> Ver demonstração</Link>
              </Button>
              <Button asChild size="lg" className="btn-whatsapp gap-2 w-full sm:w-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </a>
              </Button>
            </div>
            <p className="text-xs text-white/70 pt-4 text-center">
              Procura apenas marketing digital? Vá direto para a{" "}
              <a href="https://impulsionandobrasil.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-white font-medium">
                Impulsionando Brasil
              </a>.
            </p>
          </div>
        </section>

        {/* PARCERIA GRUPO IMPULSIONANDO */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Parceria Grupo Impulsionando
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Marketing e tecnologia, integrados quando você quiser.
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed text-sm sm:text-base">
              Somos duas empresas do mesmo grupo. Contrate cada uma separadamente ou combine marketing
              e tecnologia em uma operação única, sem retrabalho entre fornecedores.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-6 sm:p-7 flex flex-col">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Impulsionando Brasil</div>
              <div className="text-lg sm:text-xl font-semibold tracking-tight">Marketing, estratégia e crescimento</div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                Social Media, Tráfego Pago, Google Ads, Assessoria de Marketing, funis e lançamentos.
              </p>
              <Button asChild variant="outline" className="mt-5 gap-2">
                <a href="https://impulsionandobrasil.com.br" target="_blank" rel="noopener noreferrer">
                  Acessar Impulsionando Brasil <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </Card>
            <Card className="p-6 sm:p-7 flex flex-col border-primary shadow-elegant ring-1 ring-primary/20">
              <div className="text-xs uppercase tracking-wider text-primary mb-2">Impulsionando Tecnologia · você está aqui</div>
              <div className="text-lg sm:text-xl font-semibold tracking-tight">Sistemas, plataformas e automação</div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">
                CRM, agenda online, WhatsApp automatizado, checkout, PDV, dashboards e integrações sob medida.
              </p>
              <Button asChild className="mt-5 gap-2">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </a>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
