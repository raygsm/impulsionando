import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Mail,
  MessageCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { COMMERCIAL_NICHE_PLAYBOOK } from "@/data/commercial-niche-playbook";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

const CORE_PILLARS = [
  {
    icon: Target,
    title: "Captação",
    body: "Site, campanhas, indicação, formulários e canais de entrada alimentam uma única visão de cliente, com origem e contexto.",
  },
  {
    icon: Bot,
    title: "Conversão",
    body: "Impulsionito, CRM, tarefas e automações conduzem o lead até a próxima ação sem depender de memória ou planilha.",
  },
  {
    icon: Mail,
    title: "Relacionamento",
    body: "E-mail é o canal ativo homologado hoje para boas-vindas, lembretes, conteúdo, pós-venda, pesquisas e reativação.",
  },
  {
    icon: TrendingUp,
    title: "Fidelização e crescimento",
    body: "Histórico, frequência, ticket, preferências, eventos, benefícios e BI transformam transações em relacionamento recorrente.",
  },
];

const JOURNEY = [
  "O cliente entra por anúncio, site, indicação, QR Code, loja ou atendimento.",
  "A origem é registrada e o perfil começa a ser construído no Core.",
  "Impulsionito conduz perguntas objetivas para entender necessidade e intenção.",
  "CRM, agenda, orçamento, venda, reserva ou atendimento seguem a jornada adequada.",
  "O e-mail transacional e de relacionamento é disparado conforme a régua configurada.",
  "Compra, visita, serviço, evento ou interação atualiza o histórico do cliente.",
  "O gestor acompanha conversão, recorrência, ticket, satisfação e oportunidades de reativação.",
];

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Um ecossistema para captar, vender e fidelizar | Impulsionando" },
      {
        name: "description",
        content:
          "Veja como a Impulsionando conecta captação, CRM, atendimento, automação, operação, relacionamento, fidelização e inteligência para empresas de diferentes segmentos.",
      },
      { property: "og:title", content: "Impulsionando para Empresas" },
      {
        property: "og:description",
        content: "Um ecossistema. Uma inteligência. Todo o seu negócio conectado.",
      },
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
          <div className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-accent/25 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <Badge className="mb-4 border-0 bg-white/15 text-primary-foreground">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Impulsionando para Empresas
            </Badge>
            <h1 className="mx-auto max-w-5xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Um ecossistema. Uma inteligência. Todo o seu negócio conectado.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/85 sm:text-lg">
              Captação, vendas, atendimento, operação, financeiro, automação, relacionamento e inteligência trabalhando como uma única jornada — com o Impulsionito acompanhando cada etapa.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
                onClick={() => openImpulsionito("empresas-diagnostico")}
              >
                Quero ver no meu negócio <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/demo/escolher-nicho">
                  <PlayCircle className="h-4 w-4" /> Escolher meu segmento
                </Link>
              </Button>
            </div>
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Jornada guiada</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> CRM e dados conectados</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Automação e relacionamento</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Recursos mostrados conforme disponibilidade real</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">A jornada completa</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              A maioria das empresas registra vendas. A Impulsionando ajuda a construir relacionamento.
            </h2>
            <p className="mt-4 text-muted-foreground">
              O valor não está em acumular módulos. Está em conectar cada contato, compra, atendimento e oportunidade para que a empresa saiba quem é o cliente, o que aconteceu e qual é o próximo passo.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_PILLARS.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Exemplos reais de negócio</div>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Escolha um segmento e enxergue a perda invisível que pode virar crescimento.
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Cada cenário abaixo parte de uma situação cotidiana. O Impulsionito usa esse contexto para conduzir um diagnóstico específico, em vez de apresentar uma lista genérica de funcionalidades.
                </p>
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/nichos"><Search className="h-4 w-4" /> Ver todos os nichos</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {COMMERCIAL_NICHE_PLAYBOOK.map((niche) => (
                <Card key={niche.slug} className="flex h-full flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="secondary">{niche.label}</Badge>
                      <h3 className="mt-3 text-xl font-semibold">{niche.hiddenLoss}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{niche.scenario}</p>
                  <div className="mt-5 space-y-2">
                    {niche.transformation.slice(0, 4).map((item) => (
                      <div key={item} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/nichos/$slug" params={{ slug: niche.slug }}>{niche.cta}</Link>
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={() => openImpulsionito(`empresas-nicho-${niche.slug}`)}>
                      <MessageCircle className="h-3.5 w-3.5" /> Diagnóstico com Impulsionito
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Do primeiro contato à recorrência</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Uma jornada contínua, não sete ferramentas desconectadas.</h2>
            <div className="mt-7 space-y-4">
              {JOURNEY.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="p-7 sm:p-8">
            <Badge className="mb-3">Impulsionito</Badge>
            <h3 className="text-2xl font-semibold">Ele não deve perguntar “qual módulo você quer?”.</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Ele entende o segmento, tamanho da operação, principal dificuldade, ferramentas atuais e objetivo. A partir disso, demonstra a jornada que faz sentido para aquela empresa e conduz para o próximo passo.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="font-medium">Exemplo de abordagem</div>
              <p className="mt-2 text-muted-foreground">
                “Hoje você sabe quantos clientes compraram, voltaram e deixaram de voltar nos últimos 60 dias? Me conte como sua operação funciona e eu mostro onde a Impulsionando pode reduzir perda e aumentar recorrência.”
              </p>
            </div>
            <Button className="mt-6 w-full gap-2" size="lg" onClick={() => openImpulsionito("empresas-fechamento")}>
              Fazer meu diagnóstico agora <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Saia na frente. Vem Impulsionando.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Veja a demonstração do seu segmento, converse com o Impulsionito e descubra como organizar captação, conversão, relacionamento e fidelização dentro de um único ecossistema.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/demo/escolher-nicho"><PlayCircle className="h-4 w-4" /> Ver minha demonstração</Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => openImpulsionito("empresas-cta-final")}>
                <MessageCircle className="h-4 w-4" /> Falar com o Impulsionito
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
