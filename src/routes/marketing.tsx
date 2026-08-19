import { createFileRoute } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { MarketingLeadDialog } from "@/components/marketing/ImpulsionandoBrasilFAB";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Handshake,
  Layers3,
  Megaphone,
  MessageCircle,
  Palette,
  Rocket,
  Search,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Impulsionando Brasil + Impulsionando Tecnologia — Estratégia que vira execução" },
      {
        name: "description",
        content:
          "A Impulsionando Brasil desenha estratégia, posicionamento, campanhas, réguas e jornadas. A Impulsionando Tecnologia transforma tudo isso em operação real com Core, Impulsionito, CRM, automações, n8n, omnichannel e dados.",
      },
      { property: "og:title", content: "Impulsionando Brasil + Tecnologia — Juntas, muito mais fortes" },
      {
        property: "og:description",
        content:
          "Estratégia de marketing conectada à execução tecnológica: da captação à conversão, relacionamento, retenção e escala.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/marketing" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Marketing", path: "/marketing" },
      ]),
    ],
  }),
  component: MarketingPage,
});

const STRATEGY_SERVICES = [
  { icon: Briefcase, label: "Gestão estratégica de marketing", interest: "Gestão estratégica de marketing" },
  { icon: Search, label: "Pesquisa de mercado, concorrência e posicionamento", interest: "Pesquisa de mercado e posicionamento" },
  { icon: Target, label: "Persona, público, oferta e proposta de valor", interest: "Persona, público e oferta" },
  { icon: Workflow, label: "Funis, réguas e jornadas", interest: "Funis, réguas e jornadas" },
  { icon: Megaphone, label: "Tráfego pago e mídia", interest: "Tráfego pago" },
  { icon: Users, label: "Social media e conteúdo", interest: "Social media e conteúdo" },
  { icon: Palette, label: "Branding, identidade e posicionamento", interest: "Branding e identidade visual" },
  { icon: Rocket, label: "Lançamentos e perpétuo", interest: "Lançamentos e perpétuo" },
  { icon: Handshake, label: "Afiliados e parceiros", interest: "Gestão de afiliados e parceiros" },
  { icon: ShoppingCart, label: "Oferta, checkout, upsell e cross-sell", interest: "Oferta, checkout, upsell e cross-sell" },
];

const EXECUTION_SERVICES = [
  "CRM e histórico único do cliente",
  "Impulsionito no chat e omnichannel",
  "WhatsApp oficial e canais conectados",
  "Automação e orquestração n8n",
  "Captação de origem, UTM e rastreabilidade",
  "Agenda, tickets, cobrança e jornadas",
  "Dashboards, métricas e inteligência operacional",
  "Integração entre marketing, atendimento, comercial e operação",
];

const JOURNEY = [
  { step: "01", title: "Entender", text: "A Impulsionando Brasil diagnostica negócio, público, concorrência, gargalos e objetivo real." },
  { step: "02", title: "Planejar", text: "Definimos posicionamento, oferta, canais, funil, réguas, conteúdo, mídia, indicadores e jornada." },
  { step: "03", title: "Construir", text: "A Impulsionando Tecnologia transforma a estratégia em páginas, CRM, automações, integrações, agentes e processos." },
  { step: "04", title: "Executar", text: "Campanhas, atendimento, qualificação, agenda, vendas, checkout, onboarding e relacionamento passam a operar conectados." },
  { step: "05", title: "Aprender", text: "O Impulsionito lê resultados, tickets e comportamento, organiza aprendizados e sugere melhorias para o Core." },
  { step: "06", title: "Escalar", text: "O que funciona é refinado, automatizado, medido e multiplicado com segurança." },
];

