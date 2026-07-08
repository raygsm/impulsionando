import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  PlayCircle,
  MessageCircle,
  Globe,
  Palette,
  Wallet,
  Users,
  ShieldCheck,
  Layers,
  Rocket,
  TrendingUp,
  Crown,
  Building2,
  BarChart3,
  KeyRound,
  Lock,
  LifeBuoy,
  Receipt,
  Store,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import {
  TenantHero,
  FeatureGrid,
  StatGrid,
  TestimonialGrid,
  TrustBadges,
  FaqAccordion,
  CtaBlock,
  SectionHeader,
  StepList,
  buildFaqJsonLd,
  type FaqItem,
} from "@/components/impulsionando";

const WHATSAPP_URL =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20uma%20apresenta%C3%A7%C3%A3o%20da%20plataforma%20White%20Label.";

/* --------------------------------- Dados --------------------------------- */

const RECEIVES = [
  { icon: Layers, title: "Plataforma pronta", description: "Stack completa com agenda, CRM, financeiro, WhatsApp, PDV, BI e área do cliente." },
  { icon: Globe, title: "Seu domínio", description: "Use o seu domínio próprio — sistema acessado em sistemas.suamarca.com." },
  { icon: Palette, title: "Sua identidade", description: "Logotipo, paleta, e-mails transacionais e área do cliente com a sua marca em todos os pontos." },
  { icon: Wallet, title: "Seus planos e preços", description: "Você define a tabela, ciclos, módulos por plano e margens." },
  { icon: Users, title: "Seus clientes", description: "Cadastra, gerencia e cobra direto — sem intermediação." },
  { icon: ShieldCheck, title: "Seu faturamento", description: "Receba dos seus clientes na sua conta, com gateway próprio se quiser." },
];

const PARTNER_STACK = [
  { icon: Building2, title: "Multi-tenant isolado", description: "Cada cliente-final tem dados, usuários, permissões, cobrança e branding próprios — sem vazamento entre parceiros." },
  { icon: KeyRound, title: "Perfis & permissões", description: "Modelos reutilizáveis de acesso aplicáveis em segundos a qualquer cliente do seu portfólio." },
  { icon: Boxes, title: "Módulos por plano", description: "Ative agenda, CRM, PDV, BI, WhatsApp e mais por cliente/plano — com limites por volume." },
  { icon: BarChart3, title: "Relatórios consolidados", description: "MRR, churn, NPS e uso por cliente, nicho e plano — dashboard executivo do parceiro." },
  { icon: Receipt, title: "Financeiro do parceiro", description: "Cobrança recorrente dos seus clientes, split, extrato e conciliação — na sua conta." },
  { icon: LifeBuoy, title: "Suporte white-label", description: "Sua equipe atende com sua marca; nossa engenharia entra apenas via escalonamento." },
  { icon: Store, title: "Vitrine própria", description: "Sua página de captação com seus planos, cases e nichos-modelo do ecossistema." },
  { icon: Lock, title: "Isolamento entre parceiros", description: "Cada parceiro enxerga apenas o próprio portfólio — arquitetura multi-tenant nativa." },
];

const STEPS = [
  { number: "1", title: "Setup da marca", description: "Você entrega logo, cores e domínio. Publicamos sua plataforma em até 48h." },
  { number: "2", title: "Definição de planos", description: "Monte 2 a 4 planos com módulos, limites e preços da sua tabela." },
  { number: "3", title: "Onboarding do 1º cliente", description: "Seu 1º cliente entra assistido — replicamos o padrão para os demais." },
  { number: "4", title: "Escala guiada", description: "Cada novo cliente herda o padrão. Você foca em vender; nós entregamos a tecnologia." },
];

const STATS = [
  { value: "48h", label: "para publicação" },
  { value: "100%", label: "marca própria" },
  { value: "8", label: "verticais modelo" },
  { value: "0", label: "linha de código" },
];

const TESTIMONIALS = [
  { name: "Agência de marketing", role: "Portfólio de 40 clientes B2B", text: "Transformei serviço em recorrência. Hoje 30% da receita da agência é White Label Impulsionando." },
  { name: "Consultoria de saúde", role: "Rede de 12 clínicas", text: "Substituí três SaaS por uma plataforma única com a nossa marca. As clínicas amaram." },
  { name: "Franqueadora regional", role: "24 franqueados", text: "Cada franqueado agora tem PDV, CRM e agenda no padrão da franquia — sem projeto sob medida." },
];

