/**
 * /ecossistema — Página comercial pública "Conheça o Ecossistema Impulsionando".
 *
 * Detalha a exclusividade da Impulsionando em oferecer TUDO de uma só vez,
 * num único local, com total controle e informação. NÃO contém filtros de
 * busca: a busca é exclusiva dos Impulsionitos e fica em /busca (gated).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import {
  Sparkles, ShieldCheck, Layers, Workflow, Crown, Building2, Search,
  BarChart3, Globe, MessageCircle, Wallet, Bot, Gauge, Lock, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/ecossistema")({
  head: () => ({
    meta: [
      { title: "Conheça o Ecossistema Impulsionando — tudo num único lugar, com controle total" },
      { name: "description", content: "O único ecossistema brasileiro que conecta empresas, consumidores, automações, pagamentos, marketing e governança em uma só plataforma. Controle total e informação em tempo real." },
      { property: "og:title", content: "Conheça o Ecossistema Impulsionando" },
      { property: "og:description", content: "Tudo de uma só vez, em um único local, com controle total e informação em tempo real. Empresas + consumidores + automações + dados." },
      { property: "og:url", content: "https://impulsionando.com.br/ecossistema" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/ecossistema" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Ecossistema", path: "/ecossistema" },
      ]),
    ],
  }),
  component: EcossistemaCommercialPage,
});

const PILLARS = [
  { icon: Building2, title: "Empresas operando 360º", desc: "CRM, agenda, vendas, financeiro, fiscal, marketing, IA, automações — em um único core, sem 'colcha de retalhos'." },
  { icon: Crown, title: "Consumidores no Clube", desc: "Impulsionitos têm vantagens reais, vouchers, cashback, recomendações e atendimento direto com as marcas do ecossistema." },
  { icon: Workflow, title: "Automação ponta-a-ponta", desc: "Funil completo (captar → converter → relacionar → reter → expandir) automatizado com N8N + Agentes IA." },
  { icon: ShieldCheck, title: "Governança e RLS multi-tenant", desc: "Cada cliente é um tenant isolado, com permissões, papéis, auditoria e billing nativos." },
  { icon: BarChart3, title: "Informação em tempo real", desc: "Dashboards proporcionais ao plano, KPIs operacionais e executivos, sem planilhas paralelas." },
  { icon: Wallet, title: "Pagamentos e billing nativos", desc: "Assinatura, PDV, marketplace, taxa de intermediação digital e cobrança — tudo dentro da plataforma." },
];

const DIFFERENTIALS = [
  "Único ponto de verdade: sem N planilhas, N sistemas, N logins.",
  "Identidade Impulsionando + branding white-label por cliente.",
  "Marketplace B2B com Taxa de Intermediação Digital transparente (0,50% padrão).",
  "Agentes IA por nicho, treinados com o funil Impulsionando.",
  "Consumidor Final tem default-deny: só vê o que faz sentido para ele.",
  "Pré-assinatura usa CheckoutShell — zero atrito para virar cliente pagante.",
];

function EcossistemaCommercialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Conheça o Ecossistema
            </Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Tudo de uma só vez, em um único lugar — com controle total e informação real.
            </h1>
            <p className="mt-5 text-white/90 max-w-3xl mx-auto text-lg">
              A Impulsionando é o único ecossistema brasileiro que une <strong>empresas</strong>,
              <strong> consumidores</strong>, <strong>automações</strong>, <strong>pagamentos</strong> e
              <strong> governança</strong> dentro de uma mesma plataforma. Sem integrar 10 ferramentas
              diferentes. Sem perder dado pelo caminho. Sem letras miúdas.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/busca">
                  <Search className="w-4 h-4" /> Busque o que Precisa
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2">
                <Link to="/clube">
                  <Crown className="w-4 h-4" /> Entrar para o Clube
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-white/70">
              A busca é exclusiva dos <strong>Impulsionitos</strong> (sócios do Clube — entrada gratuita).
            </p>
          </div>
        </section>

        {/* PILARES */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Seis pilares, um único core</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Cada cliente — bar, clínica, imobiliária, evento, advocacia — é um tenant do mesmo core
              Impulsionando. Nada vive isolado.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="p-6 hover:shadow-elegant transition-shadow">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground mb-3">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">Exclusividade Impulsionando</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold">Por que não existe nada igual</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DIFFERENTIALS.map((d) => (
                <div key={d} className="flex items-start gap-3 rounded-lg bg-background p-4 border">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO O ECOSSISTEMA FUNCIONA */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Como tudo se conecta</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Empresas operam dentro do core. Consumidores vivem o Clube. Dados, automação e IA
              circulam entre os dois lados — em tempo real.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6">
              <Building2 className="w-7 h-7 text-primary mb-3" />
              <h3 className="font-semibold">Lado das empresas</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Dashboards e KPIs proporcionais ao plano</li>
                <li>• CRM, agenda, financeiro, fiscal, marketing</li>
                <li>• PDV, marketplace, locação, assistência</li>
                <li>• Agentes IA e N8N por nicho</li>
              </ul>
            </Card>
            <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <Workflow className="w-7 h-7 text-primary mb-3" />
              <h3 className="font-semibold">Núcleo Impulsionando</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Auth, RBAC e RLS multi-tenant</li>
                <li>• Billing e CheckoutShell</li>
                <li>• Funil unificado (captar → reter)</li>
                <li>• Governança e auditoria</li>
              </ul>
            </Card>
            <Card className="p-6">
              <Crown className="w-7 h-7 text-primary mb-3" />
              <h3 className="font-semibold">Lado do consumidor</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Clube de Vantagens (free + premium)</li>
                <li>• Vouchers, cashback, recomendações</li>
                <li>• Histórico permanente de compras / garantias</li>
                <li>• Busca exclusiva por CEP, distância, benefícios</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* RESTRIÇÃO DA BUSCA */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="p-8 sm:p-10 text-center border-primary/30">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
                <Lock className="w-3.5 h-3.5" /> Acesso restrito
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold">A busca é exclusiva dos Impulsionitos</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Somente sócios do Clube (os <strong>Impulsionitos</strong>) podem usar o sistema para
                encontrar o negócio desejado mais próximo, com filtros por CEP, cidade, bairro,
                distância, categoria, avaliação e benefícios. A entrada é gratuita — o plano pago
                libera vantagens adicionais.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Button asChild size="lg" className="gap-2 bg-gradient-primary text-primary-foreground">
                  <Link to="/clube/cadastro">
                    <Crown className="w-4 h-4" /> Quero ser Impulsionito (grátis)
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/busca">
                    <Search className="w-4 h-4" /> Já sou — Buscar agora
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA FINAL — W17: 3 entradas no ecossistema */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3">Faça parte do ecossistema</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Três formas de entrar</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Empresa, parceiro ou consumidor — cada perfil tem a sua porta de entrada no core Impulsionando.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-8 bg-gradient-hero text-primary-foreground border-0 flex flex-col">
              <Building2 className="w-8 h-8 mb-3" />
              <h3 className="text-xl font-bold">Empresas</h3>
              <p className="text-white/85 mt-2 text-sm flex-1">
                Coloque sua operação dentro do core Impulsionando: CRM, agenda, financeiro, automação e IA — com controle total e dados em tempo real.
              </p>
              <Button asChild className="mt-5 bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/orcamento">Quero conhecer <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </Card>
            <Card className="p-8 border-primary/30 flex flex-col">
              <Globe className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold">White Label</h3>
              <p className="text-muted-foreground mt-2 text-sm flex-1">
                Agências, integradores e revendedores vendem a plataforma inteira com a sua marca, seu domínio e sua tabela de preços — comissão recorrente.
              </p>
              <Button asChild variant="outline" className="mt-5 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/white-label">Ver White Label <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </Card>
            <Card className="p-8 border-primary/30 flex flex-col bg-gradient-to-br from-primary/5 to-transparent">
              <Crown className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold">Clube Impulsionito</h3>
              <p className="text-muted-foreground mt-2 text-sm flex-1">
                Consumidor final entra grátis no Clube e vira <strong>Impulsionito</strong>: vouchers, cashback, recomendações e busca exclusiva por CEP e benefícios.
              </p>
              <Button asChild className="mt-5 gap-2 bg-gradient-primary text-primary-foreground">
                <Link to="/clube">Entrar no Clube <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
