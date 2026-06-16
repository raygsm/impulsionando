import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, MessageCircle, Stethoscope, Building2, UtensilsCrossed, Dumbbell, Car, Briefcase, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20automatizar%20meu%20neg%C3%B3cio%20com%20a%20Impulsionando.";

type SegmentCard = {
  slug: string;
  nichoSlug: string;
  title: string;
  icon: React.ElementType;
  modules: string[];
  blurb: string;
};

const SEGMENTS: SegmentCard[] = [
  {
    slug: "clinica",
    nichoSlug: "clinicas",
    title: "Clínica",
    icon: Stethoscope,
    modules: ["Agenda", "Teleconsulta", "CRM", "Financeiro", "WhatsApp"],
    blurb: "Reduza faltas, organize o prontuário e tenha lembretes automáticos no WhatsApp.",
  },
  {
    slug: "imobiliaria",
    nichoSlug: "imobiliaria",
    title: "Imobiliária",
    icon: Building2,
    modules: ["Captação", "CRM", "Visitas", "Funil", "IA Comercial"],
    blurb: "Captação, qualificação e visitas em um funil único, com IA que responde leads 24h.",
  },
  {
    slug: "restaurante",
    nichoSlug: "bares-restaurantes",
    title: "Restaurante",
    icon: UtensilsCrossed,
    modules: ["Delivery", "PDV", "Cupons", "Fidelidade", "WhatsApp"],
    blurb: "Pedido direto, PDV completo, fidelização e cupons sem depender de marketplace.",
  },
  {
    slug: "academia",
    nichoSlug: "fitness",
    title: "Academia",
    icon: Dumbbell,
    modules: ["Planos", "Avaliações", "Agenda", "Financeiro"],
    blurb: "Matrículas, avaliações físicas, turmas e cobrança recorrente sem retrabalho.",
  },
  {
    slug: "concessionaria",
    nichoSlug: "concessionarias",
    title: "Concessionária",
    icon: Car,
    modules: ["Estoque", "CRM", "Pós-venda", "Leads"],
    blurb: "Estoque integrado ao CRM e pós-venda automatizado para recompra e indicações.",
  },
  {
    slug: "servicos",
    nichoSlug: "servicos",
    title: "Prestador de Serviços",
    icon: Briefcase,
    modules: ["Orçamentos", "Agenda", "CRM", "Financeiro"],
    blurb: "Orçamentos, follow-up e cobrança em um único fluxo — do primeiro contato ao recebimento.",
  },
  {
    slug: "comercio",
    nichoSlug: "ecommerce",
    title: "Comércio",
    icon: Store,
    modules: ["PDV", "Estoque", "Recompra", "Fidelidade"],
    blurb: "PDV, controle de estoque e programa de recompra com cupons e clube de vantagens.",
  },
];

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Para Empresas — Sistemas por segmento | Impulsionando Tecnologia" },
      { name: "description", content: "Sistema sob medida por segmento: clínica, imobiliária, restaurante, academia, concessionária, prestadores de serviço e comércio. Veja a demonstração do seu nicho." },
      { property: "og:title", content: "Para Empresas — Impulsionando Tecnologia" },
      { property: "og:description", content: "Escolha seu segmento e veja a demo do sistema completo." },
      { property: "og:url", content: "https://impulsionando.com.br/empresas" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/empresas" }],
  }),
  component: EmpresasPage,
});

function EmpresasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-4">Para Empresas</Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Escolha seu segmento
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              A plataforma é a mesma, mas cada nicho recebe módulos, telas e automações desenhados
              para a realidade do seu mercado.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.slug} className="p-5 sm:p-8 flex flex-col hover:shadow-card-hover transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{s.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.modules.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[11px]">{m}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed flex-1">
                    {s.blurb}
                  </p>
                  <div className="flex flex-col gap-2 mt-6">
                    <Button asChild className="gap-2 bg-gradient-primary w-full">
                      <Link to="/nichos/$slug" params={{ slug: s.nichoSlug }}>
                        <PlayCircle className="w-4 h-4 shrink-0" /> Ver Demonstração
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link to="/nichos/$slug" params={{ slug: s.nichoSlug }}>
                        Ver como funciona <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Não encontrou seu segmento?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              A Impulsionando atende mais de 20 nichos, do consultório ao distribuidor B2B.
              Fale com um especialista e monte sua operação sob medida.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
                <Link to="/orcamento">Simular Meu Projeto <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" className="btn-whatsapp gap-2 w-full sm:w-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com Especialista
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