const TRUST: { title: string; description?: string }[] = [
  { title: "LGPD & isolamento", description: "Dados de cada cliente-final isolados por RLS multi-tenant." },
  { title: "SSO & MFA", description: "Login corporativo e 2º fator no console do parceiro." },
  { title: "Uptime 99,9%", description: "Infra elástica, backups automáticos e monitoramento 24×7." },
  { title: "Roadmap incluso", description: "Novos módulos chegam prontos — sem mensalidade extra de evolução." },
];

const FAQS: FaqItem[] = [
  { question: "Quem é dono da relação com o cliente?", answer: "Você. O White Label mantém 100% da relação comercial, financeira e de suporte com o cliente-final sob a sua marca." },
  { question: "Posso usar meu próprio domínio?", answer: "Sim. Configuramos sistemas.suamarca.com (ou o subdomínio que preferir) com SSL e e-mails transacionais assinados pela sua marca." },
  { question: "E o faturamento dos meus clientes?", answer: "Você define preços, ciclos e cobra pelos seus meios. Suportamos gateway próprio (Stripe, Mercado Pago, PagSeguro etc.) ou repasse consolidado." },
  { question: "Quantos módulos posso ativar por cliente?", answer: "Todos os módulos do ecossistema estão disponíveis. Você escolhe o mix por plano e por cliente, com limites e permissões finas." },
  { question: "Um parceiro enxerga outro parceiro?", answer: "Não. Arquitetura multi-tenant garante isolamento total: cada parceiro só vê seu portfólio; cada cliente-final só vê seus dados." },
  { question: "Consigo migrar clientes que já uso hoje?", answer: "Sim. Fornecemos assistente de importação (planilha ou API) para clientes, planos e usuários dos SaaS que você já opera." },
];

/* --------------------------------- Rota --------------------------------- */