function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 text-primary" />
            Estratégia + tecnologia + execução
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-5xl">
            Impulsionando Brasil + Impulsionando Tecnologia.
            <span className="text-primary"> Juntas, muito mais fortes.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed">
            A <strong className="text-foreground">Impulsionando Brasil pensa a estratégia</strong>: mercado, posicionamento,
            oferta, conteúdo, campanhas, funis, réguas, jornadas, aquisição, conversão, relacionamento e retenção.
          </p>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed">
            A <strong className="text-foreground">Impulsionando Tecnologia executa essa estratégia</strong> dentro do Core:
            CRM, Impulsionito, omnichannel, automações, n8n, agenda, tickets, dados, integrações e inteligência operacional.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MarketingLeadDialog
              defaultInterest="Diagnóstico de marketing e tecnologia"
              trigger={
                <Button size="lg" className="gap-2">
                  Quero integrar estratégia e execução <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
            <MarketingLeadDialog
              defaultInterest="Falar com o Impulsionito sobre marketing"
              trigger={
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Falar com o Impulsionito
                </Button>
              }
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-7">
            <div className="inline-flex items-center gap-2 text-primary font-medium"><Target className="h-5 w-5" /> Impulsionando Brasil</div>
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold">Pensa, desenha e dirige a estratégia.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              É o braço de marketing e growth. Analisa cenário, mercado, concorrentes, público, proposta de valor e canais.
              Define o que comunicar, para quem, em qual momento, por qual canal e com qual objetivo.
            </p>
          </Card>
          <Card className="p-7">
            <div className="inline-flex items-center gap-2 text-primary font-medium"><Bot className="h-5 w-5" /> Impulsionando Tecnologia</div>
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold">Transforma estratégia em operação real.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              É o braço tecnológico. O Core, o Impulsionito e as integrações executam, registram, acompanham, automatizam e medem
              cada etapa, conectando marketing, atendimento, comercial e operação.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">O marketing que a Impulsionando Brasil estrutura</h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            O melhor da atuação da Impulsionando Brasil agora conectado diretamente à execução do ecossistema tecnológico.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STRATEGY_SERVICES.map((service) => (
              <MarketingLeadDialog
                key={service.label}
                defaultInterest={service.interest}
                trigger={
                  <Card className="p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition group h-full">
                    <service.icon className="h-6 w-6 text-primary mb-3" />
                    <div className="font-medium">{service.label}</div>
                    <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      Quero saber mais <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-medium"><Layers3 className="h-5 w-5" /> A tecnologia executa</div>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold">A estratégia deixa de ser apresentação e passa a funcionar.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A diferença está aqui: a régua desenhada pelo marketing não fica em um documento. Ela entra no sistema, dispara,
              registra resposta, atualiza o CRM, cria tarefa, agenda, cobra, acompanha e alimenta a próxima decisão.
            </p>
          </div>
          <div className="grid gap-3">
            {EXECUTION_SERVICES.map((item) => (
              <Card key={item} className="p-4 flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="text-sm md:text-base">{item}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 text-primary font-medium"><BarChart3 className="h-5 w-5" /> Da estratégia ao aprendizado</div>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold">Uma única jornada, sem quebra entre agência e sistema.</h2>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {JOURNEY.map((item) => (
              <Card key={item.step} className="p-5">
                <div className="text-xs font-semibold text-primary">{item.step}</div>
                <div className="mt-2 text-lg font-semibold">{item.title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold">n8n: estratégia transformada em automação</h2>
        <p className="mt-4 text-muted-foreground max-w-4xl leading-relaxed">
          O n8n é uma camada estratégica da Impulsionando Tecnologia: recebe a lógica definida pela Impulsionando Brasil e a
          transforma em fluxos reais. Recuperação de oportunidade, nutrição, onboarding, lembretes, pesquisas, reativação,
          relacionamento, alertas e tarefas passam a acontecer no tempo certo e com contexto.
        </p>
      </section>

      <section className="border-t bg-primary/[0.04]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">A Impulsionando Brasil pensa. A Impulsionando Tecnologia executa.</h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Estratégia sem execução vira intenção. Tecnologia sem estratégia vira ferramenta. Juntas, criam uma operação que
            capta, converte, atende, relaciona, aprende e escala.
          </p>
          <div className="mt-8 flex justify-center flex-wrap gap-3">
            <MarketingLeadDialog
              defaultInterest="Diagnóstico integrado Marketing + Tecnologia"
              trigger={<Button size="lg">Quero um diagnóstico integrado</Button>}
            />
            <MarketingLeadDialog
              defaultInterest="Falar com o Impulsionito"
              trigger={<Button size="lg" variant="outline">Falar com o Impulsionito</Button>}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
