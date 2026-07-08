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

        {/* PLANO ÚNICO POR DOMÍNIO — descontos por volume */}
        <section id="tiers" className="mx-auto max-w-7xl px-6 py-16 scroll-mt-24">
          <SectionHeader
            eyebrow="Modelo comercial White Label"
            title="Plano único por domínio, com desconto por volume"
            description="R$ 299,90 mensais por cliente (por domínio ativo), independentemente dos módulos ou recursos que cada cliente utilize. Mínimo de 10 domínios por parceiro. A mensalidade se recalcula em tempo real conforme o volume de domínios ativos no seu White Label."
          />

          {/* Preço-âncora */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch gap-5">
            <Card className="p-8 flex-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
                <Wallet className="w-4 h-4" /> Preço por domínio ativo
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">R$ 299,90</span>
                <span className="text-sm text-muted-foreground">/mês por cliente</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Inclui plataforma completa, todos os módulos, marca própria, domínio próprio,
                console do parceiro, isolamento multi-tenant e roadmap de novos módulos —
                sem mensalidade extra por recurso.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Mínimo de 10 domínios · R$ 2.999,00/mês
              </div>
            </Card>

            <Card className="p-8 flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Cobrado à parte (uso variável)
              </div>
              <h3 className="text-lg font-semibold mt-2">Serviços de mensageria e voz</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                WhatsApp Business API, VoIP e SMS têm investimento próprio conforme o
                pacote escolhido por cada cliente-final. Não estão inclusos na mensalidade
                por domínio.
              </p>
              <ul className="text-sm mt-4 space-y-2 opacity-90">
                <li>• WhatsApp — pacotes por sessão/mês</li>
                <li>• VoIP — pacotes por minuto/mês</li>
                <li>• SMS — pacotes por envio/mês</li>
              </ul>
            </Card>
          </div>

          {/* Tabela de descontos por volume */}
          <div className="mt-10">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">Descontos por volume — recálculo em tempo real</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3">Faixa de domínios ativos</th>
                    <th className="text-left px-5 py-3">Desconto</th>
                    <th className="text-left px-5 py-3">Valor por domínio</th>
                    <th className="text-left px-5 py-3">Exemplo de mensalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-5 py-4">Até 10 <span className="text-xs text-muted-foreground">(mínimo)</span></td>
                    <td className="px-5 py-4">—</td>
                    <td className="px-5 py-4 font-medium">R$ 299,90</td>
                    <td className="px-5 py-4"><strong>R$ 2.999,00</strong> <span className="text-xs text-muted-foreground">(10 domínios)</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">11 a 50</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">-10%</span></td>
                    <td className="px-5 py-4 font-medium">R$ 269,91</td>
                    <td className="px-5 py-4"><strong>R$ 13.495,50</strong> <span className="text-xs text-muted-foreground">(50 domínios)</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">51 a 100</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">-15%</span></td>
                    <td className="px-5 py-4 font-medium">R$ 254,92</td>
                    <td className="px-5 py-4"><strong>R$ 25.491,50</strong> <span className="text-xs text-muted-foreground">(100 domínios)</span></td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="px-5 py-4">A partir de 101</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">-20%</span></td>
                    <td className="px-5 py-4 font-medium">R$ 239,92</td>
                    <td className="px-5 py-4"><strong>R$ 24.231,92</strong> <span className="text-xs text-muted-foreground">(101 domínios)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed max-w-3xl">
              O desconto é aplicado sobre o valor por domínio e se ajusta automaticamente
              conforme o número de domínios ativos varia no console do parceiro — sem
              renegociação de contrato. Serviços de WhatsApp, VoIP e SMS seguem cobrança
              própria por pacote, conforme o consumo de cada cliente-final.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  Simular minha mensalidade <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/white-label/parceiro">Ver console do parceiro</Link>
              </Button>
            </div>
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