export const Route = createFileRoute("/white-label")({
  head: () => ({
    meta: [
      { title: "White Label — Crie sua própria plataforma SaaS | Impulsionando" },
      { name: "description", content: "Venda sistemas com sua marca, seu domínio e seu faturamento. Arquitetura SaaS white-label completa para agências, consultorias, franqueadoras e grupos empresariais." },
      { property: "og:title", content: "White Label — Sua plataforma SaaS pronta" },
      { property: "og:description", content: "Sua marca, seu domínio, seus clientes, seu faturamento — sem precisar desenvolver." },
      { property: "og:url", content: "https://impulsionando.com.br/white-label" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/white-label" }],
    scripts: [buildFaqJsonLd(FAQS)],
  }),
  component: WhiteLabelPage,
});

function WhiteLabelPage() {
  return (
    <div data-tenant="whitelabel" className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <TenantHero
          className="bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground"
          align="left"
          eyebrow={<><Layers className="h-3.5 w-3.5" /> White Label · Arquitetura SaaS</>}
          title={
            <>
              Crie sua própria plataforma SaaS —{" "}
              <span className="opacity-80">sem precisar desenvolver.</span>
            </>
          }
          subtitle="Venda sistemas com a sua marca. Controle clientes, faturamento e módulos. Para agências, consultorias, franqueadoras e grupos empresariais que querem transformar serviço em receita recorrente."
          actions={
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2 bg-background text-primary hover:bg-background/90">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  Quero minha plataforma <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/white-label/parceiro">
                  <PlayCircle className="w-4 h-4" /> Ver console do parceiro
                </Link>
              </Button>
            </div>
          }
        />

        {/* STATS */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <StatGrid stats={STATS} columns={4} />
        </section>

        {/* O QUE VOCÊ RECEBE */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader
            eyebrow="O que você recebe"
            title="Uma operação SaaS completa, chave-na-mão"
            description="Você cuida de vender e atender seus clientes. Nós entregamos a tecnologia."
          />
          <div className="mt-10">
            <FeatureGrid features={RECEIVES} columns={3} />
          </div>
        </section>

        {/* STACK DO PARCEIRO */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeader
              eyebrow="Stack do parceiro"
              title="Console completo para revender com controle total"
              description="Cada capacidade abaixo já vem entregue no console do parceiro. Nada precisa ser desenvolvido."
            />
            <div className="mt-10">
              <FeatureGrid features={PARTNER_STACK} columns={4} />
            </div>
          </div>
        </section>

        {/* JORNADA */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <SectionHeader
            eyebrow="Como implantamos"
            title="Sua plataforma publicada em 48h"
            description="Metodologia usada em todos os parceiros homologados do ecossistema."
          />
          <div className="mt-10">
            <StepList steps={STEPS} />
          </div>
        </section>

        {/* PLANOS */}
        <section id="tiers" className="mx-auto max-w-7xl px-6 py-16 scroll-mt-24">
          <SectionHeader
            eyebrow="Planos White Label"
            title="Escolha por volume e maturidade"
            description="Você vende, atende, cobra e opera. A tecnologia é fornecida pela Impulsionando."
          />
          <div className="grid gap-5 md:grid-cols-3 mt-10">
            <Card className="p-6 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Entrada</div>
              <h3 className="text-xl font-semibold tracking-tight mt-1">Start</h3>
              <p className="text-sm text-muted-foreground mt-2">Para começar a produtizar sua carteira.</p>
              <ul className="text-sm mt-4 space-y-2 flex-1 opacity-90">
                <li>• Até 5 clientes no Essencial</li>
                <li>• Ou até 2 clientes no Ideal</li>
                <li>• Sua marca, seu domínio, seus preços</li>
                <li>• Console do parceiro completo</li>
              </ul>
              <Button asChild className="mt-5">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Contratar Start</a>
              </Button>
            </Card>

            <Card className="p-6 flex flex-col border-primary/60 ring-1 ring-primary/30 shadow-lg">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase tracking-wider text-primary">Recomendado</div>
              <h3 className="text-xl font-semibold tracking-tight mt-1">Growth</h3>
              <p className="text-sm text-muted-foreground mt-2">Para quem já tem carteira e quer escalar.</p>
              <ul className="text-sm mt-4 space-y-2 flex-1 opacity-90">
                <li>• Limites ampliados de clientes</li>
                <li>• Todos os módulos disponíveis</li>
                <li>• Dashboards consolidados</li>
                <li>• Onboarding assistido dos seus clientes</li>
              </ul>
              <Button asChild className="mt-5">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Contratar Growth</a>
              </Button>
            </Card>

            <Card className="p-6 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                <Crown className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Sob consulta</div>
              <h3 className="text-xl font-semibold tracking-tight mt-1">Enterprise</h3>
              <p className="text-sm text-muted-foreground mt-2">Sem limites práticos.</p>
              <ul className="text-sm mt-4 space-y-2 flex-1 opacity-90">
                <li>• Volume ilimitado de clientes</li>
                <li>• Módulos sob medida</li>
                <li>• SLA dedicado e gerente de conta</li>
                <li>• Infra isolada e gateway próprio</li>
              </ul>
              <Button asChild variant="outline" className="mt-5">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Solicitar apresentação</a>
              </Button>
            </Card>
          </div>
        </section>

        {/* TRUST */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader eyebrow="Garantias" title="Arquitetura pronta para escala corporativa" />
          <div className="mt-10">
            <TrustBadges badges={TRUST} columns={4} />
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeader eyebrow="Quem já opera" title="Parceiros que produtizaram sua carteira" />
            <div className="mt-10">
              <TestimonialGrid testimonials={TESTIMONIALS} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <SectionHeader eyebrow="Perguntas frequentes" title="Tudo o que parceiros perguntam antes de assinar" />
          <div className="mt-10">
            <FaqAccordion faqs={FAQS} />
          </div>
        </section>

        {/* CTA FINAL */}
        <CtaBlock
          variant="primary"
          eyebrow="Pronto para lançar?"
          title="Sua plataforma White Label no ar em 48h"
          description="Fale com um especialista e receba a proposta com plano, módulos e cronograma de implantação."
          actions={
            <>
              <Button asChild size="lg" className="gap-2 bg-background text-primary hover:bg-background/90">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/white-label/parceiro">
                  Explorar console do parceiro <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </>
          }
        />
      </main>
      <PublicFooter />
    </div>
  );
}
