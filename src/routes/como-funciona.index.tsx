import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  MessageCircle,
  KanbanSquare,
  Calendar,
  CreditCard,
  Sparkles,
  BarChart3,
  TrendingUp,
  Repeat,
  HeartHandshake,
  ArrowRight,
  Dumbbell,
  Stethoscope,
  Home,
  Utensils,
} from "lucide-react";

export const Route = createFileRoute("/como-funciona/")({
  head: () => ({
    meta: [
      { title: "Como funciona a Impulsionando — do lead à retenção" },
      {
        name: "description",
        content:
          "Entenda em 10 passos como a plataforma Impulsionando trabalha pelo seu negócio: captação, CRM, agenda, pagamento, execução, retenção e crescimento.",
      },
      { property: "og:title", content: "Como funciona a Impulsionando" },
      {
        property: "og:description",
        content:
          "Lead → CRM → Agenda → Pagamento → Execução → Retenção. Uma única plataforma para operar todo o ciclo do seu cliente.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://impulsionando.com.br/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/como-funciona" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Como funciona a Impulsionando",
          description:
            "Fluxo operacional completo de captação, conversão, execução e retenção de clientes.",
          step: [
            "Captura de lead multicanal",
            "Contato automático via WhatsApp",
            "Qualificação no CRM",
            "Agendamento",
            "Pagamento",
            "Execução do serviço",
            "Relacionamento pós-venda",
            "Retenção",
            "Relatórios",
            "Crescimento",
          ].map((n, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: n,
          })),
        }),
      },
    ],
  }),
  component: ComoFuncionaHub,
});

const STEPS = [
  { icon: UserPlus, t: "1. Captação", d: "Formulários, Google Meu Negócio, Instagram, indicação e QR entram direto no CRM." },
  { icon: MessageCircle, t: "2. Contato", d: "WhatsApp automático em segundos, régua de boas-vindas e envio de materiais." },
  { icon: KanbanSquare, t: "3. CRM", d: "Funil visual, score de probabilidade e atividades organizadas por consultor." },
  { icon: Calendar, t: "4. Agendamento", d: "Confirmação imediata e lembretes automáticos por WhatsApp e e-mail." },
  { icon: CreditCard, t: "5. Pagamento", d: "Pix, cartão recorrente, boleto ou dinheiro. Aprovado, o serviço é liberado." },
  { icon: Sparkles, t: "6. Execução", d: "Operação diária: agenda, atendimento, estoque, PDV, contratos e documentos." },
  { icon: HeartHandshake, t: "7. Relacionamento", d: "NPS, aniversários, marcos e conteúdo automático — a plataforma cuida do pós." },
  { icon: Repeat, t: "8. Retenção", d: "Score de risco, gatilhos de reativação e ofertas personalizadas." },
  { icon: BarChart3, t: "9. Relatórios", d: "MRR, churn, ocupação, ticket médio e performance por equipe em tempo real." },
  { icon: TrendingUp, t: "10. Crescimento", d: "Multi-unidade, franquias e novas modalidades sem refazer o sistema." },
];

const VERTICALS = [
  { to: "/como-funciona/fitness", label: "Fitness", icon: Dumbbell, desc: "Academias, CrossFit, funcional e personal." },
  { to: "/showroom/clinicas", label: "Clínicas & Saúde", icon: Stethoscope, desc: "Consultórios, clínicas e profissionais liberais." },
  { to: "/showroom/franquias", label: "Imobiliárias", icon: Home, desc: "Imóveis, locação e administração." },
  { to: "/showroom/index", label: "Food service", icon: Utensils, desc: "Restaurantes, bares e delivery." },
];

function ComoFuncionaHub() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center space-y-5">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Como funciona a Impulsionando
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Uma única plataforma que trabalha pelo seu negócio do primeiro contato do lead até
              a fidelização — sem juntar 10 ferramentas diferentes.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link to="/orcamento">Falar com um consultor</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom">Ver a plataforma em ação</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
            O fluxo completo em 10 passos
          </h2>
          <p className="text-muted-foreground text-center mt-2 max-w-2xl mx-auto">
            Cada passo já vem conectado ao próximo. Você configura uma vez e a plataforma cuida do
            resto.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.t} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold">{s.t}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{s.d}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
              Veja como funciona no seu segmento
            </h2>
            <p className="text-muted-foreground text-center mt-2 max-w-2xl mx-auto">
              Cada vertical tem uma jornada específica dentro da mesma plataforma.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {VERTICALS.map((v) => {
                const Icon = v.icon;
                return (
                  <Card key={v.to} className="p-5 hover:border-primary/40 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold mt-3">{v.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
                    <Link
                      to={v.to as "/como-funciona/fitness"}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4"
                    >
                      Ver jornada <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Pronto para ver funcionando no seu negócio?
          </h2>
          <p className="text-muted-foreground">
            Receba uma proposta personalizada com plano, módulos e integrações do seu segmento.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/orcamento">Solicitar orçamento</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
