import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, MessageCircle, Globe, Palette, Wallet, Users, ShieldCheck, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20uma%20apresenta%C3%A7%C3%A3o%20da%20plataforma%20White%20Label.";

const RECEIVES = [
  { icon: Layers, title: "Plataforma pronta", desc: "Stack completa com agenda, CRM, financeiro, WhatsApp, PDV, BI e área do cliente." },
  { icon: Globe, title: "Seu domínio", desc: "Use o seu domínio próprio — sistema acessado em sistemas.suamarca.com." },
  { icon: Palette, title: "Seu logotipo e identidade", desc: "Cores, logo, e-mails e área do cliente com a sua marca em todos os pontos." },
  { icon: Wallet, title: "Seus planos e preços", desc: "Você define a tabela, ciclos, módulos por plano e margens." },
  { icon: Users, title: "Seus clientes", desc: "Cadastra, gerencia e cobra direto — sem intermediação." },
  { icon: ShieldCheck, title: "Seu faturamento", desc: "Receba dos seus clientes na sua conta, com gateway próprio se quiser." },
];

const BENEFITS = [
  "Reduz custo de aquisição vendendo um produto recorrente",
  "Aumenta o LTM amarrando clientes em uma operação completa",
  "Posiciona sua marca como tech sem precisar montar time de produto",
  "Escala sem desenvolver: novos módulos chegam prontos",
];

export const Route = createFileRoute("/white-label")({
  head: () => ({
    meta: [
      { title: "White Label — Crie sua própria plataforma SaaS | Impulsionando Tecnologia" },
      { name: "description", content: "Venda sistemas com sua marca, seu domínio e seu faturamento. Plataforma white label completa para agências, consultorias, franqueadoras e grupos empresariais." },
      { property: "og:title", content: "White Label — Sua plataforma SaaS pronta" },
      { property: "og:description", content: "Sua marca, seu domínio, seus clientes, seu faturamento — sem precisar desenvolver." },
      { property: "og:url", content: "https://impulsionando.com.br/white-label" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/white-label" }],
  }),
  component: WhiteLabelPage,
});

function WhiteLabelPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28">
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              <Badge className="bg-white/15 text-primary-foreground border-0">
                <Layers className="w-3.5 h-3.5 mr-1" /> White Label
              </Badge>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight break-words">
                Crie sua própria plataforma SaaS — sem precisar desenvolver.
              </h1>
              <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl">
                Venda sistemas com a sua marca. Controle clientes, faturamento e módulos.
                Para agências, consultorias, franqueadoras e grupos empresariais que querem
                transformar serviço em receita recorrente.
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    Quero minha plataforma White Label <ArrowRight className="w-4 h-4 shrink-0" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
                  <Link to="/demo">
                    <PlayCircle className="w-4 h-4 shrink-0" /> Ver demonstração
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* O QUE VOCÊ RECEBE */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">O que você recebe</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Uma operação SaaS completa entregue chave-na-mão. Você só precisa cuidar do que
              faz melhor: vender e atender seus clientes.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {RECEIVES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="secondary" className="mb-3">Por que White Label</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Transforme serviço em receita recorrente.
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                White Label é um produto completamente diferente de revender uma ferramenta.
                Você é dono da relação, do faturamento e da experiência — a Impulsionando
                fica nos bastidores entregando tecnologia.
              </p>
            </div>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PLANOS / CTA */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Pronto para lançar a sua plataforma?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            Planos White Label montados por volume de clientes, módulos ativos e nível de suporte.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary gap-2 w-full sm:w-auto">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Quero minha plataforma White Label <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Link to="/demo">
                <PlayCircle className="w-4 h-4" /> Ver demonstração
              </Link>
            </Button>
            <Button asChild size="lg" className="btn-whatsapp gap-2 w-full sm:w-auto">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" /> Falar com especialista
              </a>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
