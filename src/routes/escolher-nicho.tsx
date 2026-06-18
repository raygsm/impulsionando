import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Stethoscope, HeartPulse, UtensilsCrossed, Beer, CalendarRange,
  Home, Car, Calculator, Scale, Briefcase, ShoppingBag, Layers,
  ArrowRight, Target, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/escolher-nicho")({
  head: () => ({
    meta: [
      { title: "Escolha seu nicho — Impulsionando Tecnologia" },
      { name: "description", content: "Antes de escolher o plano, diga qual é o seu tipo de negócio. Recomendamos os módulos certos e o plano ideal para a sua operação." },
      { property: "og:title", content: "Escolha seu nicho — Impulsionando" },
      { property: "og:description", content: "Recomendação inteligente de plano e módulos baseada no seu nicho." },
    ],
  }),
  component: PlanosComecarPage,
});

type NichoCard = {
  slug: string;
  label: string;
  desc: string;
  icon: typeof Stethoscope;
};

const NICHOS: NichoCard[] = [
  { slug: "clinicas",          label: "Clínica ou Consultório",   desc: "Agenda, prontuário, portal do paciente e relacionamento.", icon: Stethoscope },
  { slug: "psicologia",        label: "Psicologia e Terapias",    desc: "Agenda, prontuário sigiloso, sessões e pagamento.",         icon: HeartPulse },
  { slug: "bares-restaurantes",label: "Bar ou Restaurante",       desc: "Cardápio digital, QR Code, comanda, CRM e fidelidade.",      icon: UtensilsCrossed },
  { slug: "microcervejarias",  label: "Cervejaria",                desc: "PDV, marketplace B2B, eventos e ações de marca.",            icon: Beer },
  { slug: "eventos",           label: "Eventos",                   desc: "Ingressos, check-in, listas e relacionamento pós-evento.",   icon: CalendarRange },
  { slug: "imobiliaria",       label: "Imobiliária",               desc: "CRM imobiliário, visitas, propostas e portal do cliente.",   icon: Home },
  { slug: "veiculos",          label: "Revenda de Veículos",       desc: "Estoque, leads, propostas e financiamento integrado.",       icon: Car },
  { slug: "contabilidade",     label: "Contabilidade",             desc: "Portal do cliente, obrigações, documentos e financeiro.",    icon: Calculator },
  { slug: "juridico",          label: "Escritório Jurídico",       desc: "CRM jurídico, processos, prazos e portal do cliente.",       icon: Scale },
  { slug: "servicos",          label: "Serviços",                  desc: "Agenda, propostas, contratos, cobrança e relacionamento.",   icon: Briefcase },
  { slug: "ecommerce",         label: "E-commerce",                desc: "Catálogo, pedidos, estoque, CRM e pós-venda automatizado.",  icon: ShoppingBag },
  { slug: "white-label",       label: "White Label",               desc: "Plataforma com sua marca para revender tecnologia.",         icon: Layers },
];

function PlanosComecarPage() {
  const navigate = useNavigate();

  function pick(slug: string) {
    navigate({ to: "/recomendacao/$nicho", params: { nicho: slug } });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-4">
            <Target className="w-3.5 h-3.5" /> Passo 1 de 3 — Nicho
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            Antes de escolher o plano, diga qual é o seu tipo de negócio
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl leading-relaxed">
            Assim conseguimos recomendar os módulos certos, evitar recursos desnecessários
            e montar uma solução que faça sentido para a sua operação.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NICHOS.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.slug}
                type="button"
                onClick={() => pick(n.slug)}
                className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                <Card className="p-6 h-full flex flex-col hover:shadow-elegant hover:-translate-y-0.5 transition-all border-2 hover:border-primary/40">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 shrink-0 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{n.label}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {n.desc}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Ver recomendação <ArrowRight className="w-4 h-4" />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        <Card className="mt-10 p-6 lg:p-8 bg-muted/40 border-dashed">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-semibold">Não encontrou seu nicho?</div>
              <p className="text-sm text-muted-foreground mt-1">
                A plataforma é modular. Veja todos os planos e monte do seu jeito.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/planos">Ver todos os planos</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
